// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'particulier' | 'professionnel';

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  roles: UserRole[];
}

export interface SigninRequest {
  usernameOrEmail: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

// ─── Response Payloads ────────────────────────────────────────────────────────

export interface SigninResponse {
  token: string;
  type: string;
  id: string;
  username: string;
  email: string;
  roles: string[];
  mustChangePassword?: boolean;
}

export interface MessageResponse {
  message: string;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string>;
}

// ─── Auth State ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
