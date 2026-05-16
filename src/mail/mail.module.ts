import { Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import { MailService } from "./mail.service";

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          service: "gmail",
          secure: true,
          family: 4,

          auth: {
            user: configService.getOrThrow<string>("MAIL_USER"),
            pass: configService.getOrThrow<string>("MAIL_PASSWORD"),
          },
        },

        defaults: {
          from: configService.getOrThrow<string>("MAIL_FROM"),
        },
      }),
    }),
  ],

  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
