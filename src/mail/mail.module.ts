import { Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import { MailService } from "./mail.service";

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow<string>("MAIL_HOST"),
          port: parseInt(configService.getOrThrow<string>("MAIL_PORT"), 10),
          secure: configService.getOrThrow<string>("MAIL_SECURE") === "true",
          
          auth: {
            user: configService.getOrThrow<string>("MAIL_USER"),
            pass: configService.getOrThrow<string>("MAIL_PASSWORD"),
          },
        },
        defaults: {
          from: configService.getOrThrow<string>("MAIL_FROM"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
