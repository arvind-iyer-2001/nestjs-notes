/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';
import { GetUsersQueryDto } from './dto';

describe('UserService', () => {
  let service: UserService;

  // Updated mock user with new timestamp fields
  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null, // Active user
  };

  const mockDeletedUser: User = {
    id: 3,
    email: 'deleted@example.com',
    name: 'Deleted User',
    password: 'hashedPassword123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: new Date('2024-01-02T00:00:00Z'), // Soft deleted
  };

  const mockUsers: User[] = [
    mockUser,
    {
      id: 2,
      email: 'user2@example.com',
      name: 'User Two',
      password: 'hashedPassword123',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      deletedAt: null,
    },
  ];

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
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
  // UPDATED BUSINESS LOGIC METHODS TESTS
  // ========================================

  describe('findManyUsers', () => {
    it('should return active users with default parameters', async () => {
      const query: GetUsersQueryDto = {};
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findManyUsers(query);

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { deletedAt: null }, // Should exclude soft deleted users
        orderBy: { createdAt: 'desc' }, // Default ordering changed
      });
    });

    it('should return users with search query (excluding deleted)', async () => {
      const query: GetUsersQueryDto = { search: 'test' };
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findManyUsers(query);

      expect(result).toEqual([mockUser]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          deletedAt: null,
          OR: [
            { email: { contains: 'test', mode: 'insensitive' } },
            { name: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should include deleted users when includeDeleted is true', async () => {
      const query: GetUsersQueryDto = {};
      const allUsers = [...mockUsers, mockDeletedUser];
      mockPrismaService.user.findMany.mockResolvedValue(allUsers);

      const result = await service.findManyUsers(query, true);

      expect(result).toEqual(allUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {}, // No deletedAt filter when including deleted
        orderBy: { createdAt: 'desc' },
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
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should limit take to maximum of 100', async () => {
      const query: GetUsersQueryDto = { take: 150 };
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 100, // Should be limited to 100
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return users with custom ordering by new timestamp fields', async () => {
      const query: GetUsersQueryDto = {
        orderBy: 'updatedAt',
        sortOrder: 'asc',
      };
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findManyUsers(query);

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { deletedAt: null },
        orderBy: { updatedAt: 'asc' },
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
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' }, // Default changed from id: asc
      });
    });
  });

  describe('findUserById', () => {
    it('should return an active user when found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findUserById(1);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.findUserById(999)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('should exclude soft deleted users by default', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.findUserById(3)).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 3, deletedAt: null },
      });
    });

    it('should include soft deleted users when includeDeleted is true', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockDeletedUser);

      const result = await service.findUserById(3, true);

      expect(result).toEqual(mockDeletedUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 3 }, // No deletedAt filter
      });
    });
  });

  describe('findUserByEmail', () => {
    it('should return an active user when found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.findUserByEmail('nonexistent@example.com'),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('should include soft deleted users when includeDeleted is true', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockDeletedUser);

      const result = await service.findUserByEmail('deleted@example.com', true);

      expect(result).toEqual(mockDeletedUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'deleted@example.com' }, // No deletedAt filter
      });
    });
  });

  describe('createUser', () => {
    const createUserData = {
      email: 'new@example.com',
      name: 'New User',
      password: 'password123',
    };

    it('should create and return a new user with timestamps', async () => {
      const createdUser = {
        id: 3,
        ...createUserData,
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Mock email uniqueness check (no existing active user)
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.createUser(createUserData);

      expect(result).toEqual(createdUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: createUserData.email,
          deletedAt: null,
        },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserData.email,
          name: createUserData.name,
          password: expect.any(String),
        },
      });
    });

    it('should throw ConflictException when email already exists (active user)', async () => {
      // Mock existing active user found
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserData)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should allow creating user with same email as soft deleted user', async () => {
      const createdUser = {
        id: 4,
        ...createUserData,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Mock no active user with this email (soft deleted user should be ignored)
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.createUser({
        email: 'deleted@example.com',
        name: 'New User',
        password: 'password123',
      });

      expect(result).toEqual(createdUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'deleted@example.com',
          deletedAt: null, // Only checks active users
        },
      });
    });
  });

  describe('updateUser', () => {
    const updateData = { name: 'Updated Name' };

    it('should update and return the user', async () => {
      const updatedUser = {
        ...mockUser,
        ...updateData,
        updatedAt: new Date(), // updatedAt should be updated
      };

      // Mock user exists check
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(1, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.updateUser(999, updateData)).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should validate email uniqueness when updating email (excluding soft deleted)', async () => {
      const updateDataWithEmail = { email: 'updated@example.com' };
      const updatedUser = { ...mockUser, ...updateDataWithEmail };

      // Mock user exists check and email uniqueness check
      mockPrismaService.user.findFirst
        .mockResolvedValueOnce(mockUser) // First call for user existence
        .mockResolvedValueOnce(null); // Second call for email uniqueness
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(1, updateDataWithEmail);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.user.findFirst).toHaveBeenNthCalledWith(1, {
        where: { id: 1, deletedAt: null },
      });
      expect(mockPrismaService.user.findFirst).toHaveBeenNthCalledWith(2, {
        where: {
          email: updateDataWithEmail.email,
          deletedAt: null,
          id: { not: 1 },
        },
      });
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const updateDataWithEmail = { email: 'existing@example.com' };
      const existingUser = {
        id: 2,
        email: 'existing@example.com',
        name: 'Other User',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Mock user exists check
      mockPrismaService.user.findFirst
        .mockResolvedValueOnce(mockUser) // First call for user existence
        .mockResolvedValueOnce(existingUser); // Second call finds existing email

      await expect(service.updateUser(1, updateDataWithEmail)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should not allow updating soft deleted user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.updateUser(3, updateData)).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 3, deletedAt: null },
      });
    });
  });

  describe('deleteUser (soft delete)', () => {
    it('should soft delete user by setting deletedAt', async () => {
      const softDeletedUser = {
        ...mockUser,
        deletedAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock user exists check
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(softDeletedUser);

      const result = await service.deleteUser(1);

      expect(result).toEqual(softDeletedUser);
      expect(result.deletedAt).toBeTruthy();
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.deleteUser(999)).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should not allow soft deleting already soft deleted user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.deleteUser(3)).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 3, deletedAt: null },
      });
    });
  });

  // ========================================
  // NEW SOFT DELETE FUNCTIONALITY TESTS
  // ========================================

  describe('restoreUser', () => {
    it('should restore soft deleted user', async () => {
      const restoredUser = {
        ...mockDeletedUser,
        deletedAt: null,
        updatedAt: new Date(),
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockDeletedUser);
      mockPrismaService.user.update.mockResolvedValue(restoredUser);

      const result = await service.restoreUser(3);

      expect(result).toEqual(restoredUser);
      expect(result.deletedAt).toBeNull();
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 3,
          deletedAt: { not: null },
        },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { deletedAt: null },
      });
    });

    it('should throw NotFoundException when deleted user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.restoreUser(999)).rejects.toThrow(
        new NotFoundException('Deleted user not found'),
      );

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when trying to restore active user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.restoreUser(1)).rejects.toThrow(
        new NotFoundException('Deleted user not found'),
      );

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          deletedAt: { not: null },
        },
      });
    });
  });

  describe('permanentlyDeleteUser', () => {
    it('should permanently delete user from database', async () => {
      // Mock user exists check (including deleted)
      mockPrismaService.user.findFirst.mockResolvedValue(mockDeletedUser);
      mockPrismaService.user.delete.mockResolvedValue(mockDeletedUser);

      const result = await service.permanentlyDeleteUser(3);

      expect(result).toEqual(mockDeletedUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 3 }, // Should include deleted users
      });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 3 },
      });
    });

    it('should permanently delete active user', async () => {
      // Mock user exists check (including active)
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.permanentlyDeleteUser(1);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.permanentlyDeleteUser(999)).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(mockPrismaService.user.delete).not.toHaveBeenCalled();
    });
  });

  describe('findDeletedUsers', () => {
    it('should return only soft deleted users', async () => {
      const deletedUsers = [mockDeletedUser];
      mockPrismaService.user.findMany.mockResolvedValue(deletedUsers);

      const result = await service.findDeletedUsers({});

      expect(result).toEqual(deletedUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { deletedAt: { not: null } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should search within deleted users', async () => {
      const query: GetUsersQueryDto = { search: 'deleted' };
      mockPrismaService.user.findMany.mockResolvedValue([mockDeletedUser]);

      const result = await service.findDeletedUsers(query);

      expect(result).toEqual([mockDeletedUser]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          deletedAt: { not: null },
          OR: [
            { email: { contains: 'deleted', mode: 'insensitive' } },
            { name: { contains: 'deleted', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ========================================
  // UPDATED PRIVATE METHOD TESTS
  // ========================================

  describe('buildSearchCriteria (tested through findManyUsers)', () => {
    it('should return deletedAt: null when no search term and includeDeleted is false', async () => {
      const query: GetUsersQueryDto = {};
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
        }),
      );
    });

    it('should build OR criteria with deletedAt filter for search term', async () => {
      const query: GetUsersQueryDto = { search: '  test  ' }; // With whitespace
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            OR: [
              { email: { contains: 'test', mode: 'insensitive' } },
              { name: { contains: 'test', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should not include deletedAt filter when includeDeleted is true', async () => {
      const query: GetUsersQueryDto = { search: 'test' };
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query, true);

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

  describe('buildOrderByClause (tested through findManyUsers)', () => {
    it('should use provided valid orderBy field including new timestamp fields', async () => {
      const query: GetUsersQueryDto = {
        orderBy: 'createdAt',
        sortOrder: 'asc',
      };
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should support updatedAt ordering', async () => {
      const query: GetUsersQueryDto = {
        orderBy: 'updatedAt',
        sortOrder: 'desc',
      };
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: 'desc' },
        }),
      );
    });

    it('should default to createdAt:desc for invalid orderBy field', async () => {
      const query = {
        orderBy: 'invalid',
      } as unknown as GetUsersQueryDto;
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findManyUsers(query);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }, // Changed from id: asc
        }),
      );
    });
  });

  // ========================================
  // EDGE CASES AND ERROR HANDLING
  // ========================================

  describe('Edge cases with timestamps and soft delete', () => {
    it('should handle user with null name and timestamps correctly', async () => {
      const userWithNullName = {
        id: 5,
        email: 'nullname@example.com',
        name: null,
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(userWithNullName);

      const result = await service.createUser({
        email: 'nullname@example.com',
        password: 'password123',
      });

      expect(result).toEqual(userWithNullName);
      expect(result.name).toBeNull();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.deletedAt).toBeNull();
    });

    it('should handle multiple soft delete operations gracefully', async () => {
      // Try to soft delete already soft deleted user
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.deleteUser(3)).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 3, deletedAt: null },
      });
    });

    it('should handle restore of non-deleted user gracefully', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.restoreUser(1)).rejects.toThrow(
        new NotFoundException('Deleted user not found'),
      );

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: { not: null } },
      });
    });
  });
});
