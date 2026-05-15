import { IsString, IsNumber, IsInt, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: 'hotel-uuid' })
  @IsUUID()
  hotelId: string;

  @ApiProperty({ example: 'Deluxe Suite' })
  @IsString()
  roomType: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0)
  pricePerNight: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(0)
  availableRoomsCount: number;
}