import { Module } from "@nestjs/common";
import { PlatformOperatorGuard } from "./platform-operator.guard";
import { SupabaseAuthGuard } from "./supabase-auth.guard";
import { SupabaseAuthService } from "./supabase-auth.service";

@Module({
  providers: [PlatformOperatorGuard, SupabaseAuthGuard, SupabaseAuthService],
  exports: [PlatformOperatorGuard, SupabaseAuthGuard, SupabaseAuthService],
})
export class AuthModule {}
