import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";
import { BookingStatus } from "@prisma/client";
import { MailService } from "../mail/mail.service";

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: string) {
    const { hotelId, roomId, checkIn, checkOut, guestCount } = createBookingDto;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      throw new BadRequestException(
        "Check-out date must be after check-in date",
      );
    }

    if (checkInDate < new Date()) {
      throw new BadRequestException("Check-in date cannot be in the past");
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    if (room.capacity < guestCount) {
      throw new BadRequestException("Room capacity exceeded");
    }

    const conflictingBookings = await this.prisma.booking.findMany({
      where: {
        roomId,
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          {
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        ],
      },
    });

    if (conflictingBookings.length >= room.availableRoomsCount) {
      throw new BadRequestException("No available rooms for selected dates");
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalPrice = room.pricePerNight * nights;

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId,
          hotelId,
          roomId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guestCount,
          totalPrice,
          status: BookingStatus.PENDING,
        },
      });

      return booking;
    });
  }

  async findAll(userId: string, userRole: string, status?: string) {
    const where: any = {};

    if (userRole !== "ADMIN") {
      where.userId = userId;
    }

    if (status) {
      where.status = status as BookingStatus;
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        hotel: {
          select: { id: true, name: true, city: true, address: true },
        },
        room: {
          select: { id: true, roomType: true, capacity: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        hotel: {
          select: { id: true, name: true, city: true, address: true },
        },
        room: {
          select: { id: true, roomType: true, capacity: true },
        },
      },
    });
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }
    return booking;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateBookingStatusDto,
    userId: string,
    userRole: string,
  ) {
    const booking = await this.findOne(id);

    if (userRole !== "ADMIN" && booking.userId !== userId) {
      throw new BadRequestException("You can only update your own bookings");
    }

    if (
      userRole !== "ADMIN" &&
      updateStatusDto.status === BookingStatus.CANCELLED
    ) {
      const checkInDate = new Date(booking.checkIn);
      const now = new Date();
      const hoursUntilCheckIn =
        (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilCheckIn < 24) {
        throw new BadRequestException(
          "Cannot cancel booking less than 24 hours before check-in",
        );
      }
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: { status: updateStatusDto.status },
    });

    // await this.mailService.sendBookingStatusUpdatedNotification({
    //   to: booking.user.email,
    //   recipientName: booking.user.name,
    //   bookingId: booking.id,
    //   hotelName: booking.hotel.name,
    //   roomType: booking.room.roomType,
    //   status: updatedBooking.status,
    //   checkIn: booking.checkIn,
    //   checkOut: booking.checkOut,
    // });

    return updatedBooking;
  }

  async simulatePayment(bookingId: string, userId: string, userRole: string) {
    const booking = await this.findOne(bookingId);

    if (userRole !== "ADMIN" && booking.userId !== userId) {
      throw new BadRequestException("You can only pay for your own bookings");
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException("Cannot pay for a cancelled booking");
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      return {
        success: true,
        bookingId: booking.id,
        amount: booking.totalPrice,
        transactionId: `SIM-${booking.id.slice(0, 8).toUpperCase()}`,
        status: "ALREADY_CONFIRMED",
        message: "Booking is already confirmed.",
      };
    }

    // const paymentSucceeded = Math.random() >= 0.25;
    const transactionId = `SIM-${booking.id.slice(0, 8).toUpperCase()}-${Date.now()}`;

    // if (!paymentSucceeded) {
    //   return {
    //     success: false,
    //     bookingId: booking.id,
    //     amount: booking.totalPrice,
    //     transactionId,
    //     status: "FAILED",
    //     message: "Payment simulation failed. Please try again.",
    //   };
    // }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CONFIRMED },
    });

    // await this.mailService.sendPaymentConfirmation({
    //   to: booking.user.email,
    //   recipientName: booking.user.name,
    //   bookingId: updatedBooking.id,
    //   hotelName: booking.hotel.name,
    //   roomType: booking.room.roomType,
    //   totalPrice: updatedBooking.totalPrice,
    //   transactionId,
    //   checkIn: booking.checkIn,
    //   checkOut: booking.checkOut,
    // });

    return {
      success: true,
      bookingId: updatedBooking.id,
      amount: updatedBooking.totalPrice,
      transactionId,
      status: "SUCCESS",
      message: "Payment simulated successfully. Booking confirmed.",
    };
  }
}
