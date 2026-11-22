import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { PlatformSchoolsController } from "./platform-schools.controller";
import { SchoolApplicationsController } from "./school-applications.controller";
import { SchoolApplicationService } from "./school-application.service";
import { SchoolsController } from "./schools.controller";

@Module({
  imports: [AuthModule],
  controllers: [PlatformSchoolsController, SchoolApplicationsController, SchoolsController],
  providers: [SchoolApplicationService],
})
export class SchoolsModule {}
