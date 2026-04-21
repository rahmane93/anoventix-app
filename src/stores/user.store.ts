import { create } from 'zustand';
import * as userApi from '../api/user.api';
import type { TypePieceIdentite, UpdateProfileRequest, UserProfile } from '../types/user.types';
import { getErrorMessage } from '../utils/format';

// ─── Interface ────────────────────────────────────────────────────────────────

interface UserStore {
  profile: UserProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  uploadingPiece: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  uploadPhoto: (file: { uri: string; name: string; type: string }, photoType: 'profil') => Promise<void>;
  uploadPieceIdentite: (
    file: { uri: string; name: string; type: string },
    typePieceIdentite: TypePieceIdentite,
    numeroPieceIdentite: string,
  ) => Promise<void>;
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,
  isLoading: false,
  isSaving: false,
  uploadingPiece: false,
  error: null,

  /**
   * Charge le profil depuis le serveur.
   */
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await userApi.getProfile();
      set({ profile });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Impossible de charger le profil.') });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Met à jour les champs du profil.
   */
  updateProfile: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const profile = await userApi.updateProfile(data);
      set({ profile });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Impossible de sauvegarder le profil.') });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  /**
   * Upload de la photo de profil.
   */
  uploadPhoto: async (file, photoType) => {
    set({ isSaving: true, error: null });
    try {
      const profile = await userApi.uploadPhoto(file, photoType);
      set({ profile });
    } catch (err: unknown) {
      const error = err as { message?: string };
      set({ error: error?.message ?? 'Impossible d\'uploader la photo.' });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  /**
   * Upload du document d'identité (pièce CNI / Passeport / Permis).
   * Après l'upload, le statut est EN_ATTENTE côté serveur.
   * Le profil est rechargé pour refléter le nouveau champ pieceIdentite.
   */
  uploadPieceIdentite: async (file, typePieceIdentite, numeroPieceIdentite) => {
    set({ uploadingPiece: true, error: null });
    try {
      await userApi.uploadPieceIdentite(file, typePieceIdentite, numeroPieceIdentite);
      // Recharge le profil complet pour afficher le statut exact retourné par le serveur
      const profile = await userApi.getProfile();
      set({ profile });
    } catch (err: unknown) {
      const error = err as { message?: string };
      set({ error: error?.message ?? 'Impossible d\'uploader la pièce.' });
      throw err;
    } finally {
      set({ uploadingPiece: false });
    }
  },

  clearError: () => set({ error: null }),
}));
