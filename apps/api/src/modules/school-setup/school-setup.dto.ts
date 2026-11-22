import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateCampusDto {
  @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @IsOptional() @IsString() @MaxLength(24) code?: string;
  @IsOptional() @IsString() @MaxLength(240) address?: string;
  @IsOptional() @IsBoolean() isMainSite?: boolean;
}

export class CreateAcademicYearDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string;
  @IsDateString() startsOn!: string;
  @IsDateString() endsOn!: string;
}

export class CreateTermDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string;
  @IsDateString() startsOn!: string;
  @IsDateString() endsOn!: string;
  @IsInt() @Min(1) @Max(20) order!: number;
}

export class CreateGradeDto {
  @IsString() @MinLength(1) @MaxLength(80) name!: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) displayOrder?: number;
}

export class CreateClassArmDto {
  @IsUUID() campusId!: string;
  @IsUUID() academicYearId!: string;
  @IsUUID() gradeId!: string;
  @IsString() @MinLength(1) @MaxLength(40) name!: string;
}

export class CreateSubjectDto {
  @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @IsOptional() @IsString() @MaxLength(24) code?: string;
}

export class CreateSubjectOfferingDto {
  @IsUUID() classArmId!: string;
  @IsUUID() subjectId!: string;
  @IsUUID() termId!: string;
}
