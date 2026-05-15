import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";

@ApiTags("bookings")
@Controller("bookings")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new booking" })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.bookingsService.create(createBookingDto, userId);
  }

  @Get()
  @ApiOperation({ summary: "Get all bookings" })
  @ApiQuery({ name: "status", required: false })
  async findAll(
    @CurrentUser("id") userId: string,
    @CurrentUser("role") userRole: string,
    @Query("status") status?: string,
  ) {
    return this.bookingsService.findAll(userId, userRole, status);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get booking by ID" })
  async findOne(@Param("id") id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update booking status" })
  async updateStatus(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateBookingStatusDto,
    @CurrentUser("id") userId: string,
    @CurrentUser("role") userRole: string,
  ) {
    return this.bookingsService.updateStatus(
      id,
      updateStatusDto,
      userId,
      userRole,
    );
  }

  @Post(":id/pay")
  @ApiOperation({ summary: "Simulate payment for a booking" })
  async simulatePayment(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @CurrentUser("role") userRole: string,
  ) {
    return this.bookingsService.simulatePayment(id, userId, userRole);
  }
}
