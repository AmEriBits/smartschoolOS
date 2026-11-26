CREATE TYPE "TeacherClassworkType" AS ENUM ('LESSON', 'TASK');
CREATE TYPE "TeacherClassworkStatus" AS ENUM ('DRAFT', 'SHARED');

CREATE TABLE "TeacherClasswork" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "teacherMembershipId" UUID NOT NULL,
    "teacherAssignmentId" UUID NOT NULL,
    "type" "TeacherClassworkType" NOT NULL,
    "status" "TeacherClassworkStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "sharedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeacherClasswork_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeacherClasswork_schoolId_teacherMembershipId_createdAt_idx"
    ON "TeacherClasswork"("schoolId", "teacherMembershipId", "createdAt");
CREATE INDEX "TeacherClasswork_teacherAssignmentId_createdAt_idx"
    ON "TeacherClasswork"("teacherAssignmentId", "createdAt");

ALTER TABLE "TeacherClasswork"
    ADD CONSTRAINT "TeacherClasswork_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherClasswork"
    ADD CONSTRAINT "TeacherClasswork_teacherMembershipId_fkey"
    FOREIGN KEY ("teacherMembershipId") REFERENCES "SchoolMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherClasswork"
    ADD CONSTRAINT "TeacherClasswork_teacherAssignmentId_fkey"
    FOREIGN KEY ("teacherAssignmentId") REFERENCES "TeacherAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
