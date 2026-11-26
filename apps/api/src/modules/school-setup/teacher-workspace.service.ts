import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  SchoolMembershipRole,
  SchoolMembershipStatus,
  SchoolStatus,
  TeacherClassworkStatus,
} from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/authenticated-user";
import { PrismaService } from "../../database/prisma.service";
import type { CreateTeacherClassworkDto } from "./teacher-workspace.dto";

@Injectable()
export class TeacherWorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspace(schoolSlug: string, user: AuthenticatedUser) {
    const { school, membership } = await this.authorizeTeacher(schoolSlug, user);
    const assignments = await this.prisma.teacherAssignment.findMany({
      where: {
        schoolId: school.id,
        teacherMembershipId: membership.id,
        subjectOffering: { schoolId: school.id },
      },
      orderBy: [
        { subjectOffering: { term: { startsOn: "desc" } } },
        { subjectOffering: { subject: { name: "asc" } } },
        { subjectOffering: { classArm: { name: "asc" } } },
      ],
      select: {
        id: true,
        subjectOffering: {
          select: {
            subject: { select: { id: true, name: true, code: true } },
            term: {
              select: {
                id: true,
                name: true,
                startsOn: true,
                endsOn: true,
                academicYear: { select: { id: true, name: true } },
              },
            },
            classArm: {
              select: {
                id: true,
                name: true,
                grade: { select: { name: true } },
                campus: { select: { name: true } },
                academicYear: { select: { id: true, name: true } },
                _count: { select: { studentEnrollments: true } },
              },
            },
            _count: { select: { teacherAssignments: true } },
          },
        },
        _count: { select: { classwork: true } },
      },
    });

    return {
      school: { id: school.id, name: school.name, slug: school.slug },
      teacher: { id: membership.id, email: membership.email },
      assignments,
    };
  }

  async getAssignment(
    schoolSlug: string,
    assignmentId: string,
    user: AuthenticatedUser,
  ) {
    const { school, membership } = await this.authorizeTeacher(schoolSlug, user);
    const assignment = await this.findTeacherAssignment(
      school.id,
      membership.id,
      assignmentId,
    );

    const [roster, classwork] = await Promise.all([
      this.prisma.studentEnrollment.findMany({
        where: {
          schoolId: school.id,
          student: { schoolId: school.id },
          classArmId: assignment.subjectOffering.classArm.id,
          academicYearId: assignment.subjectOffering.classArm.academicYear.id,
        },
        orderBy: [
          { student: { lastName: "asc" } },
          { student: { firstName: "asc" } },
        ],
        select: {
          id: true,
          student: {
            select: { id: true, firstName: true, lastName: true, studentNumber: true },
          },
        },
      }),
      this.prisma.teacherClasswork.findMany({
        where: {
          schoolId: school.id,
          teacherMembershipId: membership.id,
          teacherAssignmentId: assignment.id,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { assignment, roster, classwork };
  }

  async createClasswork(
    schoolSlug: string,
    assignmentId: string,
    user: AuthenticatedUser,
    input: CreateTeacherClassworkDto,
  ) {
    const { school, membership } = await this.authorizeTeacher(schoolSlug, user);
    const assignment = await this.findTeacherAssignment(
      school.id,
      membership.id,
      assignmentId,
    );
    const title = input.title.trim();
    const content = input.content.trim();
    if (!title || !content) {
      throw new BadRequestException("Enter a title and lesson or task details.");
    }

    const dueAt = input.dueAt ? new Date(input.dueAt) : undefined;
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      throw new BadRequestException("Enter a valid due date.");
    }

    return this.prisma.$transaction(async (transaction) => {
      const classwork = await transaction.teacherClasswork.create({
        data: {
          schoolId: school.id,
          teacherMembershipId: membership.id,
          teacherAssignmentId: assignment.id,
          type: input.type,
          title,
          content,
          dueAt,
        },
      });
      await transaction.auditEvent.create({
        data: {
          actorAuthId: user.id,
          actorEmail: user.email,
          action: `school.teacher.${input.type.toLowerCase()}_draft.created`,
          entityType: "teacher_classwork",
          entityId: classwork.id,
          details: {
            schoolId: school.id,
            teacherAssignmentId: assignment.id,
            type: input.type,
          },
        },
      });
      return classwork;
    });
  }

  async shareClasswork(
    schoolSlug: string,
    assignmentId: string,
    classworkId: string,
    user: AuthenticatedUser,
  ) {
    const { school, membership } = await this.authorizeTeacher(schoolSlug, user);
    const assignment = await this.findTeacherAssignment(
      school.id,
      membership.id,
      assignmentId,
    );
    const classwork = await this.prisma.teacherClasswork.findFirst({
      where: {
        id: classworkId,
        schoolId: school.id,
        teacherMembershipId: membership.id,
        teacherAssignmentId: assignment.id,
      },
      select: { id: true, status: true, sharedAt: true },
    });
    if (!classwork) {
      throw new NotFoundException("Lesson or task not found.");
    }
    if (classwork.status === TeacherClassworkStatus.SHARED) {
      return classwork;
    }

    return this.prisma.$transaction(async (transaction) => {
      const sharedAt = new Date();
      const result = await transaction.teacherClasswork.updateMany({
        where: {
          id: classwork.id,
          schoolId: school.id,
          teacherMembershipId: membership.id,
          teacherAssignmentId: assignment.id,
          status: TeacherClassworkStatus.DRAFT,
        },
        data: { status: TeacherClassworkStatus.SHARED, sharedAt },
      });
      if (result.count !== 1) {
        throw new ConflictException("This lesson or task has already changed.");
      }
      await transaction.auditEvent.create({
        data: {
          actorAuthId: user.id,
          actorEmail: user.email,
          action: "school.teacher.classwork.shared",
          entityType: "teacher_classwork",
          entityId: classwork.id,
          details: {
            schoolId: school.id,
            teacherAssignmentId: assignment.id,
          },
        },
      });
      return {
        id: classwork.id,
        status: TeacherClassworkStatus.SHARED,
        sharedAt,
      };
    });
  }

  private async authorizeTeacher(schoolSlug: string, user: AuthenticatedUser) {
    if (!user.emailConfirmedAt) {
      throw new ForbiddenException(
        "Verify your email address before opening a teacher workspace.",
      );
    }

    const school = await this.prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true, name: true, slug: true, status: true },
    });
    if (!school || school.status === SchoolStatus.SUSPENDED) {
      throw new NotFoundException("School workspace not found.");
    }
    if (school.status !== SchoolStatus.ACTIVE) {
      throw new ForbiddenException(
        "The teacher workspace will be available when the school is active.",
      );
    }

    const membership = await this.prisma.schoolMembership.findFirst({
      where: {
        schoolId: school.id,
        authUserId: user.id,
        role: SchoolMembershipRole.TEACHER,
        status: SchoolMembershipStatus.ACTIVE,
      },
      select: { id: true, email: true },
    });
    if (!membership) {
      throw new ForbiddenException(
        "An active teacher membership is required for this school.",
      );
    }

    return { school, membership };
  }

  private async findTeacherAssignment(
    schoolId: string,
    teacherMembershipId: string,
    assignmentId: string,
  ) {
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        id: assignmentId,
        schoolId,
        teacherMembershipId,
        subjectOffering: { schoolId },
      },
      select: {
        id: true,
        subjectOffering: {
          select: {
            subject: { select: { id: true, name: true, code: true } },
            term: {
              select: {
                id: true,
                name: true,
                startsOn: true,
                endsOn: true,
                academicYear: { select: { id: true, name: true } },
              },
            },
            classArm: {
              select: {
                id: true,
                name: true,
                grade: { select: { name: true } },
                campus: { select: { name: true } },
                academicYear: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!assignment) {
      throw new NotFoundException("Assigned class was not found.");
    }
    return assignment;
  }
}
