import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateTeacherClassworkDto {
  @IsIn(["LESSON", "TASK"])
  type!: "LESSON" | "TASK";

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
