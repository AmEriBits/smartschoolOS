ALTER TABLE "Student"
    ADD COLUMN "loginId" TEXT;

CREATE UNIQUE INDEX "Student_loginId_key" ON "Student"("loginId");

ALTER TABLE "SchoolMembership"
    ADD COLUMN "studentId" UUID,
    ADD COLUMN "needsPasswordChange" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "SchoolMembership_studentId_key"
    ON "SchoolMembership"("studentId");

ALTER TABLE "SchoolMembership"
    ADD CONSTRAINT "SchoolMembership_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
