import type {
    ChangePasswordRequest,
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    SigninRequest,
    SigninResponse,
    SignupRequest,
} from '../types/auth.types';
import { apiClient } from './client';

// ─── Auth API ─────────────────────────────────────────────────────────────────

/**
 * Inscription d'un nouvel utilisateur (particulier ou professionnel).
 * Envoie un email d'activation après inscription.
 */
export const signup = async (data: SignupRequest): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/api/auth/signup', data);
  return response.data;
};

/**
 * Connexion utilisateur. Retourne un token JWT et les infos utilisateur.
 */
export const signin = async (data: SigninRequest): Promise<SigninResponse> => {
  const response = await apiClient.post<SigninResponse>('/api/auth/signin', {
    usernameOrEmail: data.usernameOrEmail,
    password: data.password,
  });
  return response.data;
};

/**
 * Envoi d'un email de réinitialisation de mot de passe.
 */
export const forgotPassword = async (
  data: ForgotPasswordRequest,
): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/api/auth/forgot-password', data);
  return response.data;
};

/**
 * Réinitialisation du mot de passe avec le token reçu par email.
 * Corps JSON : { email, token, newPassword }
 */
export const resetPassword = async (
  data: ResetPasswordRequest,
): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/api/auth/reset-password', data);
  return response.data;
};

/**
 * Changement de mot de passe depuis le profil (utilisateur connecté).
 * Corps JSON : { oldPassword, newPassword }
 */
export const changePassword = async (
  data: ChangePasswordRequest,
): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/api/auth/change-password', data);
  return response.data;
};
