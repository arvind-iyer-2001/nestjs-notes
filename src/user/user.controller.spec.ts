/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { GetUsersQueryDto } from './dto';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: jest.Mocked<UserService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsers = [
    mockUser,
    {
      id: 2,
      email: 'test2@example.com',
      name: 'Test User 2',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockUserServiceMethods = {
    users: jest.fn(),
    user: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UserService,
          useValue: mockUserServiceMethods,
        },
      ],
      controllers: [UserController],
    }).compile();

    controller = module.get<UserController>(UserController);
    mockUserService = module.get<UserService>(
      UserService,
    ) as jest.Mocked<UserService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return an array of users with default parameters', async () => {
      const query = {};
      mockUserService.users.mockResolvedValue(mockUsers);

      const result = await controller.getUsers(query);

      expect(result).toEqual(mockUsers);
      expect(mockUserService.users).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        orderBy: { id: 'asc' },
      });
    });

    it('should return users with search query', async () => {
      const query = { search: 'test' };
      mockUserService.users.mockResolvedValue([mockUser]);

      const result = await controller.getUsers(query);

      expect(result).toEqual([mockUser]);
      expect(mockUserService.users).toHaveBeenCalledWith({
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
      const query = { skip: 10, take: 20 };
      mockUserService.users.mockResolvedValue(mockUsers);

      const result = await controller.getUsers(query);

      expect(result).toEqual(mockUsers);
      expect(mockUserService.users).toHaveBeenCalledWith({
        skip: 10,
        take: 20,
        where: {},
        orderBy: { id: 'asc' },
      });
    });

    it('should return users with custom ordering', async () => {
      const query = { orderBy: 'name', sortOrder: 'desc' } as GetUsersQueryDto;
      mockUserService.users.mockResolvedValue(mockUsers);

      const result = await controller.getUsers(query);

      expect(result).toEqual(mockUsers);
      expect(mockUserService.users).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        orderBy: { name: 'desc' },
      });
    });

    it('should use default ordering for invalid orderBy field', async () => {
      const query = { orderBy: 'invalid' };
      mockUserService.users.mockResolvedValue(mockUsers);

      const result = await controller.getUsers(query);

      expect(result).toEqual(mockUsers);
      expect(mockUserService.users).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        orderBy: { id: 'asc' },
      });
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      mockUserService.user.mockResolvedValue(mockUser);

      const result = await controller.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(mockUserService.user).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw HttpException when user not found', async () => {
      mockUserService.user.mockResolvedValue(null);

      await expect(controller.getUserById(999)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      mockUserService.user.mockResolvedValue(mockUser);

      const result = await controller.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserService.user).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should throw HttpException when user not found', async () => {
      mockUserService.user.mockResolvedValue(null);

      await expect(
        controller.getUserByEmail('nonexistent@example.com'),
      ).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('createUser', () => {
    const createUserDto = {
      email: 'new@example.com',
      name: 'New User',
    };

    it('should create and return a new user', async () => {
      const newUser = { ...mockUser, ...createUserDto };
      mockUserService.createUser.mockResolvedValue(newUser);

      const result = await controller.createUser(createUserDto);

      expect(result).toEqual(newUser);
      expect(mockUserService.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw HttpException when email already exists', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
        },
      );
      mockUserService.createUser.mockRejectedValue(prismaError);

      await expect(controller.createUser(createUserDto)).rejects.toThrow(
        new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        ),
      );
    });

    it('should throw HttpException for other Prisma errors', async () => {
      const prismaError = new PrismaClientKnownRequestError('Database error', {
        code: 'P2000',
        clientVersion: '4.0.0',
      });
      mockUserService.createUser.mockRejectedValue(prismaError);

      await expect(controller.createUser(createUserDto)).rejects.toThrow(
        new HttpException(
          'Failed to create user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should throw HttpException for unknown errors', async () => {
      mockUserService.createUser.mockRejectedValue(new Error('Unknown error'));

      await expect(controller.createUser(createUserDto)).rejects.toThrow(
        new HttpException(
          'Failed to create user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('updateUser', () => {
    const updateUserDto = {
      name: 'Updated User',
    };

    it('should update and return the user', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(1, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(mockUserService.updateUser).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateUserDto,
      });
    });

    it('should throw HttpException when email already exists', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
        },
      );
      mockUserService.updateUser.mockRejectedValue(prismaError);

      await expect(controller.updateUser(1, updateUserDto)).rejects.toThrow(
        new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        ),
      );
    });

    it('should throw HttpException when user not found', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );
      mockUserService.updateUser.mockRejectedValue(prismaError);

      await expect(controller.updateUser(999, updateUserDto)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw HttpException for other Prisma errors', async () => {
      const prismaError = new PrismaClientKnownRequestError('Database error', {
        code: 'P2000',
        clientVersion: '4.0.0',
      });
      mockUserService.updateUser.mockRejectedValue(prismaError);

      await expect(controller.updateUser(1, updateUserDto)).rejects.toThrow(
        new HttpException(
          'Failed to update user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should throw HttpException for unknown errors', async () => {
      mockUserService.updateUser.mockRejectedValue(new Error('Unknown error'));

      await expect(controller.updateUser(1, updateUserDto)).rejects.toThrow(
        new HttpException(
          'Failed to update user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete and return the user', async () => {
      mockUserService.deleteUser.mockResolvedValue(mockUser);

      const result = await controller.deleteUser(1);

      expect(result).toEqual(mockUser);
      expect(mockUserService.deleteUser).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw HttpException when user not found', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );
      mockUserService.deleteUser.mockRejectedValue(prismaError);

      await expect(controller.deleteUser(999)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw HttpException for other Prisma errors', async () => {
      const prismaError = new PrismaClientKnownRequestError('Database error', {
        code: 'P2000',
        clientVersion: '4.0.0',
      });
      mockUserService.deleteUser.mockRejectedValue(prismaError);

      await expect(controller.deleteUser(1)).rejects.toThrow(
        new HttpException(
          'Failed to delete user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should throw HttpException for unknown errors', async () => {
      mockUserService.deleteUser.mockRejectedValue(new Error('Unknown error'));

      await expect(controller.deleteUser(1)).rejects.toThrow(
        new HttpException(
          'Failed to delete user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
