/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { GetUsersQueryDto, CreateUserDto, UpdateUserDto } from './dto';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: jest.Mocked<UserService>;

  // Updated mock data with timestamps and deletedAt
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
  };

  const mockDeletedUser = {
    id: 3,
    email: 'deleted@example.com',
    name: 'Deleted User',
    password: 'hashedPassword123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    deletedAt: new Date('2024-01-02T00:00:00Z'),
  };

  const mockUsers = [
    mockUser,
    {
      id: 2,
      email: 'test2@example.com',
      name: 'Test User 2',
      password: 'hashedPassword123',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      deletedAt: null,
    },
  ];

  // Updated mock service methods to include new soft delete methods
  const mockUserServiceMethods = {
    findManyUsers: jest.fn(),
    findUserById: jest.fn(),
    findUserByEmail: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    restoreUser: jest.fn(),
    permanentlyDeleteUser: jest.fn(),
    findDeletedUsers: jest.fn(),
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
  // EXISTING ENDPOINT TESTS (UPDATED)
  // ========================================

  describe('getUsers', () => {
    it('should delegate to service and return active users', async () => {
      const query: GetUsersQueryDto = {
        skip: 10,
        take: 20,
        search: 'test',
        orderBy: 'createdAt', // Updated to use new timestamp field
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
    it('should delegate to service and return active user', async () => {
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
    it('should delegate to service and return active user', async () => {
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
      password: 'password123',
    };

    it('should delegate to service and return created user with timestamps', async () => {
      const createdUser = {
        id: 3,
        email: createUserDto.email,
        name: createUserDto.name ?? null,
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      mockUserService.createUser.mockResolvedValue(createdUser);

      const result = await controller.createUser(createUserDto);

      expect(result).toEqual(createdUser);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.deletedAt).toBeNull();
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
      const updatedUser = {
        ...mockUser,
        ...updateUserDto,
        updatedAt: new Date(), // updatedAt should be updated
      };
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
      const updatedUser = {
        ...mockUser,
        name: 'Only Name Updated',
        updatedAt: new Date(),
      };
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(userId, partialUpdateDto);

      expect(result).toEqual(updatedUser);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        userId,
        partialUpdateDto,
      );
    });
  });

  describe('deleteUser (soft delete)', () => {
    it('should delegate to service and return soft deleted user', async () => {
      const userId = 1;
      const softDeletedUser = {
        ...mockUser,
        deletedAt: new Date(),
        updatedAt: new Date(),
      };
      mockUserService.deleteUser.mockResolvedValue(softDeletedUser);

      const result = await controller.deleteUser(userId);

      expect(result).toEqual(softDeletedUser);
      expect(result.deletedAt).toBeTruthy();
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
  // NEW SOFT DELETE ENDPOINT TESTS
  // ========================================

  describe('getDeletedUsers', () => {
    it('should delegate to service and return deleted users', async () => {
      const query: GetUsersQueryDto = {
        skip: 0,
        take: 10,
        search: 'deleted',
      };
      const deletedUsers = [mockDeletedUser];
      mockUserService.findDeletedUsers.mockResolvedValue(deletedUsers);

      const result = await controller.getDeletedUsers(query);

      expect(result).toEqual(deletedUsers);
      expect(mockUserService.findDeletedUsers).toHaveBeenCalledWith(query);
      expect(mockUserService.findDeletedUsers).toHaveBeenCalledTimes(1);
    });

    it('should handle empty query for deleted users', async () => {
      const query: GetUsersQueryDto = {};
      mockUserService.findDeletedUsers.mockResolvedValue([]);

      const result = await controller.getDeletedUsers(query);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(mockUserService.findDeletedUsers).toHaveBeenCalledWith(query);
    });

    it('should propagate service errors when fetching deleted users', async () => {
      const query: GetUsersQueryDto = {};
      const serviceError = new Error('Database error');
      mockUserService.findDeletedUsers.mockRejectedValue(serviceError);

      await expect(controller.getDeletedUsers(query)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('restoreUser', () => {
    it('should delegate to service and return restored user', async () => {
      const userId = 3;
      const restoredUser = {
        ...mockDeletedUser,
        deletedAt: null,
        updatedAt: new Date(),
      };
      mockUserService.restoreUser.mockResolvedValue(restoredUser);

      const result = await controller.restoreUser(userId);

      expect(result).toEqual(restoredUser);
      expect(result.deletedAt).toBeNull();
      expect(mockUserService.restoreUser).toHaveBeenCalledWith(userId);
      expect(mockUserService.restoreUser).toHaveBeenCalledTimes(1);
    });

    it('should propagate deleted user not found errors', async () => {
      const userId = 999;
      const serviceError = new Error('Deleted user not found');
      mockUserService.restoreUser.mockRejectedValue(serviceError);

      await expect(controller.restoreUser(userId)).rejects.toThrow(
        'Deleted user not found',
      );
      expect(mockUserService.restoreUser).toHaveBeenCalledWith(userId);
    });

    it('should propagate service errors during restoration', async () => {
      const userId = 1;
      const serviceError = new Error('User is not deleted');
      mockUserService.restoreUser.mockRejectedValue(serviceError);

      await expect(controller.restoreUser(userId)).rejects.toThrow(
        'User is not deleted',
      );
    });
  });

  describe('permanentlyDeleteUser', () => {
    it('should delegate to service and return permanently deleted user', async () => {
      const userId = 3;
      mockUserService.permanentlyDeleteUser.mockResolvedValue(mockDeletedUser);

      const result = await controller.permanentlyDeleteUser(userId);

      expect(result).toEqual(mockDeletedUser);
      expect(mockUserService.permanentlyDeleteUser).toHaveBeenCalledWith(
        userId,
      );
      expect(mockUserService.permanentlyDeleteUser).toHaveBeenCalledTimes(1);
    });

    it('should work with active users too', async () => {
      const userId = 1;
      mockUserService.permanentlyDeleteUser.mockResolvedValue(mockUser);

      const result = await controller.permanentlyDeleteUser(userId);

      expect(result).toEqual(mockUser);
      expect(mockUserService.permanentlyDeleteUser).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should propagate user not found errors', async () => {
      const userId = 999;
      const serviceError = new Error('User not found');
      mockUserService.permanentlyDeleteUser.mockRejectedValue(serviceError);

      await expect(controller.permanentlyDeleteUser(userId)).rejects.toThrow(
        'User not found',
      );
      expect(mockUserService.permanentlyDeleteUser).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should propagate database constraint errors', async () => {
      const userId = 1;
      const serviceError = new Error(
        'Cannot delete user with foreign key constraints',
      );
      mockUserService.permanentlyDeleteUser.mockRejectedValue(serviceError);

      await expect(controller.permanentlyDeleteUser(userId)).rejects.toThrow(
        'Cannot delete user with foreign key constraints',
      );
    });
  });

  // ========================================
  // HTTP-SPECIFIC CONCERNS TESTS (UPDATED)
  // ========================================

  describe('HTTP parameter parsing', () => {
    it('should handle numeric id parameter correctly for all endpoints', async () => {
      const userId = 42;
      const userWithId = { ...mockUser, id: userId };

      // Test regular endpoints
      mockUserService.findUserById.mockResolvedValue(userWithId);
      await controller.getUserById(userId);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);

      // Test soft delete endpoints
      mockUserService.deleteUser.mockResolvedValue(userWithId);
      await controller.deleteUser(userId);
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);

      mockUserService.restoreUser.mockResolvedValue(userWithId);
      await controller.restoreUser(userId);
      expect(mockUserService.restoreUser).toHaveBeenCalledWith(userId);

      mockUserService.permanentlyDeleteUser.mockResolvedValue(userWithId);
      await controller.permanentlyDeleteUser(userId);
      expect(mockUserService.permanentlyDeleteUser).toHaveBeenCalledWith(
        userId,
      );

      expect(typeof userId).toBe('number');
    });

    it('should handle string email parameter correctly', async () => {
      const email = 'test@example.com';
      mockUserService.findUserByEmail.mockResolvedValue(mockUser);

      await controller.getUserByEmail(email);

      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith(email);
      expect(typeof email).toBe('string');
    });
  });

  describe('DTO validation (integration with ValidationPipe)', () => {
    it('should pass valid CreateUserDto to service', async () => {
      const validDto: CreateUserDto = {
        email: 'valid@example.com',
        name: 'Valid Name',
        password: 'password123',
      };
      const createdUser = {
        id: 1,
        email: validDto.email,
        name: validDto.name ?? null,
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
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

    it('should pass valid GetUsersQueryDto to service for all list endpoints', async () => {
      const validQuery: GetUsersQueryDto = {
        skip: 0,
        take: 10,
        search: 'test',
        orderBy: 'createdAt', // Updated to use new timestamp field
        sortOrder: 'asc',
      };

      // Test active users endpoint
      mockUserService.findManyUsers.mockResolvedValue(mockUsers);
      await controller.getUsers(validQuery);
      expect(mockUserService.findManyUsers).toHaveBeenCalledWith(validQuery);

      // Test deleted users endpoint
      mockUserService.findDeletedUsers.mockResolvedValue([mockDeletedUser]);
      await controller.getDeletedUsers(validQuery);
      expect(mockUserService.findDeletedUsers).toHaveBeenCalledWith(validQuery);
    });
  });

  // ========================================
  // CONTROLLER RESPONSIBILITY TESTS (UPDATED)
  // ========================================

  describe('Controller responsibilities', () => {
    it('should only handle HTTP concerns for all endpoints', async () => {
      const query: GetUsersQueryDto = { search: 'test' };

      // Test that controller passes data as-is for all endpoints
      mockUserService.findManyUsers.mockResolvedValue(mockUsers);
      await controller.getUsers(query);
      expect(mockUserService.findManyUsers).toHaveBeenCalledWith(query);

      mockUserService.findDeletedUsers.mockResolvedValue([mockDeletedUser]);
      await controller.getDeletedUsers(query);
      expect(mockUserService.findDeletedUsers).toHaveBeenCalledWith(query);

      // Controller should not transform any data
    });

    it('should not catch or transform service errors from any endpoint', async () => {
      const serviceError = new Error('Business logic error');

      // Test error propagation for all endpoints
      mockUserService.findUserById.mockRejectedValue(serviceError);
      await expect(controller.getUserById(1)).rejects.toThrow(
        'Business logic error',
      );

      mockUserService.restoreUser.mockRejectedValue(serviceError);
      await expect(controller.restoreUser(1)).rejects.toThrow(
        'Business logic error',
      );

      mockUserService.permanentlyDeleteUser.mockRejectedValue(serviceError);
      await expect(controller.permanentlyDeleteUser(1)).rejects.toThrow(
        'Business logic error',
      );
    });

    it('should not validate business rules for soft delete operations', async () => {
      const userId = 1;

      // Controller should not check if user is already deleted, exists, etc.
      mockUserService.deleteUser.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });
      await controller.deleteUser(userId);
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);

      mockUserService.restoreUser.mockResolvedValue({
        ...mockUser,
        deletedAt: null,
      });
      await controller.restoreUser(userId);
      expect(mockUserService.restoreUser).toHaveBeenCalledWith(userId);

      // All business logic validation should be in service
    });
  });

  // ========================================
  // EDGE CASES (UPDATED)
  // ========================================

  describe('Edge cases', () => {
    it('should handle service returning empty array for all list endpoints', async () => {
      const query: GetUsersQueryDto = { search: 'nonexistent' };

      // Test empty results for active users
      mockUserService.findManyUsers.mockResolvedValue([]);
      const result1 = await controller.getUsers(query);
      expect(result1).toEqual([]);
      expect(Array.isArray(result1)).toBe(true);

      // Test empty results for deleted users
      mockUserService.findDeletedUsers.mockResolvedValue([]);
      const result2 = await controller.getDeletedUsers(query);
      expect(result2).toEqual([]);
      expect(Array.isArray(result2)).toBe(true);
    });

    it('should handle undefined optional fields in DTOs with timestamps', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        // name is optional and undefined
      };
      const createdUser = {
        id: 1,
        email: 'test@example.com',
        name: null,
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      mockUserService.createUser.mockResolvedValue(createdUser);

      const result = await controller.createUser(createUserDto);

      expect(result).toEqual(createdUser);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.deletedAt).toBeNull();
      expect(mockUserService.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('should handle empty update DTO with timestamp updates', async () => {
      const updateUserDto: UpdateUserDto = {}; // All fields optional
      const updatedUser = {
        ...mockUser,
        updatedAt: new Date(), // updatedAt should be updated even for empty updates
      };
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(1, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(result.updatedAt).not.toEqual(mockUser.updatedAt); // Should be updated
      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, updateUserDto);
    });

    it('should handle soft delete operations on users with different states', async () => {
      // Test deleting active user
      const activeUser = mockUser;
      const softDeletedUser = {
        ...activeUser,
        deletedAt: new Date(),
        updatedAt: new Date(),
      };
      mockUserService.deleteUser.mockResolvedValue(softDeletedUser);

      const result1 = await controller.deleteUser(activeUser.id);
      expect(result1.deletedAt).toBeTruthy();

      // Test restoring deleted user
      const restoredUser = {
        ...softDeletedUser,
        deletedAt: null,
        updatedAt: new Date(),
      };
      mockUserService.restoreUser.mockResolvedValue(restoredUser);

      const result2 = await controller.restoreUser(softDeletedUser.id);
      expect(result2.deletedAt).toBeNull();
    });
  });

  // ========================================
  // NEW ENDPOINT SPECIFIC TESTS
  // ========================================

  describe('Soft delete specific edge cases', () => {
    it('should handle rapid soft delete and restore operations', async () => {
      const userId = 1;
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      const restoredUser = { ...mockUser, deletedAt: null };

      // Rapid delete
      mockUserService.deleteUser.mockResolvedValue(deletedUser);
      const deleteResult = await controller.deleteUser(userId);
      expect(deleteResult.deletedAt).toBeTruthy();

      // Rapid restore
      mockUserService.restoreUser.mockResolvedValue(restoredUser);
      const restoreResult = await controller.restoreUser(userId);
      expect(restoreResult.deletedAt).toBeNull();

      // Controller should handle this without issues
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
      expect(mockUserService.restoreUser).toHaveBeenCalledWith(userId);
    });

    it('should handle permanent delete of both active and soft deleted users', async () => {
      // Permanent delete of active user
      mockUserService.permanentlyDeleteUser.mockResolvedValue(mockUser);
      const result1 = await controller.permanentlyDeleteUser(1);
      expect(result1).toEqual(mockUser);

      // Permanent delete of soft deleted user
      mockUserService.permanentlyDeleteUser.mockResolvedValue(mockDeletedUser);
      const result2 = await controller.permanentlyDeleteUser(3);
      expect(result2).toEqual(mockDeletedUser);

      expect(mockUserService.permanentlyDeleteUser).toHaveBeenCalledTimes(2);
    });

    it('should handle querying deleted users with various filters', async () => {
      const complexQuery: GetUsersQueryDto = {
        skip: 5,
        take: 15,
        search: 'deleted',
        orderBy: 'updatedAt',
        sortOrder: 'desc',
      };

      mockUserService.findDeletedUsers.mockResolvedValue([mockDeletedUser]);
      const result = await controller.getDeletedUsers(complexQuery);

      expect(result).toEqual([mockDeletedUser]);
      expect(mockUserService.findDeletedUsers).toHaveBeenCalledWith(
        complexQuery,
      );
      // Controller should pass complex queries without modification
    });
  });
});
