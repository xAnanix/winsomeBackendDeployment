import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const cookieExtractor = (req: any) => {
      if (!req) {
        return null;
      }

      if (req.cookies?.Authentication) {
        return req.cookies.Authentication;
      }

      const cookieHeader = req.headers?.cookie;
      if (!cookieHeader) {
        return null;
      }

      const match = cookieHeader
        .split(";")
        .map((cookie: string) => cookie.trim())
        .find((cookie: string) => cookie.startsWith("Authentication="));

      if (!match) {
        return null;
      }

      return decodeURIComponent(match.split("=")[1]);
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get("JWT_SECRET") || "hotel-booking-secret-key",
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
