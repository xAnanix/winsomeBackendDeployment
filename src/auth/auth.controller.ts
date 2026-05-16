import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Get,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Response, CookieOptions } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";

const getAuthCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
});

const getAuthClearCookieOptions = (): CookieOptions => {
  const { httpOnly, secure, sameSite, path } = getAuthCookieOptions();

  return {
    httpOnly,
    secure,
    sameSite,
    path,
  };
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, user } = await this.authService.register(registerDto);
    response.cookie("Authentication", token, getAuthCookieOptions());
    return { user };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, user } = await this.authService.login(loginDto);
    response.cookie("Authentication", token, getAuthCookieOptions());
    return { user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({ status: 200, description: "Logout successful" })
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("Authentication", getAuthClearCookieOptions());
    return { message: "Logged out successfully" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current authenticated user" })
  @ApiResponse({
    status: 200,
    description: "Current user retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  me(@CurrentUser() user: any) {
    return { user };
  }
}
