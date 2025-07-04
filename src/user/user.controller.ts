import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpException,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { GetUsersQueryDto, CreateUserDto, UpdateUserDto } from './dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(
    @Query(ValidationPipe)
    query: GetUsersQueryDto,
  ): Promise<User[]> {
    const { skip, take, search, orderBy, sortOrder } = query;

    // Build where clause for search
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // Build orderBy clause
    const orderByClause: Prisma.UserOrderByWithRelationInput = {};
    if (
      orderBy &&
      (orderBy === 'id' || orderBy === 'email' || orderBy === 'name')
    ) {
      orderByClause[orderBy] = sortOrder || 'asc';
    } else {
      orderByClause.id = 'asc';
    }

    return this.userService.users({
      skip: skip || 0,
      take: take || 10,
      where,
      orderBy: orderByClause,
    });
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.userService.user({ id });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string): Promise<User> {
    const user = await this.userService.user({ email });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Post()
  async createUser(
    @Body(ValidationPipe) userData: CreateUserDto,
  ): Promise<User> {
    try {
      return await this.userService.createUser(userData);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new HttpException(
            'User with this email already exists',
            HttpStatus.CONFLICT,
          );
        }
      }
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) userData: UpdateUserDto,
  ): Promise<User> {
    try {
      return await this.userService.updateUser({
        where: { id },
        data: userData,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new HttpException(
            'User with this email already exists',
            HttpStatus.CONFLICT,
          );
        }
        if (error.code === 'P2025') {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
      }
      throw new HttpException(
        'Failed to update user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    try {
      return await this.userService.deleteUser({ id });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
      }
      throw new HttpException(
        'Failed to delete user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
