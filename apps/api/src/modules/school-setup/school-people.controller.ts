import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedRequest } from "../../auth/authenticated-request";
import { SupabaseAuthGuard } from "../../auth/supabase-auth.guard";
import {
  AssignTeacherDto,
  CreateStudentDto,
  InviteTeacherDto,
} from "./school-people.dto";
import { SchoolPeopleService } from "./school-people.service";

@Controller("schools/:schoolSlug/people")
@UseGuards(SupabaseAuthGuard)
export class SchoolPeopleController {
  constructor(private readonly people: SchoolPeopleService) {}

  @Get()
  list(@Param("schoolSlug") slug: string, @Req() request: AuthenticatedRequest) {
    return this.people.listPeople(slug, request.user);
  }

  @Post("teachers")
  inviteTeacher(
    @Param("schoolSlug") slug: string,
    @Req() request: AuthenticatedRequest,
    @Body() input: InviteTeacherDto,
  ) {
    return this.people.inviteTeacher(slug, request.user, input);
  }

  @Post("teachers/:membershipId/invite")
  retryTeacherInvitation(
    @Param("schoolSlug") slug: string,
    @Param("membershipId", new ParseUUIDPipe()) membershipId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.people.retryTeacherInvitation(slug, request.user, membershipId);
  }

  @Post("students")
  createStudent(
    @Param("schoolSlug") slug: string,
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateStudentDto,
  ) {
    return this.people.createStudent(slug, request.user, input);
  }

  @Post("teacher-assignments")
  assignTeacher(
    @Param("schoolSlug") slug: string,
    @Req() request: AuthenticatedRequest,
    @Body() input: AssignTeacherDto,
  ) {
    return this.people.assignTeacher(slug, request.user, input);
  }

  @Post("teacher-assignments/:assignmentId/remove")
  unassignTeacher(
    @Param("schoolSlug") slug: string,
    @Param("assignmentId", new ParseUUIDPipe()) assignmentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.people.unassignTeacher(slug, request.user, assignmentId);
  }
}
