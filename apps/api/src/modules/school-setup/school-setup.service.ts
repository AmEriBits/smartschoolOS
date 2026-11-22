import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AcademicYearStatus,
  Prisma,
} from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/authenticated-user";
import { PrismaService } from "../../database/prisma.service";
import { authorizeSchoolAdmin } from "../schools/authorize-school-admin";
import type {
  CreateAcademicYearDto,
  CreateCampusDto,
  CreateClassArmDto,
  CreateGradeDto,
  CreateSubjectDto,
  CreateSubjectOfferingDto,
  CreateTermDto,
} from "./school-setup.dto";

@Injectable()
export class SchoolSetupService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetup(schoolSlug: string, user: AuthenticatedUser) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, user);
    const [campuses, academicYears, grades, classArms, subjects, subjectOfferings] = await Promise.all([
      this.prisma.campus.findMany({ where: { schoolId: school.id }, orderBy: [{ isMainSite: "desc" }, { name: "asc" }] }),
      this.prisma.academicYear.findMany({
        where: { schoolId: school.id },
        orderBy: { startsOn: "desc" },
        include: { terms: { orderBy: { order: "asc" } } },
      }),
      this.prisma.grade.findMany({ where: { schoolId: school.id }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] }),
      this.prisma.classArm.findMany({
        where: { schoolId: school.id },
        orderBy: [{ academicYear: { startsOn: "desc" } }, { grade: { displayOrder: "asc" } }, { name: "asc" }],
        include: { campus: { select: { id: true, name: true } }, academicYear: { select: { id: true, name: true } }, grade: { select: { id: true, name: true } } },
      }),
      this.prisma.subject.findMany({ where: { schoolId: school.id }, orderBy: { name: "asc" } }),
      this.prisma.subjectOffering.findMany({
        where: { schoolId: school.id },
        orderBy: [{ subject: { name: "asc" } }, { classArm: { name: "asc" } }],
        include: { subject: { select: { id: true, name: true, code: true } }, classArm: { select: { id: true, name: true, grade: { select: { name: true } } } }, term: { select: { id: true, name: true, academicYear: { select: { name: true } } } } },
      }),
    ]);

    return { school: { id: school.id, name: school.name, slug: school.slug, status: school.status }, campuses, academicYears, grades, classArms, subjects, subjectOfferings };
  }

  async createCampus(schoolSlug: string, user: AuthenticatedUser, input: CreateCampusDto) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, user);
    const name = this.requiredName(input.name, "Campus name");
    return this.createWithAudit(user, school.id, "school.campus.created", "campus", { name, isMainSite: input.isMainSite ?? false }, (tx) =>
      tx.campus.create({
        data: { schoolId: school.id, name, code: this.cleanOptional(input.code), address: this.cleanOptional(input.address), isMainSite: input.isMainSite ?? false },
      }),
    );
  }

  async createAcademicYear(schoolSlug: string, user: AuthenticatedUser, input: CreateAcademicYearDto) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, user);
    const startsOn = this.date(input.startsOn);
    const endsOn = this.date(input.endsOn);
    this.assertDateRange(startsOn, endsOn);
    const name = this.requiredName(input.name, "Academic year name");
    return this.createWithAudit(user, school.id, "school.academic_year.created", "academic_year", { name }, (tx) =>
      tx.academicYear.create({ data: { schoolId: school.id, name, startsOn, endsOn, status: AcademicYearStatus.PLANNED } }),
    );
  }

  async createTerm(schoolSlug: string, yearId: string, user: AuthenticatedUser, input: CreateTermDto) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, user);
    const year = await this.prisma.academicYear.findFirst({ where: { id: yearId, schoolId: school.id } });
    if (!year) throw new NotFoundException("Academic year not found.");
    const startsOn = this.date(input.startsOn);
    const endsOn = this.date(input.endsOn);
    this.assertDateRange(startsOn, endsOn);
    if (startsOn < year.startsOn || endsOn > year.endsOn) {
      throw new ConflictException("Term dates must fit within the academic year dates.");
    }
    const name = this.requiredName(input.name, "Term name");
    return this.createWithAudit(user, school.id, "school.term.created", "term", { yearId, name }, (tx) =>
      tx.term.create({ data: { academicYearId: year.id, name, startsOn, endsOn, order: input.order } }),
    );
  }

  async createGrade(schoolSlug: string, user: AuthenticatedUser, input: CreateGradeDto) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, user);
    const name = this.requiredName(input.name, "Grade name");
    return this.createWithAudit(user, school.id, "school.grade.created", "grade", { name }, (tx) =>
      tx.grade.create({ data: { schoolId: school.id, name, displayOrder: input.displayOrder ?? 0 } }),
    );
  }

  async createClassArm(schoolSlug: string, user: AuthenticatedUser, input: CreateClassArmDto) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, user);
    const [campus, year, grade] = await Promise.all([
      this.prisma.campus.findFirst({ where: { id: input.campusId, schoolId: school.id }, select: { id: true } }),
      this.prisma.academicYear.findFirst({ where: { id: input.academicYearId, schoolId: school.id }, select: { id: true } }),
      this.prisma.grade.findFirst({ where: { id: input.gradeId, schoolId: school.id }, select: { id: true } }),
    ]);
    if (!campus || !year || !grade) throw new NotFoundException("Choose a campus, academic year, and grade belonging to this school.");
    const name = this.requiredName(input.name, "Class arm name");
    return this.createWithAudit(user, school.id, "school.class_arm.created", "class_arm", { name, campusId: campus.id, academicYearId: year.id, gradeId: grade.id }, (tx) =>
      tx.classArm.create({ data: { schoolId: school.id, campusId: campus.id, academicYearId: year.id, gradeId: grade.id, name } }),
    );
  }

  async createSubject(schoolSlug: string, user: AuthenticatedUser, input: CreateSubjectDto) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, user);
    const name = this.requiredName(input.name, "Subject name");
    return this.createWithAudit(user, school.id, "school.subject.created", "subject", { name }, (tx) =>
      tx.subject.create({ data: { schoolId: school.id, name, code: this.cleanOptional(input.code) } }),
    );
  }

  async createSubjectOffering(schoolSlug: string, user: AuthenticatedUser, input: CreateSubjectOfferingDto) {
    const school = await authorizeSchoolAdmin(this.prisma, schoolSlug, user);
    const [classArm, subject, term] = await Promise.all([
      this.prisma.classArm.findFirst({ where: { id: input.classArmId, schoolId: school.id }, select: { id: true, academicYearId: true } }),
      this.prisma.subject.findFirst({ where: { id: input.subjectId, schoolId: school.id }, select: { id: true } }),
      this.prisma.term.findFirst({ where: { id: input.termId, academicYear: { schoolId: school.id } }, select: { id: true, academicYearId: true } }),
    ]);
    if (!classArm || !subject || !term) throw new NotFoundException("Choose a class, subject, and term belonging to this school.");
    if (classArm.academicYearId !== term.academicYearId) {
      throw new ConflictException("The selected term must belong to the class arm's academic year.");
    }
    return this.createWithAudit(user, school.id, "school.subject_offering.created", "subject_offering", { classArmId: classArm.id, subjectId: subject.id, termId: term.id }, (tx) =>
      tx.subjectOffering.create({ data: { schoolId: school.id, classArmId: classArm.id, subjectId: subject.id, termId: term.id } }),
    );
  }

  private async createWithAudit<T>(
    user: AuthenticatedUser,
    schoolId: string,
    action: string,
    entityType: string,
    details: Prisma.InputJsonObject,
    create: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const entity = await create(tx);
        const entityId = (entity as { id: string }).id;
        await this.audit(tx, user, schoolId, action, entityType, entityId, details);
        return entity;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("A record with that name or code already exists in this school.");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictException("One of the selected school records is no longer available.");
      }
      throw error;
    }
  }

  private audit(tx: Prisma.TransactionClient, user: AuthenticatedUser, schoolId: string, action: string, entityType: string, entityId: string, details: Prisma.InputJsonObject) {
    return tx.auditEvent.create({
      data: { actorAuthId: user.id, actorEmail: user.email, action, entityType, entityId, details: { schoolId, ...details } },
    });
  }

  private cleanOptional(value?: string) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }

  private requiredName(value: string, field: string) {
    const name = value.trim();
    if (!name) throw new BadRequestException(`${field} is required.`);
    return name;
  }

  private date(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new ConflictException("Enter a valid date.");
    return parsed;
  }

  private assertDateRange(startsOn: Date, endsOn: Date) {
    if (startsOn >= endsOn) throw new ConflictException("The end date must be after the start date.");
  }
}
