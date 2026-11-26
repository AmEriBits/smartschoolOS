import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedRequest } from "../../auth/authenticated-request";
import { SupabaseAuthGuard } from "../../auth/supabase-auth.guard";
import { ChangeStudentPasswordDto } from "./student-workspace.dto";
import { StudentWorkspaceService } from "./student-workspace.service";

@Controller("schools/:schoolSlug/student")
@UseGuards(SupabaseAuthGuard)
export class StudentWorkspaceController {
  constructor(private readonly studentWorkspace: StudentWorkspaceService) {}

  @Get("workspace")
  getWorkspace(
    @Param("schoolSlug") schoolSlug: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.studentWorkspace.getWorkspace(schoolSlug, request.user);
  }

  @Post("password")
  changePassword(
    @Param("schoolSlug") schoolSlug: string,
    @Req() request: AuthenticatedRequest,
    @Body() input: ChangeStudentPasswordDto,
  ) {
    return this.studentWorkspace.changePassword(
      schoolSlug,
      request.user,
      input,
    );
  }
}
