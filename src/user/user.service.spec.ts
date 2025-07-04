import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { GetUsersQueryDto } from './dto';

describe('UserService', () => {
  let service: UserService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockUsers: User[] = [
    mockUser,
    {
      id: 2,
      email: 'user2@example.com',
      name: 'User Two',
    },
  ];

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========================================
  // NEW BUSINESS LOGIC METHODS TESTS
  // ========================================

  describe('findManyUsers', () => {
    it('should return users with default parameters', async () => {
      const query: GetUsersQueryDto = {};
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findManyUsers(query);

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        orderBy: { id: 'asc' },
      });
    });

    it('should return users with search query', async () => {
      const query: GetUsersQueryDto = { search: 'test' };
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findManyUsers(query);

      expect(result).toEqual([mockUser]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          OR: [
            { email: { contains: 'test', mode: 'insensitive' } },
            { name: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        orderBy: { id: 'asc' },
      });
    });

    it('should return users with pagination', async () => {
      const query: GetUsersQueryDto = { skip: 10, take: 20 };
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findManyUsers(query);

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 20,
        where: {},
        orderBy: { id: 'asc' },
      });
    });

    it('should limit take to maximum of 100', async () => {
      const query: GetUsersQueryDto = { take: 150 };
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 100, // Should be limited to 100
        where: {},
        orderBy: { id: 'asc' },
      });
    });

    it('should return users with custom ordering', async () => {
      const query: GetUsersQueryDto = { orderBy: 'name', sortOrder: 'desc' };
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findManyUsers(query);

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        orderBy: { name: 'desc' },
      });
    });

    it('should use default ordering for invalid orderBy field', async () => {
      const query = {
        orderBy: 'invalid',
      } as unknown as GetUsersQueryDto;
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findManyUsers(query);

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        orderBy: { id: 'asc' }, // Should default to id: asc
      });
    });
  });

  describe('findUserById', () => {
    it('should return a user when found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findUserById(1);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findUserById(999)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user when found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.findUserByEmail('nonexistent@example.com'),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });
  });

  describe('createUser', () => {
    const createUserData = {
      email: 'new@example.com',
      name: 'New User',
    };

    it('should create and return a new user', async () => {
      const createdUser = { id: 3, ...createUserData };

      // Mock email uniqueness check (no existing user)
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.createUser(createUserData);

      expect(result).toEqual(createdUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserData.email },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createUserData,
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      // Mock existing user found
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserData)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should handle Prisma P2002 error (unique constraint)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
        },
      );
      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.createUser(createUserData)).rejects.toThrow(
        new ConflictException('Resource already exists'),
      );
    });

    it('should handle Prisma P2025 error (record not found)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );
      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.createUser(createUserData)).rejects.toThrow(
        new NotFoundException('Resource not found'),
      );
    });

    it('should handle unknown Prisma errors', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const prismaError = new PrismaClientKnownRequestError('Unknown error', {
        code: 'P2000',
        clientVersion: '4.0.0',
      });
      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.createUser(createUserData)).rejects.toThrow(
        new InternalServerErrorException('Database operation failed'),
      );
    });

    it('should handle non-Prisma errors', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockRejectedValue(
        new Error('Network error'),
      );

      await expect(service.createUser(createUserData)).rejects.toThrow(
        new InternalServerErrorException('Failed to create user'),
      );
    });
  });

  describe('updateUser', () => {
    const updateData = { name: 'Updated Name' };

    it('should update and return the user', async () => {
      const updatedUser = { ...mockUser, ...updateData };

      // Mock user exists check
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(1, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateUser(999, updateData)).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should validate email uniqueness when updating email', async () => {
      const updateDataWithEmail = { email: 'updated@example.com' };
      const updatedUser = { ...mockUser, ...updateDataWithEmail };

      // Mock user exists check
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // First call for user existence
        .mockResolvedValueOnce(null); // Second call for email uniqueness
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(1, updateDataWithEmail);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { email: updateDataWithEmail.email },
      });
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const updateDataWithEmail = { email: 'existing@example.com' };
      const existingUser = {
        id: 2,
        email: 'existing@example.com',
        name: 'Other User',
      };

      // Mock user exists check
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // First call for user existence
        .mockResolvedValueOnce(existingUser); // Second call finds existing email

      await expect(service.updateUser(1, updateDataWithEmail)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should allow updating to same email', async () => {
      const updateDataWithEmail = { email: 'test@example.com' }; // Same as mockUser email
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      // Mock user exists check
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // First call for user existence
        .mockResolvedValueOnce(mockUser); // Second call finds same user
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(1, updateDataWithEmail);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete and return the user', async () => {
      // Mock user exists check
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.deleteUser(1);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser(999)).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(mockPrismaService.user.delete).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // PRIVATE METHOD TESTS (through public methods)
  // ========================================

  describe('buildSearchCriteria (tested through findManyUsers)', () => {
    it('should return empty object when no search term', async () => {
      const query: GetUsersQueryDto = {};
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should build OR criteria for search term', async () => {
      const query: GetUsersQueryDto = { search: '  test  ' }; // With whitespace
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: { contains: 'test', mode: 'insensitive' } },
              { name: { contains: 'test', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });
  });

  describe('buildPaginationParams (tested through findManyUsers)', () => {
    it('should use default values when not provided', async () => {
      const query: GetUsersQueryDto = {};
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should enforce maximum take limit', async () => {
      const query: GetUsersQueryDto = { take: 500 };
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Should be capped at 100
        }),
      );
    });
  });

  describe('buildOrderByClause (tested through findManyUsers)', () => {
    it('should use provided valid orderBy field', async () => {
      const query: GetUsersQueryDto = { orderBy: 'email', sortOrder: 'desc' };
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { email: 'desc' },
        }),
      );
    });

    it('should default sortOrder to asc when not provided', async () => {
      const query: GetUsersQueryDto = { orderBy: 'name' };
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should default to id:asc for invalid orderBy field', async () => {
      const query = {
        orderBy: 'invalid',
      } as unknown as GetUsersQueryDto;
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { id: 'asc' },
        }),
      );
    });
  });
});
