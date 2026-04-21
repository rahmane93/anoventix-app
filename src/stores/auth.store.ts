import { create } from 'zustand';
import * as authApi from '../api/auth.api';
import { getToken, removeToken, saveToken } from '../api/client';
import * as userApi from '../api/user.api';
import type {
    AuthUser,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SigninRequest,
    SigninResponse,
    SignupRequest,
} from '../types/auth.types';

// ─── State Interface ──────────────────────────────────────────────────────────

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  isLoading: boolean;

  // Actions
  signin: (data: SigninRequest) => Promise<SigninResponse>;
  signup: (data: SignupRequest) => Promise<string>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<string>;
  resetPassword: (data: ResetPasswordRequest) => Promise<string>;
  changePassword: (data: ChangePasswordRequest) => Promise<string>;
  logout: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  mustChangePassword: false,
  isLoading: true, // true au démarrage pour l'hydratation

  /**
   * Connexion : stocke le token et met à jour l'état.
   */
  signin: async (data) => {
    const response = await authApi.signin(data);
    await saveToken(response.token);
    set({
      token: response.token,
      user: {
        id: response.id,
        username: response.username,
        email: response.email,
        roles: response.roles,
      },
      isAuthenticated: true,
      mustChangePassword: response.mustChangePassword ?? false,
    });
    return response;
  },

  /**
   * Inscription : retourne le message de confirmation.
   */
  signup: async (data) => {
    const response = await authApi.signup(data);
    return response.message;
  },

  /**
   * Demande de réinitialisation du mot de passe.
   */
  forgotPassword: async (data) => {
    const response = await authApi.forgotPassword(data);
    return response.message;
  },

  /**
   * Réinitialisation effective du mot de passe.
   */
  resetPassword: async (data) => {
    const response = await authApi.resetPassword(data);
    return response.message;
  },

  /**
   * Changement de mot de passe depuis le profil.
   */
  changePassword: async (data) => {
    const response = await authApi.changePassword(data);
    set({ mustChangePassword: false });
    return response.message;
  },

  /**
   * Déconnexion : supprime le token et réinitialise l'état.
   */
  logout: async () => {
    await removeToken();
    set({ user: null, token: null, isAuthenticated: false, mustChangePassword: false });
  },

  /**
   * Appelé au démarrage de l'app pour restaurer la session depuis AsyncStorage.
   * Si un token existe, l'utilisateur reste connecté (à améliorer avec /me endpoint).
   */
  hydrateFromStorage: async () => {
    try {
      const token = await getToken();
      if (token) {
        set({ token, isAuthenticated: true, mustChangePassword: false });
        // Valide le token auprès du serveur et récupère le profil frais.
        // Si le token est expiré, on déconnecte silencieusement.
        try {
          const profile = await userApi.getProfile();
          set({
            user: {
              id: profile.id,
              username: profile.username,
              email: profile.email,
              roles: profile.roles,
            },
          });
        } catch {
          // Token expiré ou révoqué côté serveur → déconnexion propre
          await removeToken();
          set({ user: null, token: null, isAuthenticated: false, mustChangePassword: false });
        }
      }
    } catch {
      // Token absent ou erreur AsyncStorage
    } finally {
      set({ isLoading: false });
    }
  },
}));
