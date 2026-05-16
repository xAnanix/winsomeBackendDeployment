import { Module } from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import { RoomsController } from "./rooms.controller";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [MailModule],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
