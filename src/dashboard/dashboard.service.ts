import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalHotels,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalRevenue,
      recentBookings,
    ] = await Promise.all([
      this.prisma.hotel.count(),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { status: 'PENDING' } }),
      this.prisma.booking.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { totalPrice: true },
      }),
      this.prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          hotel: { select: { name: true } },
        },
      }),
    ]);

    return {
      totalHotels,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      recentBookings,
    };
  }
}