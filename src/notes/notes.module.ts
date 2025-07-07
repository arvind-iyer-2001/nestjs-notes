import { Module } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [UserService, PrismaService],
})
export class NotesModule {}
