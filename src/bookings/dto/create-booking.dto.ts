import { IsUUID, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'hotel-uuid' })
  @IsUUID()
  hotelId: string;

  @ApiProperty({ example: 'room-uuid' })
  @IsUUID()
  roomId: string;

  @ApiProperty({ example: '2024-12-01' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2024-12-05' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  guestCount: number;
}