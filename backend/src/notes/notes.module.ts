import { Module } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma.service';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  providers: [NotesService, UserService, PrismaService],
  controllers: [NotesController],
})
export class NotesModule {}
