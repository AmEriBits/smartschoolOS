-- CreateEnum
CREATE TYPE "SchoolApplicationStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('ONBOARDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SchoolMembershipRole" AS ENUM ('SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "SchoolMembershipStatus" AS ENUM ('INVITE_PENDING', 'INVITED', 'ACTIVE', 'INVITE_FAILED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "SchoolApplication" (
    "id" UUID NOT NULL,
    "schoolName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "schoolType" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "administratorEmail" TEXT NOT NULL,
    "applicantAuthId" UUID NOT NULL,
    "status" "SchoolApplicationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedAt" TIMESTAMP(3),
    "reviewedByAuthId" UUID,
    "rejectionReason" TEXT,
    "schoolId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "schoolCode" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "schoolType" TEXT NOT NULL,
    "status" "SchoolStatus" NOT NULL DEFAULT 'ONBOARDING',
    "discoverable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolMembership" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "authUserId" UUID,
    "email" TEXT NOT NULL,
    "role" "SchoolMembershipRole" NOT NULL,
    "status" "SchoolMembershipStatus" NOT NULL DEFAULT 'INVITE_PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformOperator" (
    "id" UUID NOT NULL,
    "authUserId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformOperator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "actorAuthId" UUID,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolApplication_schoolId_key" ON "SchoolApplication"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolApplication_status_createdAt_idx" ON "SchoolApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SchoolApplication_applicantAuthId_status_idx" ON "SchoolApplication"("applicantAuthId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "School_schoolCode_key" ON "School"("schoolCode");

-- CreateIndex
CREATE INDEX "School_status_discoverable_name_idx" ON "School"("status", "discoverable", "name");

-- CreateIndex
CREATE INDEX "SchoolMembership_authUserId_status_idx" ON "SchoolMembership"("authUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolMembership_schoolId_email_role_key" ON "SchoolMembership"("schoolId", "email", "role");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolMembership_schoolId_authUserId_role_key" ON "SchoolMembership"("schoolId", "authUserId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformOperator_authUserId_key" ON "PlatformOperator"("authUserId");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON "AuditEvent"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorAuthId_createdAt_idx" ON "AuditEvent"("actorAuthId", "createdAt");

-- AddForeignKey
ALTER TABLE "SchoolApplication" ADD CONSTRAINT "SchoolApplication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolMembership" ADD CONSTRAINT "SchoolMembership_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
