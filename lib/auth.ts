export type UserRole = "user" | "admin";

export type SessionUser = {
  username: string;
  name: string;
  role: UserRole;
};

export const SESSION_COOKIE_NAME = "dpr_session";

export const AUTH_CREDENTIALS: Record<
  UserRole,
  {
    username: string;
    pin: string;
    name: string;
  }
> = {
  user: {
    username: "siteengineer",
    pin: "site123",
    name: "Site Engineer",
  },
  admin: {
    username: "projectmanager",
    pin: "admin123",
    name: "Project Manager",
  },
};

export function isUserRole(value: string): value is UserRole {
  return value === "user" || value === "admin";
}

export function createSessionValue(user: SessionUser) {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

export function parseSessionValue(rawValue: string | undefined | null): SessionUser | null {
  if (!rawValue) {
    return null;
  }

  try {
    const decoded = Buffer.from(rawValue, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<SessionUser>;
    const role = parsed.role;

    if (!parsed.username || !parsed.name || !role || !isUserRole(role)) {
      return null;
    }

    return {
      username: parsed.username,
      name: parsed.name,
      role,
    };
  } catch {
    return null;
  }
}

export function getSessionFromCookie(
  cookieStore: {
    get?: (name: string) => { value?: string } | undefined;
  } | null,
) {
  if (!cookieStore || typeof cookieStore.get !== "function") {
    return null;
  }

  const rawValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return parseSessionValue(rawValue);
}

export function hasAccess(user: SessionUser | null, requiredRole: UserRole | "both") {
  if (!user) return false;
  if (requiredRole === "both") return true;
  return user.role === requiredRole;
}
