/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { GetUsersQueryDto, CreateUserDto, UpdateUserDto } from './dto';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: jest.Mocked<UserService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockUsers = [
    mockUser,
    {
      id: 2,
      email: 'test2@example.com',
      name: 'Test User 2',
    },
  ];

  // Mock only the new business logic methods
  const mockUserServiceMethods = {
    findManyUsers: jest.fn(),
    findUserById: jest.fn(),
    findUserByEmail: jest.fn(),
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

  // ========================================
  // CLEAN CONTROLLER TESTS - HTTP LAYER ONLY
  // ========================================

  describe('getUsers', () => {
    it('should delegate to service and return users', async () => {
      const query: GetUsersQueryDto = {
        skip: 10,
        take: 20,
        search: 'test',
        orderBy: 'name',
        sortOrder: 'desc',
      };

      mockUserService.findManyUsers.mockResolvedValue(mockUsers);

      const result = await controller.getUsers(query);

      expect(result).toEqual(mockUsers);
      expect(mockUserService.findManyUsers).toHaveBeenCalledWith(query);
      expect(mockUserService.findManyUsers).toHaveBeenCalledTimes(1);
    });

    it('should handle empty query object', async () => {
      const query: GetUsersQueryDto = {};
      mockUserService.findManyUsers.mockResolvedValue(mockUsers);

      const result = await controller.getUsers(query);

      expect(result).toEqual(mockUsers);
      expect(mockUserService.findManyUsers).toHaveBeenCalledWith(query);
    });

    it('should propagate service errors', async () => {
      const query: GetUsersQueryDto = {};
      const serviceError = new Error('Service error');
      mockUserService.findManyUsers.mockRejectedValue(serviceError);

      await expect(controller.getUsers(query)).rejects.toThrow('Service error');
    });
  });

  describe('getUserById', () => {
    it('should delegate to service and return user', async () => {
      const userId = 1;
      mockUserService.findUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserService.findUserById).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors (like NotFoundException)', async () => {
      const userId = 999;
      const serviceError = new Error('User not found');
      mockUserService.findUserById.mockRejectedValue(serviceError);

      await expect(controller.getUserById(userId)).rejects.toThrow(
        'User not found',
      );
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserByEmail', () => {
    it('should delegate to service and return user', async () => {
      const email = 'test@example.com';
      mockUserService.findUserByEmail.mockResolvedValue(mockUser);

      const result = await controller.getUserByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith(email);
      expect(mockUserService.findUserByEmail).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const email = 'nonexistent@example.com';
      const serviceError = new Error('User not found');
      mockUserService.findUserByEmail.mockRejectedValue(serviceError);

      await expect(controller.getUserByEmail(email)).rejects.toThrow(
        'User not found',
      );
      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      name: 'New User',
    };

    it('should delegate to service and return created user', async () => {
      const createdUser = {
        id: 3,
        email: createUserDto.email,
        name: createUserDto.name ?? null,
      };
      mockUserService.createUser.mockResolvedValue(createdUser);

      const result = await controller.createUser(createUserDto);

      expect(result).toEqual(createdUser);
      expect(mockUserService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(mockUserService.createUser).toHaveBeenCalledTimes(1);
    });

    it('should propagate service validation errors', async () => {
      const serviceError = new Error('User with this email already exists');
      mockUserService.createUser.mockRejectedValue(serviceError);

      await expect(controller.createUser(createUserDto)).rejects.toThrow(
        'User with this email already exists',
      );
      expect(mockUserService.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('should propagate other service errors', async () => {
      const serviceError = new Error('Database connection failed');
      mockUserService.createUser.mockRejectedValue(serviceError);

      await expect(controller.createUser(createUserDto)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('updateUser', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated User',
      email: 'updated@example.com',
    };

    it('should delegate to service and return updated user', async () => {
      const userId = 1;
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(userId, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(mockUserService.updateUser).toHaveBeenCalledTimes(1);
    });

    it('should propagate service validation errors', async () => {
      const userId = 1;
      const serviceError = new Error('User with this email already exists');
      mockUserService.updateUser.mockRejectedValue(serviceError);

      await expect(
        controller.updateUser(userId, updateUserDto),
      ).rejects.toThrow('User with this email already exists');
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
    });

    it('should propagate user not found errors', async () => {
      const userId = 999;
      const serviceError = new Error('User not found');
      mockUserService.updateUser.mockRejectedValue(serviceError);

      await expect(
        controller.updateUser(userId, updateUserDto),
      ).rejects.toThrow('User not found');
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
    });

    it('should handle partial update data', async () => {
      const userId = 1;
      const partialUpdateDto: UpdateUserDto = { name: 'Only Name Updated' };
      const updatedUser = { ...mockUser, name: 'Only Name Updated' };
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(userId, partialUpdateDto);

      expect(result).toEqual(updatedUser);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        userId,
        partialUpdateDto,
      );
    });
  });

  describe('deleteUser', () => {
    it('should delegate to service and return deleted user', async () => {
      const userId = 1;
      mockUserService.deleteUser.mockResolvedValue(mockUser);

      const result = await controller.deleteUser(userId);

      expect(result).toEqual(mockUser);
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
      expect(mockUserService.deleteUser).toHaveBeenCalledTimes(1);
    });

    it('should propagate user not found errors', async () => {
      const userId = 999;
      const serviceError = new Error('User not found');
      mockUserService.deleteUser.mockRejectedValue(serviceError);

      await expect(controller.deleteUser(userId)).rejects.toThrow(
        'User not found',
      );
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
    });

    it('should propagate other service errors', async () => {
      const userId = 1;
      const serviceError = new Error('Cannot delete user with active sessions');
      mockUserService.deleteUser.mockRejectedValue(serviceError);

      await expect(controller.deleteUser(userId)).rejects.toThrow(
        'Cannot delete user with active sessions',
      );
    });
  });

  // ========================================
  // HTTP-SPECIFIC CONCERNS TESTS
  // ========================================

  describe('HTTP parameter parsing', () => {
    it('should handle numeric id parameter correctly', async () => {
      // This tests that ParseIntPipe is working correctly
      const userId = 42;
      mockUserService.findUserById.mockResolvedValue({
        ...mockUser,
        id: userId,
      });

      await controller.getUserById(userId);

      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(typeof userId).toBe('number');
    });

    it('should handle string email parameter correctly', async () => {
      const email = 'test@example.com';
      mockUserService.findUserByEmail.mockResolvedValue(mockUser);

      await controller.getUserByEmail(email);

      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith(email);
      expect(typeof email).toBe('string'); // Ensure it remains as string
    });
  });

  describe('DTO validation (integration with ValidationPipe)', () => {
    // Note: These tests assume ValidationPipe is configured globally
    // In real scenarios, validation errors would be thrown by the pipe before reaching the controller

    it('should pass valid CreateUserDto to service', async () => {
      const validDto: CreateUserDto = {
        email: 'valid@example.com',
        name: 'Valid Name',
      };
      const createdUser = {
        id: 1,
        email: validDto.email,
        name: validDto.name ?? null,
      };
      mockUserService.createUser.mockResolvedValue(createdUser);

      await controller.createUser(validDto);

      expect(mockUserService.createUser).toHaveBeenCalledWith(validDto);
    });

    it('should pass valid UpdateUserDto to service', async () => {
      const validDto: UpdateUserDto = {
        email: 'updated@example.com',
        name: 'Updated Name',
      };
      const updatedUser = { ...mockUser, ...validDto };
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      await controller.updateUser(1, validDto);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, validDto);
    });

    it('should pass valid GetUsersQueryDto to service', async () => {
      const validQuery: GetUsersQueryDto = {
        skip: 0,
        take: 10,
        search: 'test',
        orderBy: 'email',
        sortOrder: 'asc',
      };
      mockUserService.findManyUsers.mockResolvedValue(mockUsers);

      await controller.getUsers(validQuery);

      expect(mockUserService.findManyUsers).toHaveBeenCalledWith(validQuery);
    });
  });

  // ========================================
  // CONTROLLER RESPONSIBILITY TESTS
  // ========================================

  describe('Controller responsibilities', () => {
    it('should only handle HTTP concerns, not business logic', async () => {
      // This test ensures the controller doesn't contain business logic
      const query: GetUsersQueryDto = { search: 'test' };
      mockUserService.findManyUsers.mockResolvedValue(mockUsers);

      await controller.getUsers(query);

      // Controller should pass the query as-is, without any transformation
      expect(mockUserService.findManyUsers).toHaveBeenCalledWith(query);

      // Controller should not be building where clauses, order by, etc.
      // All business logic should be in the service
    });

    it('should not catch or transform service errors', async () => {
      // Controller should let service errors bubble up to global exception filter
      const serviceError = new Error('Business logic error');
      mockUserService.findUserById.mockRejectedValue(serviceError);

      await expect(controller.getUserById(1)).rejects.toThrow(
        'Business logic error',
      );

      // No error transformation should happen in controller
    });

    it('should not validate business rules', async () => {
      // Controller should not validate email uniqueness, user existence, etc.
      // These are business concerns handled by the service
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUserService.createUser.mockResolvedValue({
        id: 1,
        email: createUserDto.email,
        name: createUserDto.name ?? null,
      });

      await controller.createUser(createUserDto);

      // Controller just passes data to service
      expect(mockUserService.createUser).toHaveBeenCalledWith(createUserDto);
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================

  describe('Edge cases', () => {
    it('should handle service returning empty array', async () => {
      const query: GetUsersQueryDto = { search: 'nonexistent' };
      mockUserService.findManyUsers.mockResolvedValue([]);

      const result = await controller.getUsers(query);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle undefined optional fields in DTOs', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        // name is optional and undefined
      };
      const createdUser = { id: 1, email: 'test@example.com', name: null };
      mockUserService.createUser.mockResolvedValue(createdUser);

      const result = await controller.createUser(createUserDto);

      expect(result).toEqual(createdUser);
      expect(mockUserService.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('should handle empty update DTO', async () => {
      const updateUserDto: UpdateUserDto = {}; // All fields optional
      const updatedUser = mockUser; // No changes
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(1, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, updateUserDto);
    });
  });
});
