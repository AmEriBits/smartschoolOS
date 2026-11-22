import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { PlatformSchoolsController } from "./platform-schools.controller";
import { SchoolApplicationsController } from "./school-applications.controller";
import { SchoolApplicationService } from "./school-application.service";
import { SchoolsController } from "./schools.controller";
import { SchoolSetupController } from "../school-setup/school-setup.controller";
import { SchoolSetupService } from "../school-setup/school-setup.service";
import { SchoolPeopleController } from "../school-setup/school-people.controller";
import { SchoolPeopleService } from "../school-setup/school-people.service";

@Module({
  imports: [AuthModule],
  controllers: [
    PlatformSchoolsController,
    SchoolApplicationsController,
    SchoolsController,
    SchoolSetupController,
    SchoolPeopleController,
  ],
  providers: [SchoolApplicationService, SchoolSetupService, SchoolPeopleService],
})
export class SchoolsModule {}
