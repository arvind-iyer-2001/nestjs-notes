import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { NotesService } from './notes/notes.service';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [UserModule, NotesModule],
  controllers: [AppController],
  providers: [AppService, NotesService],
})
export class AppModule {}
