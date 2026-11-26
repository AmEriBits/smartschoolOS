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
import { TeacherWorkspaceController } from "../school-setup/teacher-workspace.controller";
import { TeacherWorkspaceService } from "../school-setup/teacher-workspace.service";
import { StudentWorkspaceController } from "../school-setup/student-workspace.controller";
import { StudentWorkspaceService } from "../school-setup/student-workspace.service";

@Module({
  imports: [AuthModule],
  controllers: [
    PlatformSchoolsController,
    SchoolApplicationsController,
    SchoolsController,
    SchoolSetupController,
    SchoolPeopleController,
    TeacherWorkspaceController,
    StudentWorkspaceController,
  ],
  providers: [
    SchoolApplicationService,
    SchoolSetupService,
    SchoolPeopleService,
    TeacherWorkspaceService,
    StudentWorkspaceService,
  ],
})
export class SchoolsModule {}
