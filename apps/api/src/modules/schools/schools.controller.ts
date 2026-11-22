import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedRequest } from "../../auth/authenticated-request";
import { SupabaseAuthGuard } from "../../auth/supabase-auth.guard";
import { SchoolApplicationService } from "./school-application.service";

@Controller("schools")
export class SchoolsController {
  constructor(private readonly schools: SchoolApplicationService) {}

  @Get()
  list(@Query("search") search?: string) {
    return this.schools.listDiscoverableSchools(search);
  }

  @Get(":slug/access/:role")
  @UseGuards(SupabaseAuthGuard)
  verifyMembership(
    @Param("slug") slug: string,
    @Param("role") role: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.schools.verifyMembership(slug, role, request.user);
  }

  @Get(":slug")
  async getSchool(@Param("slug") slug: string) {
    const school = await this.schools.getDiscoverableSchool(slug);
    if (!school) {
      throw new NotFoundException("School not found.");
    }
    return school;
  }
}
