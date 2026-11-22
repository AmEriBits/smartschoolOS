import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from "@nestjs/common";
import type { AuthenticatedRequest } from "../../auth/authenticated-request";
import { SupabaseAuthGuard } from "../../auth/supabase-auth.guard";
import {
  CreateAcademicYearDto,
  CreateCampusDto,
  CreateClassArmDto,
  CreateGradeDto,
  CreateSubjectDto,
  CreateSubjectOfferingDto,
  CreateTermDto,
} from "./school-setup.dto";
import { SchoolSetupService } from "./school-setup.service";

@Controller("schools/:schoolSlug/setup")
@UseGuards(SupabaseAuthGuard)
export class SchoolSetupController {
  constructor(private readonly setup: SchoolSetupService) {}

  @Get()
  getSetup(@Param("schoolSlug") slug: string, @Req() request: AuthenticatedRequest) {
    return this.setup.getSetup(slug, request.user);
  }

  @Post("campuses")
  createCampus(@Param("schoolSlug") slug: string, @Req() request: AuthenticatedRequest, @Body() input: CreateCampusDto) {
    return this.setup.createCampus(slug, request.user, input);
  }

  @Post("academic-years")
  createAcademicYear(@Param("schoolSlug") slug: string, @Req() request: AuthenticatedRequest, @Body() input: CreateAcademicYearDto) {
    return this.setup.createAcademicYear(slug, request.user, input);
  }

  @Post("academic-years/:yearId/terms")
  createTerm(
    @Param("schoolSlug") slug: string,
    @Param("yearId", new ParseUUIDPipe()) yearId: string,
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateTermDto,
  ) {
    return this.setup.createTerm(slug, yearId, request.user, input);
  }

  @Post("grades")
  createGrade(@Param("schoolSlug") slug: string, @Req() request: AuthenticatedRequest, @Body() input: CreateGradeDto) {
    return this.setup.createGrade(slug, request.user, input);
  }

  @Post("class-arms")
  createClassArm(@Param("schoolSlug") slug: string, @Req() request: AuthenticatedRequest, @Body() input: CreateClassArmDto) {
    return this.setup.createClassArm(slug, request.user, input);
  }

  @Post("subjects")
  createSubject(@Param("schoolSlug") slug: string, @Req() request: AuthenticatedRequest, @Body() input: CreateSubjectDto) {
    return this.setup.createSubject(slug, request.user, input);
  }

  @Post("subject-offerings")
  createSubjectOffering(@Param("schoolSlug") slug: string, @Req() request: AuthenticatedRequest, @Body() input: CreateSubjectOfferingDto) {
    return this.setup.createSubjectOffering(slug, request.user, input);
  }
}
