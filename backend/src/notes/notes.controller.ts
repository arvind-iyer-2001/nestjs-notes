import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { Note } from '@prisma/client';
import {
  CreateNoteDto,
  UpdateNoteDto,
  UpdateNotePublicDto,
  GetNotesQueryDto,
} from './dto';
import { NoteListItem, NoteDetails } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  private readonly HARDCODED_USER_ID = 1; // TODO: Replace with actual user ID from auth guard

  @Post()
  async createNote(
    @Body(ValidationPipe) noteData: CreateNoteDto,
  ): Promise<Note> {
    return this.notesService.createEmptyNote(this.HARDCODED_USER_ID, noteData);
  }

  @Get()
  async getAllNotes(
    @Query(ValidationPipe) query: GetNotesQueryDto,
  ): Promise<NoteListItem[]> {
    return this.notesService.findAllNotes(this.HARDCODED_USER_ID, query);
  }

  @Get(':id')
  async getNoteById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NoteDetails> {
    return this.notesService.findNoteById(id, this.HARDCODED_USER_ID);
  }

  @Patch(':id')
  async updateNote(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) noteData: UpdateNoteDto,
  ): Promise<Note> {
    return this.notesService.updateNote(id, this.HARDCODED_USER_ID, noteData);
  }

  @Patch(':id/public')
  async updateNotePublicStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) publicData: UpdateNotePublicDto,
  ): Promise<Note> {
    return this.notesService.updateNote(id, this.HARDCODED_USER_ID, {
      isPublic: publicData.isPublic,
    });
  }

  @Delete(':id')
  async deleteNote(@Param('id', ParseIntPipe) id: number): Promise<Note> {
    return this.notesService.deleteNote(id, this.HARDCODED_USER_ID);
  }
}
