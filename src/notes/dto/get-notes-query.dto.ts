import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetNotesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => `${value?.trim()}`)
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['title', 'createdAt', 'updatedAt'], {
    message: 'orderBy must be one of: title, createdAt, updatedAt',
  })
  orderBy?: 'title' | 'createdAt' | 'updatedAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be either asc or desc' })
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  @IsIn(['owned', 'edit', 'view', 'public'], {
    message: 'accessFilter must be one of: owned, edit, view, public',
  })
  accessFilter?: 'owned' | 'edit' | 'view' | 'public';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  includeDeleted?: boolean;
}
