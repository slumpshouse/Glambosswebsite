export type AdminRole = "admin";

export type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
};

export type AdminSession = {
  user: AdminUser;
  expires: string;
};

export type AuditLogEntry = {
  timestamp: string;
  action: string;
  userId: string;
  details: Record<string, unknown>;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginFormState = {
  error: string | null;
};
