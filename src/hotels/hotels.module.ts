import { Module } from "@nestjs/common";
import { HotelsService } from "./hotels.service";
import { HotelsController } from "./hotels.controller";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [MailModule],
  controllers: [HotelsController],
  providers: [HotelsService],
  exports: [HotelsService],
})
export class HotelsModule {}
