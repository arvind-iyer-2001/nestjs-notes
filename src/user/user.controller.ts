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
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { GetUsersQueryDto, CreateUserDto, UpdateUserDto } from './dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(
    @Query(ValidationPipe) query: GetUsersQueryDto,
  ): Promise<User[]> {
    // ✅ Controller only handles HTTP concerns
    return this.userService.findManyUsers(query);
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    // ✅ Simple delegation to service
    return this.userService.findUserById(id);
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string): Promise<User> {
    // ✅ Simple delegation to service
    return this.userService.findUserByEmail(email);
  }

  @Post()
  async createUser(
    @Body(ValidationPipe) userData: CreateUserDto,
  ): Promise<User> {
    // ✅ No business logic or error handling in controller
    return this.userService.createUser(userData);
  }

  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) userData: UpdateUserDto,
  ): Promise<User> {
    // ✅ Clean delegation
    return this.userService.updateUser(id, userData);
  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    // ✅ Clean delegation
    return this.userService.deleteUser(id);
  }
}
