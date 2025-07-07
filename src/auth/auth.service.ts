import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './interfaces/request-with-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if user already exists (including soft-deleted users)
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && !existingUser.deletedAt) {
      throw new ConflictException('User with this email already exists');
    }

    // If user was soft-deleted, restore them with new password
    if (existingUser && existingUser.deletedAt) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          password: hashedPassword,
          deletedAt: null,
          updatedAt: new Date(),
        },
        select: { id: true, email: true, name: true },
      });

      return {
        user,
        access_token: this.jwtService.sign({
          sub: user.id,
          email: user.email,
        }),
      };
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: { id: true, email: true, name: true },
    });

    return {
      user,
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
      }),
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      user,
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
      }),
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
