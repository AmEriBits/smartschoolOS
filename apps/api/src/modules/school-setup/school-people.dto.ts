import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class InviteTeacherDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class CreateStudentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  studentNumber?: string;

  @IsUUID()
  classArmId!: string;
}

export class AssignTeacherDto {
  @IsUUID()
  teacherMembershipId!: string;

  @IsUUID()
  subjectOfferingId!: string;
}
