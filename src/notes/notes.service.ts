import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserService } from '../user/user.service';
import { CreateNoteDto, UpdateNoteDto, GetNotesQueryDto } from './dto';
import { Note, Prisma, AccessType } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export interface NoteListItem {
  id: number;
  title: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  owner: {
    id: number;
    name: string | null;
    email: string;
  };
  userAccess?: {
    accessType: AccessType;
  };
}

export interface NoteDetails extends NoteListItem {
  content: string;
}

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  async createEmptyNote(
    userId: number,
    noteData: CreateNoteDto,
  ): Promise<Note> {
    try {
      await this.userService.ensureUserExists(userId);

      return await this.prisma.note.create({
        data: {
          title: noteData.title,
          content: noteData.content,
          isPublic: noteData.isPublic || false,
          ownerId: userId,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    } catch (error) {
      this.handleDatabaseError(error, 'Failed to create note');
    }
  }

  async updateNote(
    noteId: number,
    userId: number,
    noteData: UpdateNoteDto,
  ): Promise<Note> {
    try {
      await this.ensureUserCanEditNote(noteId, userId);

      return await this.prisma.note.update({
        where: { id: noteId },
        data: {
          ...noteData,
          updatedBy: userId,
        },
      });
    } catch (error) {
      this.handleDatabaseError(error, 'Failed to update note');
    }
  }

  async deleteNote(noteId: number, userId: number): Promise<Note> {
    try {
      await this.ensureUserOwnsNote(noteId, userId);

      return await this.prisma.note.update({
        where: { id: noteId },
        data: {
          deletedAt: new Date(),
        },
      });
    } catch (error) {
      this.handleDatabaseError(error, 'Failed to delete note');
    }
  }

  async findAllNotes(
    userId: number,
    query: GetNotesQueryDto,
  ): Promise<NoteListItem[]> {
    const searchCriteria = this.buildSearchCriteria(query, userId);
    const { skip, take } = this.buildPaginationParams(query);
    const orderBy = this.buildOrderByClause(query);

    const notes = await this.prisma.note.findMany({
      skip,
      take,
      where: searchCriteria,
      orderBy,
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
            userId,
            deletedAt: null,
          },
          select: {
            accessType: true,
          },
        },
      },
    });

    return notes.map((note) => ({
      ...note,
      userAccess: note.noteAccess[0] || undefined,
    }));
  }

  async findNoteById(noteId: number, userId: number): Promise<NoteDetails> {
    try {
      await this.ensureUserCanViewNote(noteId, userId);

      const note = await this.prisma.note.findFirst({
        where: {
          id: noteId,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          content: true,
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
              userId,
              deletedAt: null,
            },
            select: {
              accessType: true,
            },
          },
        },
      });

      if (!note) {
        throw new NotFoundException('Note not found');
      }

      return {
        ...note,
        userAccess: note.noteAccess[0] || undefined,
      };
    } catch (error) {
      this.handleDatabaseError(error, 'Failed to fetch note details');
    }
  }

  // ========================================
  // PRIVATE BUSINESS LOGIC METHODS
  // ========================================

  private buildSearchCriteria(
    query: GetNotesQueryDto,
    userId: number,
  ): Prisma.NoteWhereInput {
    const baseWhere: Prisma.NoteWhereInput = {
      ...(query.includeDeleted ? {} : { deletedAt: null }),
    };

    let accessFilter: Prisma.NoteWhereInput = {};

    switch (query.accessFilter) {
      case 'owned':
        accessFilter = { ownerId: userId };
        break;
      case 'edit':
        accessFilter = {
          noteAccess: {
            some: {
              userId,
              accessType: AccessType.EDIT,
              deletedAt: null,
            },
          },
        };
        break;
      case 'view':
        accessFilter = {
          noteAccess: {
            some: {
              userId,
              accessType: AccessType.VIEW,
              deletedAt: null,
            },
          },
        };
        break;
      case 'public':
        accessFilter = { isPublic: true };
        break;
      default:
        accessFilter = {
          OR: [
            { ownerId: userId },
            {
              noteAccess: {
                some: {
                  userId,
                  deletedAt: null,
                },
              },
            },
            { isPublic: true },
          ],
        };
    }

    let searchCriteria: Prisma.NoteWhereInput = {
      ...baseWhere,
      ...accessFilter,
    };

    if (query.search) {
      searchCriteria = {
        ...searchCriteria,
        AND: [
          {
            OR: [
              { title: { contains: query.search.trim(), mode: 'insensitive' } },
              {
                owner: {
                  name: { contains: query.search.trim(), mode: 'insensitive' },
                },
              },
              {
                owner: {
                  email: { contains: query.search.trim(), mode: 'insensitive' },
                },
              },
            ],
          },
        ],
      };
    }

    return searchCriteria;
  }

  private buildPaginationParams(query: GetNotesQueryDto) {
    return {
      skip: query.skip || 0,
      take: Math.min(query.take || 10, 100),
    };
  }

  private buildOrderByClause(
    query: GetNotesQueryDto,
  ): Prisma.NoteOrderByWithRelationInput {
    const validOrderFields = ['title', 'createdAt', 'updatedAt'];

    if (query.orderBy && validOrderFields.includes(query.orderBy)) {
      if (query.orderBy === 'title') {
        return { title: query.sortOrder || 'asc' };
      }
      return { [query.orderBy]: query.sortOrder || 'asc' };
    }

    return { createdAt: 'desc' };
  }

  private async ensureUserOwnsNote(
    noteId: number,
    userId: number,
  ): Promise<void> {
    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        ownerId: userId,
        deletedAt: null,
      },
    });

    if (!note) {
      throw new ForbiddenException('You can only delete notes you own');
    }
  }

  private async ensureUserCanEditNote(
    noteId: number,
    userId: number,
  ): Promise<void> {
    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        deletedAt: null,
        OR: [
          { ownerId: userId },
          {
            noteAccess: {
              some: {
                userId,
                accessType: AccessType.EDIT,
                deletedAt: null,
              },
            },
          },
        ],
      },
    });

    if (!note) {
      throw new ForbiddenException('You do not have edit access to this note');
    }
  }

  private async ensureUserCanViewNote(
    noteId: number,
    userId: number,
  ): Promise<void> {
    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        deletedAt: null,
        OR: [
          { ownerId: userId },
          {
            noteAccess: {
              some: {
                userId,
                deletedAt: null,
              },
            },
          },
          { isPublic: true },
        ],
      },
    });

    if (!note) {
      throw new ForbiddenException('You do not have access to this note');
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
      throw error;
    }

    throw new InternalServerErrorException(fallbackMessage);
  }
}
