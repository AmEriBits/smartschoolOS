import type { AuthenticatedUser } from "./authenticated-user";

export type AuthenticatedRequest = {
  headers: { authorization?: string };
  user: AuthenticatedUser;
};
