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
import { CreateSchoolApplicationDto } from "./school-application.dto";
import { SchoolApplicationService } from "./school-application.service";

@Controller("school-applications")
@UseGuards(SupabaseAuthGuard)
export class SchoolApplicationsController {
  constructor(private readonly applications: SchoolApplicationService) {}

  @Post()
  submit(@Req() request: AuthenticatedRequest, @Body() input: CreateSchoolApplicationDto) {
    return this.applications.submitApplication(request.user, input);
  }

  @Get("mine")
  getLatest(@Req() request: AuthenticatedRequest) {
    return this.applications.getLatestApplication(request.user.id);
  }

  @Get(":id")
  getMine(@Param("id", new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) {
    return this.applications.getApplication(request.user.id, id);
  }
}
