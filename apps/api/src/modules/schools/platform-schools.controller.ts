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
import { PlatformOperatorGuard } from "../../auth/platform-operator.guard";
import { SupabaseAuthGuard } from "../../auth/supabase-auth.guard";
import { RejectSchoolApplicationDto } from "./school-application.dto";
import { SchoolApplicationService } from "./school-application.service";

@Controller("platform")
@UseGuards(SupabaseAuthGuard, PlatformOperatorGuard)
export class PlatformSchoolsController {
  constructor(private readonly applications: SchoolApplicationService) {}

  @Get("school-applications")
  listApplications() {
    return this.applications.listPendingApplications();
  }

  @Post("school-applications/:id/approve")
  approve(@Param("id", new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) {
    return this.applications.approveApplication(id, request.user);
  }

  @Post("school-applications/:id/reject")
  reject(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: RejectSchoolApplicationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.applications.rejectApplication(id, input.reason, request.user);
  }

  @Get("schools")
  listSchools() {
    return this.applications.listPlatformSchools();
  }

  @Post("schools/:id/invite-admin")
  inviteAdmin(@Param("id", new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) {
    return this.applications.inviteAdministratorAgain(id, request.user);
  }

  @Post("schools/:id/activate")
  activate(@Param("id", new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) {
    return this.applications.activateSchool(id, request.user);
  }
}
