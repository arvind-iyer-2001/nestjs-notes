import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetUsersQueryDto {
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
  @Transform(({ value }: { value: string }) => `${value?.trim()}`) // Trim whitespace
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['id', 'email', 'name'], {
    message: 'orderBy must be one of: id, email, name',
  })
  orderBy?: 'id' | 'email' | 'name';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be either asc or desc' })
  sortOrder?: 'asc' | 'desc';
}
