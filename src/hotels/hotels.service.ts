import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, Hotel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@Injectable()
export class HotelsService {
  constructor(private prisma: PrismaService) {}

  async create(createHotelDto: CreateHotelDto, userId: string) {
    return this.prisma.hotel.create({
      data: {
        name: createHotelDto.name,
        city: createHotelDto.city,
        address: createHotelDto.address,
        stars: createHotelDto.stars,
        status: createHotelDto.status,
        createdBy: userId,
      },
    });
  }

  async findAll(search?: string, page = 1, limit = 10) {
    const where: Prisma.HotelWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [hotels, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          rooms: true,
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.hotel.count({ where }),
    ]);

    return {
      data: hotels,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: {
        rooms: true,
        createdByUser: {
          select: { name: true, email: true },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }
    return hotel;
  }

  async update(id: string, updateHotelDto: UpdateHotelDto, userId: string, userRole: string) {
    const hotel = await this.findOne(id);

    if (userRole !== 'ADMIN' && hotel.createdBy !== userId) {
      throw new ForbiddenException('You can only update your own hotels');
    }

    return this.prisma.hotel.update({
      where: { id },
      data: updateHotelDto,
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const hotel = await this.findOne(id);

    if (userRole !== 'ADMIN' && hotel.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own hotels');
    }

    await this.prisma.hotel.delete({ where: { id } });
    return { message: 'Hotel deleted successfully' };
  }

  async getAllForBooking() {
    return this.prisma.hotel.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        stars: true,
      },
    });
  }
}