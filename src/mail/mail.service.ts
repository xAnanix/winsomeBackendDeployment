import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

type EmailDetail = {
  label: string;
  value: string;
};

type PaymentEmailPayload = {
  to: string;
  recipientName: string;
  bookingId: string;
  hotelName: string;
  roomType: string;
  totalPrice: number;
  transactionId: string;
  checkIn: Date;
  checkOut: Date;
};

type HotelEmailPayload = {
  to: string;
  recipientName: string;
  hotelName: string;
  city: string;
  address: string;
  stars: number;
  status: string;
};

type RoomEmailPayload = {
  to: string;
  recipientName: string;
  hotelName: string;
  roomType: string;
  capacity: number;
  pricePerNight: number;
  availableRoomsCount: number;
};

type BookingStatusEmailPayload = {
  to: string;
  recipientName: string;
  bookingId: string;
  hotelName: string;
  roomType: string;
  status: string;
  checkIn: Date;
  checkOut: Date;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown email error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to send email to ${to} with subject "${subject}": ${errorMessage}`,
        errorStack,
      );
    }
  }

  async sendWelcomeEmail(name: string, email: string, role: string) {
    await this.sendEmail(
      email,
      "Welcome to Winsome",
      this.buildEmailTemplate({
        title: "Welcome to Winsome",
        intro: `Hi ${name}, your account has been created successfully.`,
        details: [
          { label: "Email", value: email },
          { label: "Role", value: role },
          { label: "Registered at", value: this.formatDateTime(new Date()) },
        ],
        closing: "You can now sign in and start managing your bookings.",
      }),
    );
  }

  async sendLoginNotification(name: string, email: string) {
    await this.sendEmail(
      email,
      "New login to your Winsome account",
      this.buildEmailTemplate({
        title: "Login detected",
        intro: `Hi ${name}, we noticed a successful login to your account.`,
        details: [
          { label: "Email", value: email },
          { label: "Login time", value: this.formatDateTime(new Date()) },
        ],
        closing:
          "If this was not you, please reset your password and review your account activity.",
      }),
    );
  }

  async sendPaymentConfirmation(payload: PaymentEmailPayload) {
    await this.sendEmail(
      payload.to,
      "Payment received for your booking",
      this.buildEmailTemplate({
        title: "Payment confirmed",
        intro: `Hi ${payload.recipientName}, your booking payment was completed successfully.`,
        details: [
          { label: "Booking ID", value: payload.bookingId },
          { label: "Hotel", value: payload.hotelName },
          { label: "Room", value: payload.roomType },
          { label: "Check-in", value: this.formatDate(payload.checkIn) },
          { label: "Check-out", value: this.formatDate(payload.checkOut) },
          {
            label: "Total paid",
            value: this.formatAmount(payload.totalPrice),
          },
          { label: "Transaction ID", value: payload.transactionId },
        ],
        closing: "Thank you for your payment. Your booking is now confirmed.",
      }),
    );
  }

  async sendHotelUpdatedNotification(payload: HotelEmailPayload) {
    await this.sendEmail(
      payload.to,
      "Hotel details updated",
      this.buildEmailTemplate({
        title: "Hotel updated",
        intro: `Hi ${payload.recipientName}, one of your hotels was updated successfully.`,
        details: [
          { label: "Hotel", value: payload.hotelName },
          { label: "City", value: payload.city },
          { label: "Address", value: payload.address },
          { label: "Stars", value: payload.stars.toString() },
          { label: "Status", value: payload.status },
          { label: "Updated at", value: this.formatDateTime(new Date()) },
        ],
        closing: "Please review the updated listing if you want to verify the latest details.",
      }),
    );
  }

  async sendHotelDeletedNotification(payload: HotelEmailPayload) {
    await this.sendEmail(
      payload.to,
      "Hotel deleted",
      this.buildEmailTemplate({
        title: "Hotel deleted",
        intro: `Hi ${payload.recipientName}, a hotel listing was removed from your account.`,
        details: [
          { label: "Hotel", value: payload.hotelName },
          { label: "City", value: payload.city },
          { label: "Address", value: payload.address },
          { label: "Deleted at", value: this.formatDateTime(new Date()) },
        ],
        closing: "If this action was unexpected, please review your account access immediately.",
      }),
    );
  }

  async sendRoomUpdatedNotification(payload: RoomEmailPayload) {
    await this.sendEmail(
      payload.to,
      "Room details updated",
      this.buildEmailTemplate({
        title: "Room updated",
        intro: `Hi ${payload.recipientName}, one of your room listings was updated successfully.`,
        details: [
          { label: "Hotel", value: payload.hotelName },
          { label: "Room type", value: payload.roomType },
          { label: "Capacity", value: payload.capacity.toString() },
          {
            label: "Price per night",
            value: this.formatAmount(payload.pricePerNight),
          },
          {
            label: "Available rooms",
            value: payload.availableRoomsCount.toString(),
          },
          { label: "Updated at", value: this.formatDateTime(new Date()) },
        ],
        closing: "The room listing now reflects the latest values in your account.",
      }),
    );
  }

  async sendRoomDeletedNotification(payload: RoomEmailPayload) {
    await this.sendEmail(
      payload.to,
      "Room deleted",
      this.buildEmailTemplate({
        title: "Room deleted",
        intro: `Hi ${payload.recipientName}, a room listing was removed successfully.`,
        details: [
          { label: "Hotel", value: payload.hotelName },
          { label: "Room type", value: payload.roomType },
          { label: "Capacity", value: payload.capacity.toString() },
          { label: "Deleted at", value: this.formatDateTime(new Date()) },
        ],
        closing: "If this action was not intended, please review your account access right away.",
      }),
    );
  }

  async sendBookingStatusUpdatedNotification(
    payload: BookingStatusEmailPayload,
  ) {
    await this.sendEmail(
      payload.to,
      "Booking status updated",
      this.buildEmailTemplate({
        title: "Booking updated",
        intro: `Hi ${payload.recipientName}, the status of your booking has changed.`,
        details: [
          { label: "Booking ID", value: payload.bookingId },
          { label: "Hotel", value: payload.hotelName },
          { label: "Room", value: payload.roomType },
          { label: "New status", value: payload.status },
          { label: "Check-in", value: this.formatDate(payload.checkIn) },
          { label: "Check-out", value: this.formatDate(payload.checkOut) },
          { label: "Updated at", value: this.formatDateTime(new Date()) },
        ],
        closing: "You can sign in at any time to review the latest booking details.",
      }),
    );
  }

  private buildEmailTemplate({
    title,
    intro,
    details,
    closing,
  }: {
    title: string;
    intro: string;
    details: EmailDetail[];
    closing: string;
  }) {
    const detailRows = details
      .map(
        ({ label, value }) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #d9e2ec;font-weight:600;background-color:#f8fafc;">${this.escapeHtml(label)}</td>
            <td style="padding:8px 12px;border:1px solid #d9e2ec;">${this.escapeHtml(value)}</td>
          </tr>
        `,
      )
      .join("");

    return `
      <div style="font-family:Arial,sans-serif;background-color:#f4f7fb;padding:24px;color:#1f2933;">
        <div style="max-width:640px;margin:0 auto;background-color:#ffffff;border-radius:12px;padding:32px;border:1px solid #d9e2ec;">
          <h2 style="margin:0 0 16px;color:#102a43;">${this.escapeHtml(title)}</h2>
          <p style="margin:0 0 20px;line-height:1.6;">${this.escapeHtml(intro)}</p>
          <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
            ${detailRows}
          </table>
          <p style="margin:0;line-height:1.6;">${this.escapeHtml(closing)}</p>
        </div>
      </div>
    `;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private formatDate(date: Date) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  private formatDateTime(date: Date) {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  private formatAmount(amount: number) {
    return amount.toFixed(2);
  }
}
