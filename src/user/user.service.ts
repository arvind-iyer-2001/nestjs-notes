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

  async findManyUsers(
    query: GetUsersQueryDto,
    includeDeleted: boolean = false,
  ): Promise<User[]> {
    const searchCriteria = this.buildSearchCriteria(query, includeDeleted);
    const { skip, take } = this.buildPaginationParams(query);
    const orderBy = this.buildOrderByClause(query);

    return this.prisma.user.findMany({
      skip,
      take,
      where: searchCriteria,
      orderBy,
    });
  }

  async findUserById(
    id: number,
    includeDeleted: boolean = false,
  ): Promise<User> {
    const whereClause: Prisma.UserWhereInput = {
      id,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    const user = await this.prisma.user.findFirst({
      where: whereClause,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUserByEmail(
    email: string,
    includeDeleted: boolean = false,
  ): Promise<User> {
    const whereClause: Prisma.UserWhereInput = {
      email,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    const user = await this.prisma.user.findFirst({
      where: whereClause,
    });

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
      await this.ensureUserExists(id);

      return await this.prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
    } catch (error) {
      this.handleDatabaseError(error, 'Failed to delete user');
    }
  }

  async permanentlyDeleteUser(id: number): Promise<User> {
    try {
      // Check if user exists (including soft deleted)
      await this.ensureUserExists(id, true);

      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      this.handleDatabaseError(error, 'Failed to permanently delete user');
    }
  }

  async restoreUser(id: number): Promise<User> {
    try {
      // Find soft deleted user
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: { not: null },
        },
      });

      if (!user) {
        throw new NotFoundException('Deleted user not found');
      }

      return await this.prisma.user.update({
        where: { id },
        data: {
          deletedAt: null,
        },
      });
    } catch (error) {
      this.handleDatabaseError(error, 'Failed to restore user');
    }
  }

  async findDeletedUsers(query: GetUsersQueryDto): Promise<User[]> {
    const searchCriteria = this.buildSearchCriteria(query, false);
    const { skip, take } = this.buildPaginationParams(query);
    const orderBy = this.buildOrderByClause(query);

    return this.prisma.user.findMany({
      skip,
      take,
      where: {
        ...searchCriteria,
        deletedAt: { not: null },
      },
      orderBy,
    });
  }

  // ========================================
  // PRIVATE BUSINESS LOGIC METHODS
  // ========================================

  private buildSearchCriteria(
    query: GetUsersQueryDto,
    includeDeleted: boolean = false,
  ): Prisma.UserWhereInput {
    const baseWhere: Prisma.UserWhereInput = {
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    if (!query.search) {
      return baseWhere;
    }

    return {
      ...baseWhere,
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
    const validOrderFields = [
      'id',
      'email',
      'name',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ];

    if (query.orderBy && validOrderFields.includes(query.orderBy)) {
      return { [query.orderBy]: query.sortOrder || 'asc' };
    }

    // ✅ Business rule: default ordering
    return { createdAt: 'desc' };
  }

  private async validateEmailUniqueness(
    email: string,
    excludeId?: number,
  ): Promise<void> {
    // Use findFirst instead of findUnique to filter by deletedAt
    const whereClause: Prisma.UserWhereInput = {
      email,
      deletedAt: null, // Only check active users
      ...(excludeId ? { id: { not: excludeId } } : {}),
    };

    const existingUser = await this.prisma.user.findFirst({
      where: whereClause,
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
  }

  async ensureUserExists(
    id: number,
    includeDeleted: boolean = false,
  ): Promise<void> {
    const whereClause: Prisma.UserWhereInput = {
      id,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    const user = await this.prisma.user.findFirst({
      where: whereClause,
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
