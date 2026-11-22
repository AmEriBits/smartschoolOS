import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Prisma,
  SchoolMembershipRole,
  SchoolMembershipStatus,
} from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/authenticated-user";
import { SupabaseAuthService } from "../../auth/supabase-auth.service";
import { PrismaService } from "../../database/prisma.service";
import { authorizeSchoolAdmin } from "../schools/authorize-school-admin";
import type {
  AssignTeacherDto,
  CreateStudentDto,
  InviteTeacherDto,
} from "./school-people.dto";

@Injectable()
export class SchoolPeopleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: SupabaseAuthService,
    private readonly config: ConfigService,
  ) {}

  async listPeople(schoolSlug: string, user: AuthenticatedUser) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, user);
    const [teachers, students, classArms, subjectOfferings, teacherAssignments] =
      await Promise.all([
        this.prisma.schoolMembership.findMany({
          where: { schoolId: school.id, role: SchoolMembershipRole.TEACHER },
          orderBy: { email: "asc" },
          select: { id: true, email: true, status: true, createdAt: true },
        }),
        this.prisma.student.findMany({
          where: { schoolId: school.id },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          include: {
            enrollments: {
              orderBy: { academicYear: { startsOn: "desc" } },
              include: {
                academicYear: { select: { id: true, name: true } },
                classArm: {
                  select: {
                    id: true,
                    name: true,
                    grade: { select: { name: true } },
                    campus: { select: { name: true } },
                  },
                },
              },
            },
          },
        }),
        this.prisma.classArm.findMany({
          where: { schoolId: school.id },
          orderBy: [
            { academicYear: { startsOn: "desc" } },
            { grade: { displayOrder: "asc" } },
            { name: "asc" },
          ],
          select: {
            id: true,
            name: true,
            academicYear: { select: { id: true, name: true } },
            campus: { select: { name: true } },
            grade: { select: { name: true } },
          },
        }),
        this.prisma.subjectOffering.findMany({
          where: { schoolId: school.id },
          orderBy: [{ subject: { name: "asc" } }, { classArm: { name: "asc" } }],
          select: {
            id: true,
            subject: { select: { name: true } },
            term: {
              select: { name: true, academicYear: { select: { name: true } } },
            },
            classArm: {
              select: {
                name: true,
                grade: { select: { name: true } },
                campus: { select: { name: true } },
              },
            },
          },
        }),
        this.prisma.teacherAssignment.findMany({
          where: { schoolId: school.id },
          orderBy: { createdAt: "desc" },
          include: {
            teacher: { select: { id: true, email: true, status: true } },
            subjectOffering: {
              select: {
                subject: { select: { name: true } },
                term: {
                  select: { name: true, academicYear: { select: { name: true } } },
                },
                classArm: {
                  select: {
                    name: true,
                    grade: { select: { name: true } },
                    campus: { select: { name: true } },
                  },
                },
              },
            },
          },
        }),
      ]);

    return {
      school: { id: school.id, name: school.name, slug: school.slug },
      teachers,
      students,
      classArms,
      subjectOfferings,
      teacherAssignments,
    };
  }

  async inviteTeacher(
    schoolSlug: string,
    actor: AuthenticatedUser,
    input: InviteTeacherDto,
  ) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, actor);
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.schoolMembership.findUnique({
      where: {
        schoolId_email_role: {
          schoolId: school.id,
          email,
          role: SchoolMembershipRole.TEACHER,
        },
      },
      select: { id: true, status: true },
    });

    if (existing) {
      if (
        existing.status !== SchoolMembershipStatus.INVITE_PENDING &&
        existing.status !== SchoolMembershipStatus.INVITE_FAILED
      ) {
        throw new ConflictException(
          "A teacher membership or invitation already exists for this email.",
        );
      }
      await this.sendTeacherInvite(school.id, school.slug, existing.id, actor);
      return { email, status: SchoolMembershipStatus.INVITED };
    }

    let membershipId: string;
    try {
      const membership = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.schoolMembership.create({
          data: {
            schoolId: school.id,
            email,
            role: SchoolMembershipRole.TEACHER,
            status: SchoolMembershipStatus.INVITE_PENDING,
          },
          select: { id: true },
        });
        await this.audit(
          transaction,
          actor,
          school.id,
          "school.teacher.invitation_requested",
          "school_membership",
          created.id,
          { email },
        );
        return created;
      });
      membershipId = membership.id;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "A teacher membership or invitation already exists for this email.",
        );
      }
      throw error;
    }

    await this.sendTeacherInvite(school.id, school.slug, membershipId, actor);
    return { email, status: SchoolMembershipStatus.INVITED };
  }

  async retryTeacherInvitation(
    schoolSlug: string,
    actor: AuthenticatedUser,
    membershipId: string,
  ) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, actor);
    await this.sendTeacherInvite(school.id, school.slug, membershipId, actor);
    return { membershipId, status: SchoolMembershipStatus.INVITED };
  }

  async createStudent(
    schoolSlug: string,
    actor: AuthenticatedUser,
    input: CreateStudentDto,
  ) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, actor);
    const firstName = this.requiredName(input.firstName, "First name");
    const lastName = this.requiredName(input.lastName, "Last name");
    const studentNumber = input.studentNumber?.trim() || undefined;
    const classArm = await this.prisma.classArm.findFirst({
      where: { id: input.classArmId, schoolId: school.id },
      select: { id: true, academicYearId: true },
    });
    if (!classArm) {
      throw new NotFoundException("Choose a class group belonging to this school.");
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const student = await transaction.student.create({
          data: { schoolId: school.id, firstName, lastName, studentNumber },
        });
        const enrollment = await transaction.studentEnrollment.create({
          data: {
            schoolId: school.id,
            studentId: student.id,
            classArmId: classArm.id,
            academicYearId: classArm.academicYearId,
          },
          include: {
            classArm: {
              select: {
                id: true,
                name: true,
                grade: { select: { name: true } },
                academicYear: { select: { id: true, name: true } },
                campus: { select: { name: true } },
              },
            },
          },
        });
        await this.audit(
          transaction,
          actor,
          school.id,
          "school.student.enrolled",
          "student",
          student.id,
          { classArmId: classArm.id, academicYearId: classArm.academicYearId },
        );
        return { ...student, enrollments: [enrollment] };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("A student with this number already exists in this school.");
      }
      throw error;
    }
  }

  async assignTeacher(
    schoolSlug: string,
    actor: AuthenticatedUser,
    input: AssignTeacherDto,
  ) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, actor);
    const [teacher, subjectOffering] = await Promise.all([
      this.prisma.schoolMembership.findFirst({
        where: {
          id: input.teacherMembershipId,
          schoolId: school.id,
          role: SchoolMembershipRole.TEACHER,
          status: SchoolMembershipStatus.ACTIVE,
        },
        select: { id: true },
      }),
      this.prisma.subjectOffering.findFirst({
        where: { id: input.subjectOfferingId, schoolId: school.id },
        select: { id: true },
      }),
    ]);
    if (!teacher || !subjectOffering) {
      throw new NotFoundException(
        "Choose an active teacher and a subject offering belonging to this school.",
      );
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const assignment = await transaction.teacherAssignment.create({
          data: {
            schoolId: school.id,
            teacherMembershipId: teacher.id,
            subjectOfferingId: subjectOffering.id,
          },
          include: {
            teacher: { select: { id: true, email: true } },
            subjectOffering: {
              select: {
                subject: { select: { name: true } },
                term: {
                  select: { name: true, academicYear: { select: { name: true } } },
                },
                classArm: {
                  select: {
                    name: true,
                    grade: { select: { name: true } },
                    campus: { select: { name: true } },
                  },
                },
              },
            },
          },
        });
        await this.audit(
          transaction,
          actor,
          school.id,
          "school.teacher.assigned",
          "teacher_assignment",
          assignment.id,
          {
            teacherMembershipId: teacher.id,
            subjectOfferingId: subjectOffering.id,
          },
        );
        return assignment;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "This teacher is already assigned to the selected subject offering.",
        );
      }
      throw error;
    }
  }

  async unassignTeacher(
    schoolSlug: string,
    actor: AuthenticatedUser,
    assignmentId: string,
  ) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, actor);
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: { id: assignmentId, schoolId: school.id },
      select: { id: true, teacherMembershipId: true, subjectOfferingId: true },
    });
    if (!assignment) {
      throw new NotFoundException("Teacher assignment not found.");
    }

    await this.prisma.$transaction(async (transaction) => {
      const deleted = await transaction.teacherAssignment.deleteMany({
        where: { id: assignment.id, schoolId: school.id },
      });
      if (deleted.count !== 1) {
        throw new ConflictException("This teacher assignment has already changed.");
      }
      await this.audit(
        transaction,
        actor,
        school.id,
        "school.teacher.unassigned",
        "teacher_assignment",
        assignment.id,
        {
          teacherMembershipId: assignment.teacherMembershipId,
          subjectOfferingId: assignment.subjectOfferingId,
        },
      );
    });

    return { assignmentId: assignment.id, removed: true };
  }

  private async sendTeacherInvite(
    schoolId: string,
    schoolSlug: string,
    membershipId: string,
    actor: AuthenticatedUser,
  ) {
    const membership = await this.prisma.schoolMembership.findFirst({
      where: {
        id: membershipId,
        schoolId,
        role: SchoolMembershipRole.TEACHER,
      },
      select: { id: true, email: true, status: true },
    });
    if (!membership) {
      throw new NotFoundException("Teacher membership not found.");
    }
    if (
      membership.status !== SchoolMembershipStatus.INVITE_PENDING &&
      membership.status !== SchoolMembershipStatus.INVITE_FAILED
    ) {
      throw new ConflictException(
        "This teacher invitation is already in progress or has already been accepted.",
      );
    }

    const claimed = await this.prisma.schoolMembership.updateMany({
      where: { id: membership.id, status: membership.status },
      data: { status: SchoolMembershipStatus.INVITE_SENDING },
    });
    if (claimed.count !== 1) {
      throw new ConflictException("This teacher invitation is already being processed.");
    }

    try {
      const portalOrigin = this.config.get<string>("SCHOOL_PORTAL_ORIGIN")?.trim();
      const webOrigins = this.config.get<string>("WEB_ORIGIN")?.split(",");
      const origin = (portalOrigin || webOrigins?.[0]?.trim())?.replace(/\/+$/, "");
      if (!origin) {
        throw new ServiceUnavailableException(
          "SCHOOL_PORTAL_ORIGIN or WEB_ORIGIN must be configured before teacher invitations can be sent.",
        );
      }
      const redirectTo = `${origin}/s/${encodeURIComponent(schoolSlug)}/workspace/teacher`;
      const invitedUser = await this.auth.inviteUserByEmail(membership.email, redirectTo);
      await this.prisma.$transaction([
        this.prisma.schoolMembership.update({
          where: { id: membership.id },
          data: {
            authUserId: invitedUser.id,
            status: SchoolMembershipStatus.INVITED,
          },
        }),
        this.prisma.auditEvent.create({
          data: {
            actorAuthId: actor.id,
            actorEmail: actor.email,
            action: "school.teacher.invited",
            entityType: "school_membership",
            entityId: membership.id,
            details: { schoolId, email: membership.email },
          },
        }),
      ]);
    } catch (error) {
      await this.prisma.$transaction([
        this.prisma.schoolMembership.update({
          where: { id: membership.id },
          data: { status: SchoolMembershipStatus.INVITE_FAILED },
        }),
        this.prisma.auditEvent.create({
          data: {
            actorAuthId: actor.id,
            actorEmail: actor.email,
            action: "school.teacher.invite_failed",
            entityType: "school_membership",
            entityId: membership.id,
            details: { schoolId, email: membership.email },
          },
        }),
      ]);
      throw error;
    }
  }

  private audit(
    transaction: Prisma.TransactionClient,
    actor: AuthenticatedUser,
    schoolId: string,
    action: string,
    entityType: string,
    entityId: string,
    details: Prisma.InputJsonObject,
  ) {
    return transaction.auditEvent.create({
      data: {
        actorAuthId: actor.id,
        actorEmail: actor.email,
        action,
        entityType,
        entityId,
        details: { schoolId, ...details },
      },
    });
  }

  private requiredName(value: string, field: string) {
    const name = value.trim();
    if (!name) {
      throw new BadRequestException(`${field} is required.`);
    }
    return name;
  }
}
