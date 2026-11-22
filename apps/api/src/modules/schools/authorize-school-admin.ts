import { ForbiddenException, NotFoundException } from "@nestjs/common";
import {
  SchoolMembershipRole,
  SchoolMembershipStatus,
  SchoolStatus,
} from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/authenticated-user";
import { PrismaService } from "../../database/prisma.service";

export async function authorizeSchoolAdmin(
  prisma: PrismaService,
  schoolSlug: string,
  user: AuthenticatedUser,
) {
  if (!user.emailConfirmedAt) {
    throw new ForbiddenException("Verify your email address before managing school records.");
  }

  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    select: { id: true, name: true, slug: true, status: true },
  });
  if (!school || school.status === SchoolStatus.SUSPENDED) {
    throw new NotFoundException("School workspace not found.");
  }

  const membership = await prisma.schoolMembership.findFirst({
    where: {
      schoolId: school.id,
      authUserId: user.id,
      role: SchoolMembershipRole.SCHOOL_ADMIN,
      status: SchoolMembershipStatus.ACTIVE,
    },
    select: { id: true },
  });
  if (!membership) {
    throw new ForbiddenException("An active school administrator membership is required.");
  }

  return school;
}
