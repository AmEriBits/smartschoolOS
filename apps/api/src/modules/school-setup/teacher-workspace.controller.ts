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
import { CreateTeacherClassworkDto } from "./teacher-workspace.dto";
import { TeacherWorkspaceService } from "./teacher-workspace.service";

@Controller("schools/:schoolSlug/teacher")
@UseGuards(SupabaseAuthGuard)
export class TeacherWorkspaceController {
  constructor(private readonly teacherWorkspace: TeacherWorkspaceService) {}

  @Get("workspace")
  getWorkspace(
    @Param("schoolSlug") schoolSlug: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.teacherWorkspace.getWorkspace(schoolSlug, request.user);
  }

  @Get("assignments/:assignmentId")
  getAssignment(
    @Param("schoolSlug") schoolSlug: string,
    @Param("assignmentId", new ParseUUIDPipe()) assignmentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.teacherWorkspace.getAssignment(
      schoolSlug,
      assignmentId,
      request.user,
    );
  }

  @Post("assignments/:assignmentId/classwork")
  createClasswork(
    @Param("schoolSlug") schoolSlug: string,
    @Param("assignmentId", new ParseUUIDPipe()) assignmentId: string,
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateTeacherClassworkDto,
  ) {
    return this.teacherWorkspace.createClasswork(
      schoolSlug,
      assignmentId,
      request.user,
      input,
    );
  }

  @Post("assignments/:assignmentId/classwork/:classworkId/share")
  shareClasswork(
    @Param("schoolSlug") schoolSlug: string,
    @Param("assignmentId", new ParseUUIDPipe()) assignmentId: string,
    @Param("classworkId", new ParseUUIDPipe()) classworkId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.teacherWorkspace.shareClasswork(
      schoolSlug,
      assignmentId,
      classworkId,
      request.user,
    );
  }
}
