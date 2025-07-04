import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateUserDto, GetUsersQueryDto, UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findManyUsers(query: GetUsersQueryDto): Promise<User[]> {
    // ✅ Business logic for building search criteria
    const searchCriteria = this.buildSearchCriteria(query);

    // ✅ Business logic for pagination and ordering
    const { skip, take } = this.buildPaginationParams(query);
    const orderBy = this.buildOrderByClause(query);

    return this.prisma.user.findMany({
      skip,
      take,
      where: searchCriteria,
      orderBy,
    });
  }

  async findUserById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    // ✅ Business logic for validation
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUserByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // ✅ Business logic for validation
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    try {
      // ✅ Business logic for user creation
      await this.validateEmailUniqueness(userData.email);

      return await this.prisma.user.create({
        data: userData,
      });
    } catch (error) {
      // ✅ Business logic for error handling
      this.handleDatabaseError(error, 'Failed to create user');
    }
  }

  async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
    try {
      // ✅ Business logic for validation
      await this.ensureUserExists(id);

      if (userData.email) {
        await this.validateEmailUniqueness(userData.email, id);
      }

      return await this.prisma.user.update({
        where: { id },
        data: userData,
      });
    } catch (error) {
      this.handleDatabaseError(error, 'Failed to update user');
    }
  }

  async deleteUser(id: number): Promise<User> {
    try {
      // ✅ Business logic for validation
      await this.ensureUserExists(id);

      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      this.handleDatabaseError(error, 'Failed to delete user');
    }
  }

  // ========================================
  // PRIVATE BUSINESS LOGIC METHODS
  // ========================================

  private buildSearchCriteria(query: GetUsersQueryDto): Prisma.UserWhereInput {
    if (!query.search) return {};

    return {
      OR: [
        { email: { contains: query.search.trim(), mode: 'insensitive' } },
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
      ],
    };
  }

  private buildPaginationParams(query: GetUsersQueryDto) {
    return {
      skip: query.skip || 0,
      take: Math.min(query.take || 10, 100), // ✅ Business rule: max 100 items
    };
  }

  private buildOrderByClause(
    query: GetUsersQueryDto,
  ): Prisma.UserOrderByWithRelationInput {
    const validOrderFields = ['id', 'email', 'name'];

    if (query.orderBy && validOrderFields.includes(query.orderBy)) {
      return { [query.orderBy]: query.sortOrder || 'asc' };
    }

    // ✅ Business rule: default ordering
    return { id: 'asc' };
  }

  private async validateEmailUniqueness(
    email: string,
    excludeId?: number,
  ): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && (!excludeId || existingUser.id !== excludeId)) {
      throw new ConflictException('User with this email already exists');
    }
  }

  private async ensureUserExists(id: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private handleDatabaseError(error: any, fallbackMessage: string): never {
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException('Resource already exists');
        case 'P2025':
          throw new NotFoundException('Resource not found');
        default:
          throw new InternalServerErrorException('Database operation failed');
      }
    }

    if (error instanceof HttpException) {
      throw error; // Re-throw HTTP exceptions
    }

    throw new InternalServerErrorException(fallbackMessage);
  }
}
