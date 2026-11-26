import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  SchoolMembershipRole,
  SchoolMembershipStatus,
  SchoolStatus,
  TeacherClassworkStatus,
} from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/authenticated-user";
import { SupabaseAuthService } from "../../auth/supabase-auth.service";
import { PrismaService } from "../../database/prisma.service";
import type { ChangeStudentPasswordDto } from "./student-workspace.dto";

@Injectable()
export class StudentWorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: SupabaseAuthService,
  ) {}

  async getWorkspace(schoolSlug: string, user: AuthenticatedUser) {
    const { school, membership, student } = await this.authorizeStudent(schoolSlug, user);

    if (membership.needsPasswordChange) {
      return {
        school: { id: school.id, name: school.name, slug: school.slug },
        student,
        needsPasswordChange: true,
        classes: [],
      };
    }

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        schoolId: school.id,
        studentId: student.id,
        student: { schoolId: school.id },
        classArm: { schoolId: school.id },
        academicYear: { schoolId: school.id },
      },
      orderBy: { academicYear: { startsOn: "desc" } },
      select: {
        id: true,
        academicYear: { select: { id: true, name: true, startsOn: true, endsOn: true } },
        classArm: {
          select: {
            id: true,
            name: true,
            grade: { select: { name: true } },
            campus: { select: { name: true } },
          },
        },
      },
    });

    const assignments = enrollments.length
      ? await this.prisma.teacherAssignment.findMany({
          where: {
            schoolId: school.id,
            subjectOffering: {
              schoolId: school.id,
              OR: enrollments.map((enrollment) => ({
                classArmId: enrollment.classArm.id,
                term: { academicYearId: enrollment.academicYear.id },
              })),
            },
          },
          orderBy: [
            { subjectOffering: { term: { startsOn: "desc" } } },
            { subjectOffering: { subject: { name: "asc" } } },
          ],
          select: {
            subjectOffering: {
              select: {
                id: true,
                classArmId: true,
                subject: { select: { id: true, name: true, code: true } },
                term: {
                  select: {
                    id: true,
                    name: true,
                    startsOn: true,
                    endsOn: true,
                    academicYearId: true,
                    academicYear: { select: { id: true, name: true } },
                  },
                },
              },
            },
            classwork: {
              where: {
                schoolId: school.id,
                status: TeacherClassworkStatus.SHARED,
              },
              orderBy: { sharedAt: "desc" },
              select: {
                id: true,
                type: true,
                title: true,
                content: true,
                dueAt: true,
                sharedAt: true,
              },
            },
          },
        })
      : [];

    return {
      school: { id: school.id, name: school.name, slug: school.slug },
      student,
      needsPasswordChange: false,
      classes: enrollments.map((enrollment) => {
        const subjects = new Map<
          string,
          {
            subjectOffering: (typeof assignments)[number]["subjectOffering"];
            classwork: (typeof assignments)[number]["classwork"];
          }
        >();
        for (const assignment of assignments) {
          const offering = assignment.subjectOffering;
          if (
            offering.classArmId !== enrollment.classArm.id ||
            offering.term.academicYearId !== enrollment.academicYear.id
          ) {
            continue;
          }
          const existing = subjects.get(offering.id);
          if (existing) {
            existing.classwork.push(...assignment.classwork);
          } else {
            subjects.set(offering.id, {
              subjectOffering: offering,
              classwork: [...assignment.classwork],
            });
          }
        }
        return {
          ...enrollment,
          subjects: Array.from(subjects.values(), ({ subjectOffering, classwork }) => ({
            subject: subjectOffering.subject,
            term: subjectOffering.term,
            classwork: classwork.sort(
              (first, second) =>
                (second.sharedAt?.getTime() ?? 0) - (first.sharedAt?.getTime() ?? 0),
            ),
          })),
        };
      }),
    };
  }

  async changePassword(
    schoolSlug: string,
    user: AuthenticatedUser,
    input: ChangeStudentPasswordDto,
  ) {
    const { school, membership, student } = await this.authorizeStudent(schoolSlug, user);
    if (!membership.needsPasswordChange) {
      throw new ConflictException("A temporary password is not required for this account.");
    }
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException("Choose a new password different from the temporary password.");
    }

    await this.auth.verifyPassword(membership.email, input.currentPassword, user.id);
    await this.auth.updateUserPassword(user.id, input.newPassword);
    try {
      await this.prisma.$transaction(async (transaction) => {
        const updated = await transaction.schoolMembership.updateMany({
          where: {
            id: membership.id,
            schoolId: school.id,
            authUserId: user.id,
            role: SchoolMembershipRole.STUDENT,
            status: SchoolMembershipStatus.ACTIVE,
            needsPasswordChange: true,
          },
          data: { needsPasswordChange: false },
        });
        if (updated.count !== 1) {
          throw new ConflictException("The student account changed while updating its password.");
        }
        await transaction.auditEvent.create({
          data: {
            actorAuthId: user.id,
            actorEmail: user.email,
            action: "school.student.password_changed",
            entityType: "school_membership",
            entityId: membership.id,
            details: { schoolId: school.id, studentId: student.id },
          },
        });
      });
    } catch (error) {
      try {
        await this.auth.updateUserPassword(user.id, input.currentPassword);
      } catch {
        throw new ServiceUnavailableException(
          "The password change could not be completed safely. Contact the school administrator.",
        );
      }
      throw error;
    }

    return { passwordChanged: true };
  }

  private async authorizeStudent(schoolSlug: string, user: AuthenticatedUser) {
    if (!user.emailConfirmedAt) {
      throw new ForbiddenException("The student account is not verified.");
    }

    const school = await this.prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true, name: true, slug: true, status: true },
    });
    if (!school || school.status === SchoolStatus.SUSPENDED) {
      throw new NotFoundException("School workspace not found.");
    }
    if (school.status !== SchoolStatus.ACTIVE) {
      throw new ForbiddenException("Student access is available when the school is active.");
    }

    const membership = await this.prisma.schoolMembership.findFirst({
      where: {
        schoolId: school.id,
        authUserId: user.id,
        role: SchoolMembershipRole.STUDENT,
        status: SchoolMembershipStatus.ACTIVE,
        studentId: { not: null },
        student: { is: { schoolId: school.id } },
      },
      select: {
        id: true,
        email: true,
        needsPasswordChange: true,
        student: {
          select: {
            id: true,
            loginId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    const student = membership?.student;
    if (!membership || !student) {
      throw new ForbiddenException("An active student account is required for this school.");
    }

    return { school, membership, student };
  }
}
