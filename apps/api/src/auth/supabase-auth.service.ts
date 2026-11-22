import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type User } from "@supabase/supabase-js";
import type { AuthenticatedUser } from "./authenticated-user";

@Injectable()
export class SupabaseAuthService {
  constructor(private readonly config: ConfigService) {}

  async verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    const client = createClient(this.requiredConfig("SUPABASE_URL"), this.requiredPublishableKey(), {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });
    const { data, error } = await client.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException("The Supabase access token is invalid or expired.");
    }

    return this.toAuthenticatedUser(data.user);
  }

  async inviteUserByEmail(email: string, redirectTo: string): Promise<User> {
    const client = createClient(
      this.requiredConfig("SUPABASE_URL"),
      this.requiredConfig("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } },
    );
    const { data, error } = await client.auth.admin.inviteUserByEmail(email, { redirectTo });

    if (error || !data.user) {
      throw new ServiceUnavailableException(
        `Supabase could not invite the school administrator${error?.message ? `: ${error.message}` : "."}`,
      );
    }

    return data.user;
  }

  private requiredConfig(key: string): string {
    const value = this.config.get<string>(key)?.trim();
    if (!value) {
      throw new ServiceUnavailableException(`${key} must be configured before this operation is available.`);
    }

    return value;
  }

  private requiredPublishableKey(): string {
    const value =
      this.config.get<string>("SUPABASE_PUBLISHABLE_KEY")?.trim() ||
      this.config.get<string>("SUPABASE_ANON_KEY")?.trim();
    if (!value) {
      throw new ServiceUnavailableException(
        "SUPABASE_PUBLISHABLE_KEY must be configured before authentication is available.",
      );
    }

    return value;
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email ?? null,
      emailConfirmedAt: user.email_confirmed_at ?? null,
    };
  }
}
