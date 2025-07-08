/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto, GetNotesQueryDto } from './dto';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma.service';
import { Note, AccessType } from '@prisma/client';

describe('NotesService', () => {
  let service: NotesService;

  const mockNote: Note = {
    id: 1,
    title: 'Test Note',
    content: 'Test content',
    isPublic: false,
    ownerId: 1,
    createdBy: 1,
    updatedBy: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
  };

  const mockPublicNote: Note = {
    id: 2,
    title: 'Public Note',
    content: 'Public content',
    isPublic: true,
    ownerId: 2,
    createdBy: 2,
    updatedBy: 2,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
  };

  const mockUserService = {
    ensureUserExists: jest.fn(),
  };

  const mockPrismaService = {
    note: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEmptyNote', () => {
    const createNoteData: CreateNoteDto = {
      title: 'New Note',
      content: 'New content',
      isPublic: false,
    };

    it('should create and return a new note', async () => {
      mockUserService.ensureUserExists.mockResolvedValue(undefined);
      mockPrismaService.note.create.mockResolvedValue(mockNote);

      const result = await service.createEmptyNote(1, createNoteData);

      expect(result).toEqual(mockNote);
      expect(mockUserService.ensureUserExists).toHaveBeenCalledWith(1);
      expect(mockPrismaService.note.create).toHaveBeenCalledWith({
        data: {
          title: createNoteData.title,
          content: createNoteData.content,
          isPublic: false,
          ownerId: 1,
          createdBy: 1,
          updatedBy: 1,
        },
      });
    });

    it('should create public note when isPublic is true', async () => {
      const publicNoteData = { ...createNoteData, isPublic: true };
      mockUserService.ensureUserExists.mockResolvedValue(undefined);
      mockPrismaService.note.create.mockResolvedValue({
        ...mockNote,
        isPublic: true,
      });

      await service.createEmptyNote(1, publicNoteData);

      expect(mockPrismaService.note.create).toHaveBeenCalledWith({
        data: {
          title: publicNoteData.title,
          content: publicNoteData.content,
          isPublic: true,
          ownerId: 1,
          createdBy: 1,
          updatedBy: 1,
        },
      });
    });

    it('should throw error when user does not exist', async () => {
      mockUserService.ensureUserExists.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        service.createEmptyNote(999, createNoteData),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.note.create).not.toHaveBeenCalled();
    });
  });

  describe('updateNote', () => {
    const updateData: UpdateNoteDto = {
      title: 'Updated Title',
      content: 'Updated content',
    };

    it('should update note when user is owner', async () => {
      const updatedNote = { ...mockNote, ...updateData };
      mockPrismaService.note.findFirst.mockResolvedValue(mockNote);
      mockPrismaService.note.update.mockResolvedValue(updatedNote);

      const result = await service.updateNote(1, 1, updateData);

      expect(result).toEqual(updatedNote);
      expect(mockPrismaService.note.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          deletedAt: null,
          OR: [
            { ownerId: 1 },
            {
              noteAccess: {
                some: {
                  userId: 1,
                  accessType: AccessType.EDIT,
                  deletedAt: null,
                },
              },
            },
          ],
        },
      });
      expect(mockPrismaService.note.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ...updateData,
          updatedBy: 1,
        },
      });
    });

    it('should update note when user has edit access', async () => {
      const noteWithEditAccess = { ...mockNote, ownerId: 2 };
      mockPrismaService.note.findFirst.mockResolvedValue(noteWithEditAccess);
      mockPrismaService.note.update.mockResolvedValue(noteWithEditAccess);

      const result = await service.updateNote(1, 1, updateData);

      expect(result).toEqual(noteWithEditAccess);
      expect(mockPrismaService.note.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          deletedAt: null,
          OR: [
            { ownerId: 1 },
            {
              noteAccess: {
                some: {
                  userId: 1,
                  accessType: AccessType.EDIT,
                  deletedAt: null,
                },
              },
            },
          ],
        },
      });
    });

    it('should throw ForbiddenException when user has no edit access', async () => {
      mockPrismaService.note.findFirst.mockResolvedValue(null);

      await expect(service.updateNote(1, 1, updateData)).rejects.toThrow(
        new ForbiddenException('You do not have edit access to this note'),
      );

      expect(mockPrismaService.note.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteNote', () => {
    it('should soft delete note when user is owner', async () => {
      const deletedNote = { ...mockNote, deletedAt: new Date() };
      mockPrismaService.note.findFirst.mockResolvedValue(mockNote);
      mockPrismaService.note.update.mockResolvedValue(deletedNote);

      const result = await service.deleteNote(1, 1);

      expect(result).toEqual(deletedNote);
      expect(mockPrismaService.note.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          ownerId: 1,
          deletedAt: null,
        },
      });
      expect(mockPrismaService.note.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          deletedAt: expect.any(Date),
        },
      });
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockPrismaService.note.findFirst.mockResolvedValue(null);

      await expect(service.deleteNote(1, 2)).rejects.toThrow(
        new ForbiddenException('You can only delete notes you own'),
      );

      expect(mockPrismaService.note.update).not.toHaveBeenCalled();
    });
  });

  describe('findAllNotes', () => {
    const mockNotesResult = [
      {
        id: 1,
        title: 'Test Note',
        isPublic: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        deletedAt: null,
        owner: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
        noteAccess: [],
      },
    ];

    it('should return notes with default parameters', async () => {
      const query: GetNotesQueryDto = {};
      mockPrismaService.note.findMany.mockResolvedValue(mockNotesResult);

      const result = await service.findAllNotes(1, query);

      expect(result).toEqual([
        {
          ...mockNotesResult[0],
          userAccess: undefined,
        },
      ]);
      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          deletedAt: null,
          OR: [
            { ownerId: 1 },
            {
              noteAccess: {
                some: {
                  userId: 1,
                  deletedAt: null,
                },
              },
            },
            { isPublic: true },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          noteAccess: {
            where: {
              userId: 1,
              deletedAt: null,
            },
            select: {
              accessType: true,
            },
          },
        },
      });
    });

    it('should filter by owned notes only', async () => {
      const query: GetNotesQueryDto = { accessFilter: 'owned' };
      mockPrismaService.note.findMany.mockResolvedValue(mockNotesResult);

      await service.findAllNotes(1, query);

      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            ownerId: 1,
          },
        }),
      );
    });

    it('should filter by public notes only', async () => {
      const query: GetNotesQueryDto = { accessFilter: 'public' };
      mockPrismaService.note.findMany.mockResolvedValue(mockNotesResult);

      await service.findAllNotes(1, query);

      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            isPublic: true,
          },
        }),
      );
    });

    it('should search by title and owner name', async () => {
      const query: GetNotesQueryDto = { search: 'test' };
      mockPrismaService.note.findMany.mockResolvedValue(mockNotesResult);

      await service.findAllNotes(1, query);

      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            OR: [
              { ownerId: 1 },
              {
                noteAccess: {
                  some: {
                    userId: 1,
                    deletedAt: null,
                  },
                },
              },
              { isPublic: true },
            ],
            AND: [
              {
                OR: [
                  { title: { contains: 'test', mode: 'insensitive' } },
                  {
                    owner: {
                      name: { contains: 'test', mode: 'insensitive' },
                    },
                  },
                  {
                    owner: {
                      email: { contains: 'test', mode: 'insensitive' },
                    },
                  },
                ],
              },
            ],
          },
        }),
      );
    });

    it('should sort by title ascending', async () => {
      const query: GetNotesQueryDto = { orderBy: 'title', sortOrder: 'asc' };
      mockPrismaService.note.findMany.mockResolvedValue(mockNotesResult);

      await service.findAllNotes(1, query);

      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'asc' },
        }),
      );
    });

    it('should include deleted notes when requested', async () => {
      const query: GetNotesQueryDto = { includeDeleted: true };
      mockPrismaService.note.findMany.mockResolvedValue(mockNotesResult);

      await service.findAllNotes(1, query);

      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { ownerId: 1 },
              {
                noteAccess: {
                  some: {
                    userId: 1,
                    deletedAt: null,
                  },
                },
              },
              { isPublic: true },
            ],
          },
        }),
      );
    });
  });

  describe('findNoteById', () => {
    const mockNoteDetails = {
      id: 1,
      title: 'Test Note',
      content: 'Test content',
      isPublic: false,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      deletedAt: null,
      owner: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
      noteAccess: [],
    };

    it('should return note details when user has access', async () => {
      mockPrismaService.note.findFirst
        .mockResolvedValueOnce(mockNote) // Access check
        .mockResolvedValueOnce(mockNoteDetails); // Note details

      const result = await service.findNoteById(1, 1);

      expect(result).toEqual({
        ...mockNoteDetails,
        userAccess: undefined,
      });
      expect(mockPrismaService.note.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should throw ForbiddenException when user has no access', async () => {
      mockPrismaService.note.findFirst.mockResolvedValue(null);

      await expect(service.findNoteById(1, 2)).rejects.toThrow(
        new ForbiddenException('You do not have access to this note'),
      );
    });

    it('should throw NotFoundException when note not found', async () => {
      mockPrismaService.note.findFirst
        .mockResolvedValueOnce(mockNote) // Access check passes
        .mockResolvedValueOnce(null); // Note not found

      await expect(service.findNoteById(1, 1)).rejects.toThrow(
        new NotFoundException('Note not found'),
      );
    });

    it('should allow access to public notes', async () => {
      mockPrismaService.note.findFirst
        .mockResolvedValueOnce(mockPublicNote) // Access check for public note
        .mockResolvedValueOnce({ ...mockNoteDetails, isPublic: true });

      const result = await service.findNoteById(2, 1);

      expect(result.isPublic).toBe(true);
      expect(mockPrismaService.note.findFirst).toHaveBeenCalledWith({
        where: {
          id: 2,
          deletedAt: null,
          OR: [
            { ownerId: 1 },
            {
              noteAccess: {
                some: {
                  userId: 1,
                  deletedAt: null,
                },
              },
            },
            { isPublic: true },
          ],
        },
      });
    });
  });

  describe('buildPaginationParams', () => {
    it('should return default pagination when no parameters provided', () => {
      const query: GetNotesQueryDto = {};
      mockPrismaService.note.findMany.mockResolvedValue([]);

      service.findAllNotes(1, query);

      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should limit take to maximum of 100', () => {
      const query: GetNotesQueryDto = { take: 150 };
      mockPrismaService.note.findMany.mockResolvedValue([]);

      service.findAllNotes(1, query);

      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });
  });

  describe('buildOrderByClause', () => {
    it('should default to createdAt desc for invalid orderBy', () => {
      const query = { orderBy: 'invalid' } as unknown as GetNotesQueryDto;
      mockPrismaService.note.findMany.mockResolvedValue([]);

      service.findAllNotes(1, query);

      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });
});
