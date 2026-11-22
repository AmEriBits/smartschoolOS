import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { AuthenticatedRequest } from "./authenticated-request";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class PlatformOperatorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const operator = await this.prisma.platformOperator.findUnique({
      where: { authUserId: request.user.id },
      select: { active: true },
    });

    if (!operator?.active) {
      throw new ForbiddenException("This account is not an authorized SmartSchools platform operator.");
    }

    return true;
  }
}
