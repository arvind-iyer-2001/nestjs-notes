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
    return this.userService.findManyUsers(query);
  }

  @Get('deleted')
  async getDeletedUsers(
    @Query(ValidationPipe) query: GetUsersQueryDto,
  ): Promise<User[]> {
    return this.userService.findDeletedUsers(query);
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.findUserById(id);
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string): Promise<User> {
    return this.userService.findUserByEmail(email);
  }

  @Post()
  async createUser(
    @Body(ValidationPipe) userData: CreateUserDto,
  ): Promise<User> {
    return this.userService.createUser(userData);
  }

  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) userData: UpdateUserDto,
  ): Promise<User> {
    return this.userService.updateUser(id, userData);
  }

  // Soft delete
  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.deleteUser(id);
  }

  // Restore soft deleted user
  @Put(':id/restore')
  async restoreUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.restoreUser(id);
  }

  // Permanent delete
  @Delete(':id/permanent')
  async permanentlyDeleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User> {
    return this.userService.permanentlyDeleteUser(id);
  }
}
