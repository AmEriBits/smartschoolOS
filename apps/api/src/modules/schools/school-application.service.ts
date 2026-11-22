import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Prisma,
  SchoolApplicationStatus,
  SchoolMembershipRole,
  SchoolMembershipStatus,
  SchoolStatus,
} from "@prisma/client";
import { randomBytes } from "node:crypto";
import type { AuthenticatedUser } from "../../auth/authenticated-user";
import { SupabaseAuthService } from "../../auth/supabase-auth.service";
import { PrismaService } from "../../database/prisma.service";
import type { CreateSchoolApplicationDto } from "./school-application.dto";

@Injectable()
export class SchoolApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: SupabaseAuthService,
    private readonly config: ConfigService,
  ) {}

  async submitApplication(user: AuthenticatedUser, input: CreateSchoolApplicationDto) {
    const applicantEmail = user.email;
    if (!applicantEmail || !user.emailConfirmedAt) {
      throw new ForbiddenException("Verify your email address before submitting a school application.");
    }

    const schoolName = input.schoolName.trim();
    const location = input.location.trim();
    if (!schoolName || !location) {
      throw new BadRequestException("School name and location are required.");
    }

    const existing = await this.prisma.schoolApplication.findFirst({
      where: {
        applicantAuthId: user.id,
        schoolName: { equals: schoolName, mode: "insensitive" },
        status: SchoolApplicationStatus.PENDING_REVIEW,
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("You already have a pending application for this school.");
    }

    return this.prisma.$transaction(async (transaction) => {
      const application = await transaction.schoolApplication.create({
        data: {
          schoolName,
          location,
          schoolType: input.schoolType,
          contactEmail: applicantEmail,
          administratorEmail: input.administratorEmail.trim().toLowerCase(),
          applicantAuthId: user.id,
        },
        select: {
          id: true,
          schoolName: true,
          administratorEmail: true,
          status: true,
          createdAt: true,
        },
      });
      await transaction.auditEvent.create({
        data: {
          actorAuthId: user.id,
          actorEmail: applicantEmail,
          action: "school.application.submitted",
          entityType: "school_application",
          entityId: application.id,
          details: { schoolName },
        },
      });
      return application;
    });
  }

  async getApplication(userId: string, applicationId: string) {
    const application = await this.prisma.schoolApplication.findFirst({
      where: { id: applicationId, applicantAuthId: userId },
      select: {
        id: true,
        schoolName: true,
        administratorEmail: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        school: { select: { slug: true, schoolCode: true } },
      },
    });
    if (!application) {
      throw new NotFoundException("School application not found.");
    }

    return application;
  }

  async getLatestApplication(userId: string) {
    return this.prisma.schoolApplication.findFirst({
      where: { applicantAuthId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        schoolName: true,
        administratorEmail: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        school: { select: { slug: true, schoolCode: true } },
      },
    });
  }

  async listPendingApplications() {
    return this.prisma.schoolApplication.findMany({
      where: { status: SchoolApplicationStatus.PENDING_REVIEW },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        schoolName: true,
        location: true,
        schoolType: true,
        contactEmail: true,
        administratorEmail: true,
        createdAt: true,
      },
    });
  }

  async approveApplication(applicationId: string, actor: AuthenticatedUser) {
    const application = await this.prisma.schoolApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new NotFoundException("School application not found.");
    }
    if (application.status !== SchoolApplicationStatus.PENDING_REVIEW) {
      throw new ConflictException("Only pending school applications can be approved.");
    }

    const baseSlug = this.slugify(application.schoolName);
    if (!baseSlug) {
      throw new BadRequestException("The school name cannot be used to create a school URL.");
    }

    let school: { id: string; slug: string; schoolCode: string };
    for (let attempt = 0; ; attempt += 1) {
      const slug = await this.uniqueSlug(baseSlug, attempt);
      const schoolCode = this.createSchoolCode();

      try {
        school = await this.prisma.$transaction(async (transaction) => {
          const createdSchool = await transaction.school.create({
            data: {
              name: application.schoolName,
              slug,
              schoolCode,
              location: application.location,
              schoolType: application.schoolType,
              status: SchoolStatus.ONBOARDING,
              discoverable: false,
              memberships: {
                create: {
                  email: application.administratorEmail,
                  role: SchoolMembershipRole.SCHOOL_ADMIN,
                  authUserId:
                    application.administratorEmail.toLowerCase() === application.contactEmail.toLowerCase()
                      ? application.applicantAuthId
                      : undefined,
                  status:
                    application.administratorEmail.toLowerCase() === application.contactEmail.toLowerCase()
                      ? SchoolMembershipStatus.ACTIVE
                      : SchoolMembershipStatus.INVITE_PENDING,
                  acceptedAt:
                    application.administratorEmail.toLowerCase() === application.contactEmail.toLowerCase()
                      ? new Date()
                      : undefined,
                },
              },
            },
            select: { id: true, slug: true, schoolCode: true },
          });

          const reviewed = await transaction.schoolApplication.updateMany({
            where: {
              id: application.id,
              status: SchoolApplicationStatus.PENDING_REVIEW,
            },
            data: {
              status: SchoolApplicationStatus.APPROVED,
              reviewedAt: new Date(),
              reviewedByAuthId: actor.id,
              schoolId: createdSchool.id,
            },
          });
          if (reviewed.count !== 1) {
            throw new ConflictException("This application has already been reviewed.");
          }

          await transaction.auditEvent.create({
            data: {
              actorAuthId: actor.id,
              actorEmail: actor.email,
              action: "school.application.approved",
              entityType: "school",
              entityId: createdSchool.id,
              details: { applicationId: application.id, slug: createdSchool.slug },
            },
          });
          if (application.administratorEmail.toLowerCase() === application.contactEmail.toLowerCase()) {
            await transaction.auditEvent.create({
              data: {
                actorAuthId: actor.id,
                actorEmail: actor.email,
                action: "school.admin.assigned",
                entityType: "school",
                entityId: createdSchool.id,
                details: { email: application.administratorEmail },
              },
            });
          }

          return createdSchool;
        });
        break;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 4) {
          continue;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new ConflictException("A unique school identifier could not be allocated. Please retry approval.");
        }
        throw error;
      }
    }

    const alreadyAuthenticated =
      application.administratorEmail.toLowerCase() === application.contactEmail.toLowerCase();
    if (!alreadyAuthenticated) {
      await this.sendAdministratorInvite(school.id, school.slug, actor);
    }

    return {
      id: school.id,
      slug: school.slug,
      schoolCode: school.schoolCode,
      administratorEmail: application.administratorEmail,
      invitationStatus: alreadyAuthenticated ? "ALREADY_AUTHENTICATED" as const : "INVITED" as const,
    };
  }

  async rejectApplication(applicationId: string, reason: string, actor: AuthenticatedUser) {
    const application = await this.prisma.schoolApplication.findUnique({
      where: { id: applicationId },
      select: { id: true, status: true },
    });
    if (!application) {
      throw new NotFoundException("School application not found.");
    }
    if (application.status !== SchoolApplicationStatus.PENDING_REVIEW) {
      throw new ConflictException("Only pending school applications can be rejected.");
    }

    await this.prisma.$transaction(async (transaction) => {
      const reviewed = await transaction.schoolApplication.updateMany({
        where: { id: application.id, status: SchoolApplicationStatus.PENDING_REVIEW },
        data: {
          status: SchoolApplicationStatus.REJECTED,
          rejectionReason: reason.trim(),
          reviewedAt: new Date(),
          reviewedByAuthId: actor.id,
        },
      });
      if (reviewed.count !== 1) {
        throw new ConflictException("This application has already been reviewed.");
      }

      await transaction.auditEvent.create({
        data: {
          actorAuthId: actor.id,
          actorEmail: actor.email,
          action: "school.application.rejected",
          entityType: "school_application",
          entityId: application.id,
          details: { reason: reason.trim() },
        },
      });
    });

    return { id: application.id, status: SchoolApplicationStatus.REJECTED };
  }

  async listPlatformSchools() {
    return this.prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        schoolCode: true,
        location: true,
        status: true,
        discoverable: true,
        createdAt: true,
        memberships: {
          where: { role: SchoolMembershipRole.SCHOOL_ADMIN },
          select: { email: true, status: true },
          take: 1,
        },
      },
    });
  }

  async activateSchool(schoolId: string, actor: AuthenticatedUser) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        memberships: {
          where: { role: SchoolMembershipRole.SCHOOL_ADMIN },
          select: { status: true },
          take: 1,
        },
      },
    });
    if (!school) {
      throw new NotFoundException("School not found.");
    }
    if (school.status !== SchoolStatus.ONBOARDING) {
      throw new ConflictException("Only an onboarding school can be activated.");
    }
    if (school.memberships[0]?.status !== SchoolMembershipStatus.ACTIVE) {
      throw new ConflictException("The first school administrator must accept the invitation before activation.");
    }

    const activeSchool = await this.prisma.$transaction(async (transaction) => {
      const changed = await transaction.school.updateMany({
        where: { id: school.id, status: SchoolStatus.ONBOARDING },
        data: { status: SchoolStatus.ACTIVE, discoverable: true },
      });
      if (changed.count !== 1) {
        throw new ConflictException("This school has already changed state.");
      }
      const updated = await transaction.school.findUniqueOrThrow({
        where: { id: school.id },
        select: { id: true, name: true, slug: true, schoolCode: true },
      });
      await transaction.auditEvent.create({
        data: {
          actorAuthId: actor.id,
          actorEmail: actor.email,
          action: "school.activated",
          entityType: "school",
          entityId: school.id,
          details: { slug: school.slug },
        },
      });
      return updated;
    });

    return activeSchool;
  }

  async inviteAdministratorAgain(schoolId: string, actor: AuthenticatedUser) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, slug: true },
    });
    if (!school) {
      throw new NotFoundException("School not found.");
    }
    await this.sendAdministratorInvite(school.id, school.slug, actor);
    return { schoolId: school.id, invitationStatus: "INVITED" as const };
  }

  async listDiscoverableSchools(search?: string) {
    const query = search?.trim();
    return this.prisma.school.findMany({
      where: {
        status: SchoolStatus.ACTIVE,
        discoverable: true,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { location: { contains: query, mode: "insensitive" as const } },
                { schoolCode: { equals: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 50,
      select: {
        id: true,
        name: true,
        slug: true,
        schoolCode: true,
        location: true,
        schoolType: true,
      },
    });
  }

  async getDiscoverableSchool(slug: string) {
    return this.prisma.school.findFirst({
      where: { slug, status: SchoolStatus.ACTIVE, discoverable: true },
      select: {
        id: true,
        name: true,
        slug: true,
        schoolCode: true,
        location: true,
        schoolType: true,
      },
    });
  }

  async verifyMembership(schoolSlug: string, roleName: string, user: AuthenticatedUser) {
    const role = this.toMembershipRole(roleName);
    const school = await this.prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        location: true,
        schoolCode: true,
        status: true,
      },
    });
    if (!school || school.status === SchoolStatus.SUSPENDED) {
      throw new NotFoundException("School workspace not found.");
    }
    if (!user.emailConfirmedAt) {
      throw new ForbiddenException("Verify your email address before entering a school workspace.");
    }

    const membership = await this.prisma.schoolMembership.findFirst({
      where: {
        schoolId: school.id,
        role,
        OR: [
          { authUserId: user.id },
          {
            authUserId: null,
            email: { equals: user.email ?? "", mode: "insensitive" },
            status: {
              in: [
                SchoolMembershipStatus.INVITED,
                SchoolMembershipStatus.INVITE_PENDING,
                SchoolMembershipStatus.INVITE_FAILED,
              ],
            },
          },
        ],
      },
      select: { id: true, authUserId: true, email: true, status: true },
    });
    if (!membership) {
      throw new ForbiddenException("Your account does not have this role at the selected school.");
    }

    let membershipStatus = membership.status;
    let newlyAccepted = false;
    if (
      membership.authUserId === null ||
      membershipStatus === SchoolMembershipStatus.INVITED
    ) {
      await this.prisma.$transaction([
        this.prisma.schoolMembership.update({
          where: { id: membership.id },
          data: {
            authUserId: user.id,
            status: SchoolMembershipStatus.ACTIVE,
            acceptedAt: new Date(),
          },
        }),
        this.prisma.auditEvent.create({
          data: {
            actorAuthId: user.id,
            actorEmail: user.email,
            action: "school.membership.accepted",
            entityType: "school_membership",
            entityId: membership.id,
            details: { schoolId: school.id, role },
          },
        }),
      ]);
      membershipStatus = SchoolMembershipStatus.ACTIVE;
      newlyAccepted = true;
    }

    if (membershipStatus !== SchoolMembershipStatus.ACTIVE) {
      throw new ForbiddenException("This school membership is not active.");
    }

    return {
      allowed: true,
      role,
      schoolStatus: school.status,
      membershipStatus,
      newlyAccepted,
      activationRequired: school.status === SchoolStatus.ONBOARDING,
      school: {
        name: school.name,
        slug: school.slug,
        location: school.location,
        schoolCode: school.schoolCode,
      },
    };
  }

  private async sendAdministratorInvite(
    schoolId: string,
    schoolSlug: string,
    actor: AuthenticatedUser,
  ) {
    const membership = await this.prisma.schoolMembership.findFirst({
      where: { schoolId, role: SchoolMembershipRole.SCHOOL_ADMIN },
      select: { id: true, email: true, status: true },
    });
    if (!membership) {
      throw new NotFoundException("The first school administrator membership was not found.");
    }
    if (membership.status === SchoolMembershipStatus.ACTIVE) {
      throw new ConflictException("The school administrator has already accepted the invitation.");
    }
    if (
      membership.status !== SchoolMembershipStatus.INVITE_PENDING &&
      membership.status !== SchoolMembershipStatus.INVITE_FAILED
    ) {
      throw new ConflictException("An administrator invitation is already in progress or has already been sent.");
    }

    const claimed = await this.prisma.schoolMembership.updateMany({
      where: { id: membership.id, status: membership.status },
      data: { status: SchoolMembershipStatus.INVITE_SENDING },
    });
    if (claimed.count !== 1) {
      throw new ConflictException("The administrator invitation is already being processed.");
    }

    try {
      const portalOrigin = this.config.get<string>("SCHOOL_PORTAL_ORIGIN")?.trim();
      const webOrigins = this.config.get<string>("WEB_ORIGIN")?.split(",");
      const origin = (portalOrigin || webOrigins?.[0]?.trim())?.replace(/\/+$/, "");
      if (!origin) {
        throw new ServiceUnavailableException(
          "SCHOOL_PORTAL_ORIGIN or WEB_ORIGIN must be configured before administrator invitations can be sent.",
        );
      }
      const redirectTo = `${origin}/s/${encodeURIComponent(schoolSlug)}/workspace/school-admin`;
      const invitedUser = await this.auth.inviteUserByEmail(membership.email, redirectTo);
      await this.prisma.$transaction([
        this.prisma.schoolMembership.update({
          where: { id: membership.id },
          data: { authUserId: invitedUser.id, status: SchoolMembershipStatus.INVITED },
        }),
        this.prisma.auditEvent.create({
          data: {
            actorAuthId: actor.id,
            actorEmail: actor.email,
            action: "school.admin.invited",
            entityType: "school",
            entityId: schoolId,
            details: { email: membership.email },
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
            action: "school.admin.invite_failed",
            entityType: "school",
            entityId: schoolId,
            details: { email: membership.email },
          },
        }),
      ]);
      throw error;
    }
  }

  private async uniqueSlug(baseSlug: string, attempt: number) {
    if (attempt === 0 && !(await this.prisma.school.findUnique({ where: { slug: baseSlug }, select: { id: true } }))) {
      return baseSlug;
    }

    return `${baseSlug}-${randomBytes(3).toString("hex")}`;
  }

  private createSchoolCode() {
    return `SS-${randomBytes(4).toString("hex").toUpperCase()}`;
  }

  private slugify(value: string) {
    return value
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private toMembershipRole(value: string): SchoolMembershipRole {
    const roles: Record<string, SchoolMembershipRole> = {
      "school-admin": SchoolMembershipRole.SCHOOL_ADMIN,
      teacher: SchoolMembershipRole.TEACHER,
      student: SchoolMembershipRole.STUDENT,
      parent: SchoolMembershipRole.PARENT,
    };
    const role = roles[value];
    if (!role) {
      throw new BadRequestException("The requested school workspace role is not supported.");
    }
    return role;
  }
}
