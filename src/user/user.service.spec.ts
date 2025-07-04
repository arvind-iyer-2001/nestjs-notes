import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';

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

  describe('user', () => {
    it('should return a user when found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.user({ id: 1 });

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.user({ id: 999 });

      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('should find user by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.user({ email: 'test@example.com' });

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('users', () => {
    it('should return all users with default parameters', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.users({});

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        cursor: undefined,
        where: undefined,
        orderBy: undefined,
      });
    });

    it('should return users with pagination', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.users({
        skip: 0,
        take: 1,
      });

      expect(result).toEqual([mockUser]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 1,
        cursor: undefined,
        where: undefined,
        orderBy: undefined,
      });
    });

    it('should return users with filtering', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

      const whereClause = { email: { contains: 'test' } };
      const result = await service.users({
        where: whereClause,
      });

      expect(result).toEqual([mockUser]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        cursor: undefined,
        where: whereClause,
        orderBy: undefined,
      });
    });

    it('should return users with ordering', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const orderBy = { name: 'asc' as const };
      const result = await service.users({
        orderBy,
      });

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        cursor: undefined,
        where: undefined,
        orderBy,
      });
    });

    it('should return users with cursor-based pagination', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[1]]);

      const cursor = { id: 1 };
      const result = await service.users({
        cursor,
        take: 1,
      });

      expect(result).toEqual([mockUsers[1]]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: 1,
        cursor,
        where: undefined,
        orderBy: undefined,
      });
    });
  });

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      const createUserData = {
        email: 'new@example.com',
        name: 'New User',
      };

      const createdUser = {
        id: 3,
        ...createUserData,
      };

      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.createUser(createUserData);

      expect(result).toEqual(createdUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createUserData,
      });
    });

    it('should create user with only email', async () => {
      const createUserData = {
        email: 'minimal@example.com',
      };

      const createdUser = {
        id: 4,
        email: 'minimal@example.com',
        name: null,
      };

      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.createUser(createUserData);

      expect(result).toEqual(createdUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createUserData,
      });
    });
  });

  describe('updateUser', () => {
    it('should update and return the user', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser({
        where: { id: 1 },
        data: updateData,
      });

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });

    it('should update user email', async () => {
      const updateData = {
        email: 'updated@example.com',
      };

      const updatedUser = {
        ...mockUser,
        email: 'updated@example.com',
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser({
        where: { email: 'test@example.com' },
        data: updateData,
      });

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: updateData,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete and return the user', async () => {
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.deleteUser({ id: 1 });

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should delete user by email', async () => {
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.deleteUser({ email: 'test@example.com' });

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('error handling', () => {
    it('should propagate errors from prisma', async () => {
      const prismaError = new Error('Database connection failed');
      mockPrismaService.user.findUnique.mockRejectedValue(prismaError);

      await expect(service.user({ id: 1 })).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should propagate errors from create operation', async () => {
      const prismaError = new Error('Unique constraint violation');
      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(
        service.createUser({
          email: 'test@example.com',
          name: 'Test User',
        }),
      ).rejects.toThrow('Unique constraint violation');
    });

    it('should propagate errors from update operation', async () => {
      const prismaError = new Error('Record not found');
      mockPrismaService.user.update.mockRejectedValue(prismaError);

      await expect(
        service.updateUser({
          where: { id: 999 },
          data: { name: 'Updated' },
        }),
      ).rejects.toThrow('Record not found');
    });

    it('should propagate errors from delete operation', async () => {
      const prismaError = new Error('Record not found');
      mockPrismaService.user.delete.mockRejectedValue(prismaError);

      await expect(service.deleteUser({ id: 999 })).rejects.toThrow(
        'Record not found',
      );
    });
  });
});
