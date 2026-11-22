import { IsEmail, IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class CreateSchoolApplicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  schoolName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  location!: string;

  @IsIn(["Primary school", "Secondary school", "K–12 school", "School group"])
  schoolType!: string;

  @IsEmail()
  @MaxLength(254)
  administratorEmail!: string;
}

export class RejectSchoolApplicationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
