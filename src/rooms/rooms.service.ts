import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";
import { MailService } from "../mail/mail.service";

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(createRoomDto: CreateRoomDto) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: createRoomDto.hotelId },
    });

    if (!hotel) {
      throw new NotFoundException("Hotel not found");
    }

    return this.prisma.room.create({
      data: {
        hotelId: createRoomDto.hotelId,
        roomType: createRoomDto.roomType,
        capacity: createRoomDto.capacity,
        pricePerNight: createRoomDto.pricePerNight,
        availableRoomsCount: createRoomDto.availableRoomsCount,
      },
    });
  }

  async findAll(hotelId?: string) {
    const where = hotelId ? { hotelId } : {};

    return this.prisma.room.findMany({
      where,
      include: {
        hotel: {
          select: { id: true, name: true, city: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        hotel: {
          select: { id: true, name: true, city: true, address: true },
        },
      },
    });
    if (!room) {
      throw new NotFoundException("Room not found");
    }
    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        hotel: {
          select: {
            name: true,
            createdByUser: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    const updatedRoom = await this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
    });

    await this.mailService.sendRoomUpdatedNotification({
      to: room.hotel.createdByUser.email,
      recipientName: room.hotel.createdByUser.name,
      hotelName: room.hotel.name,
      roomType: updatedRoom.roomType,
      capacity: updatedRoom.capacity,
      pricePerNight: updatedRoom.pricePerNight,
      availableRoomsCount: updatedRoom.availableRoomsCount,
    });

    return updatedRoom;
  }

  async remove(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        hotel: {
          select: {
            name: true,
            createdByUser: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    await this.prisma.room.delete({ where: { id } });

    await this.mailService.sendRoomDeletedNotification({
      to: room.hotel.createdByUser.email,
      recipientName: room.hotel.createdByUser.name,
      hotelName: room.hotel.name,
      roomType: room.roomType,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      availableRoomsCount: room.availableRoomsCount,
    });

    return { message: "Room deleted successfully" };
  }

  async getAvailableRooms(
    hotelId: string,
    checkIn: Date,
    checkOut: Date,
    guestCount: number,
  ) {
    const rooms = await this.prisma.room.findMany({
      where: {
        hotelId,
        capacity: { gte: guestCount },
        availableRoomsCount: { gt: 0 },
      },
    });

    const availableRooms = [];

    for (const room of rooms) {
      const conflictingBookings = await this.prisma.booking.findMany({
        where: {
          roomId: room.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          OR: [
            {
              checkIn: { lt: checkOut },
              checkOut: { gt: checkIn },
            },
          ],
        },
      });

      if (conflictingBookings.length < room.availableRoomsCount) {
        availableRooms.push(room);
      }
    }

    return availableRooms;
  }

  async getRoomsByHotelForBooking(hotelId: string) {
    return this.prisma.room.findMany({
      where: { hotelId, availableRoomsCount: { gt: 0 } },
      select: {
        id: true,
        roomType: true,
        capacity: true,
        pricePerNight: true,
        availableRoomsCount: true,
      },
    });
  }
}
