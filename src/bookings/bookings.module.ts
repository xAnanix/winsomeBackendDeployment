import { Module } from "@nestjs/common";
import { BookingsService } from "./bookings.service";
import { BookingsController } from "./bookings.controller";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [MailModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
