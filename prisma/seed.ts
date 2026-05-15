import { PrismaClient, UserRole, HotelStatus, BookingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hotel.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@hotel.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@hotel.com' },
    update: {},
    create: {
      name: 'Hotel Manager',
      email: 'manager@hotel.com',
      password: hashedPassword,
      role: UserRole.HOTEL_MANAGER,
    },
  });

  console.log('Created users:', { admin: admin.email, manager: manager.email });

  const hotel1 = await prisma.hotel.upsert({
    where: { id: 'hotel-1' },
    update: {},
    create: {
      id: 'hotel-1',
      name: 'Grand Plaza Hotel',
      city: 'New York',
      address: '123 Times Square, New York, NY 10036',
      stars: 5,
      status: HotelStatus.ACTIVE,
      createdBy: admin.id,
    },
  });

  const hotel2 = await prisma.hotel.upsert({
    where: { id: 'hotel-2' },
    update: {},
    create: {
      id: 'hotel-2',
      name: 'Seaside Resort',
      city: 'Miami',
      address: '456 Ocean Drive, Miami, FL 33139',
      stars: 4,
      status: HotelStatus.ACTIVE,
      createdBy: manager.id,
    },
  });

  const hotel3 = await prisma.hotel.upsert({
    where: { id: 'hotel-3' },
    update: {},
    create: {
      id: 'hotel-3',
      name: 'Mountain View Lodge',
      city: 'Denver',
      address: '789 Mountain Road, Denver, CO 80202',
      stars: 3,
      status: HotelStatus.ACTIVE,
      createdBy: manager.id,
    },
  });

  console.log('Created hotels');

  await prisma.room.upsert({
    where: { id: 'room-1' },
    update: {},
    create: {
      id: 'room-1',
      hotelId: hotel1.id,
      roomType: 'Deluxe King Room',
      capacity: 2,
      pricePerNight: 250,
      availableRoomsCount: 10,
    },
  });

  await prisma.room.upsert({
    where: { id: 'room-2' },
    update: {},
    create: {
      id: 'room-2',
      hotelId: hotel1.id,
      roomType: 'Executive Suite',
      capacity: 4,
      pricePerNight: 450,
      availableRoomsCount: 5,
    },
  });

  await prisma.room.upsert({
    where: { id: 'room-3' },
    update: {},
    create: {
      id: 'room-3',
      hotelId: hotel2.id,
      roomType: 'Ocean View Room',
      capacity: 2,
      pricePerNight: 180,
      availableRoomsCount: 15,
    },
  });

  await prisma.room.upsert({
    where: { id: 'room-4' },
    update: {},
    create: {
      id: 'room-4',
      hotelId: hotel2.id,
      roomType: 'Family Suite',
      capacity: 6,
      pricePerNight: 350,
      availableRoomsCount: 8,
    },
  });

  await prisma.room.upsert({
    where: { id: 'room-5' },
    update: {},
    create: {
      id: 'room-5',
      hotelId: hotel3.id,
      roomType: 'Standard Room',
      capacity: 2,
      pricePerNight: 100,
      availableRoomsCount: 20,
    },
  });

  console.log('Created rooms');

  await prisma.booking.upsert({
    where: { id: 'booking-1' },
    update: {},
    create: {
      id: 'booking-1',
      userId: manager.id,
      hotelId: hotel1.id,
      roomId: 'room-1',
      checkIn: new Date('2024-12-01'),
      checkOut: new Date('2024-12-05'),
      guestCount: 2,
      totalPrice: 1000,
      status: BookingStatus.CONFIRMED,
    },
  });

  await prisma.booking.upsert({
    where: { id: 'booking-2' },
    update: {},
    create: {
      id: 'booking-2',
      userId: manager.id,
      hotelId: hotel2.id,
      roomId: 'room-3',
      checkIn: new Date('2024-12-10'),
      checkOut: new Date('2024-12-15'),
      guestCount: 2,
      totalPrice: 900,
      status: BookingStatus.PENDING,
    },
  });

  console.log('Created bookings');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });