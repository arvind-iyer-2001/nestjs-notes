import { IsBoolean } from 'class-validator';

export class UpdateNotePublicDto {
  @IsBoolean()
  isPublic: boolean;
}
