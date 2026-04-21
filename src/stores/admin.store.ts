import { create } from 'zustand';
import * as adminApi from '../api/admin.api';
import type {
    AdminAnnonce,
    AdminStats,
    AdminUser,
    ChangePieceIdentiteStatutRequest,
    ChangeStatutUserRequest,
    Signalement,
    SignalementsPage
} from '../types/admin.types';
import { getErrorMessage } from '../utils/format';

// ─── State ────────────────────────────────────────────────────────────────────

interface AdminStore {
  // Stats
  stats: AdminStats | null;
  isLoadingStats: boolean;
  statsError: string | null;

  // Signalements
  signalements: Signalement[];
  signalementsPage: number;
  signalementsTotalPages: number;
  signalementsTotalElements: number;
  isLoadingSignalements: boolean;
  signalementsError: string | null;

  // Utilisateurs
  users: AdminUser[];
  currentUser: AdminUser | null;
  isLoadingUsers: boolean;
  isLoadingUser: boolean;
  usersError: string | null;

  // Annonces
  annonces: AdminAnnonce[];
  annoncesPage: number;
  annoncesTotalPages: number;
  annoncesTotalItems: number;
  isLoadingAnnonces: boolean;
  annoncesError: string | null;
  togglingAnnonceIds: Set<number>;

  // Actions
  loadStats: () => Promise<void>;
  loadSignalements: (page?: number) => Promise<void>;
  loadUsers: () => Promise<void>;
  loadUserById: (id: string) => Promise<void>;
  changeUserStatut: (id: string, body: ChangeStatutUserRequest) => Promise<void>;
  changePieceIdentiteStatut: (id: string, body: ChangePieceIdentiteStatutRequest) => Promise<void>;
  loadAnnonces: (page?: number) => Promise<void>;
  toggleAnnonceActif: (id: number) => Promise<void>;
  clearErrors: () => void;
  reset: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAdminStore = create<AdminStore>((set, get) => ({
  stats: null,
  isLoadingStats: false,
  statsError: null,

  signalements: [],
  signalementsPage: 0,
  signalementsTotalPages: 0,
  signalementsTotalElements: 0,
  isLoadingSignalements: false,
  signalementsError: null,

  users: [],
  currentUser: null,
  isLoadingUsers: false,
  isLoadingUser: false,
  usersError: null,

  annonces: [],
  annoncesPage: 0,
  annoncesTotalPages: 0,
  annoncesTotalItems: 0,
  isLoadingAnnonces: false,
  annoncesError: null,
  togglingAnnonceIds: new Set(),

  // ── Stats ──────────────────────────────────────────────────────────────────
  loadStats: async () => {
    set({ isLoadingStats: true, statsError: null });
    try {
      const stats = await adminApi.getAdminStats();
      set({ stats });
    } catch (e: unknown) {
      set({ statsError: getErrorMessage(e, 'Impossible de charger les statistiques.') });
    } finally {
      set({ isLoadingStats: false });
    }
  },

  // ── Signalements ───────────────────────────────────────────────────────────
  loadSignalements: async (page = 0) => {
    set({ isLoadingSignalements: true, signalementsError: null });
    try {
      const res: SignalementsPage = await adminApi.getSignalements(page, 20);
      set({
        signalements: res.content,
        signalementsPage: res.number,
        signalementsTotalPages: res.totalPages,
        signalementsTotalElements: res.totalElements,
      });
    } catch (e: unknown) {
      set({ signalementsError: getErrorMessage(e, 'Impossible de charger les signalements.') });
    } finally {
      set({ isLoadingSignalements: false });
    }
  },

  // ── Utilisateurs ───────────────────────────────────────────────────────────
  loadUsers: async () => {
    set({ isLoadingUsers: true, usersError: null });
    try {
      const users = await adminApi.getAllUsers();
      set({ users });
    } catch (e: unknown) {
      set({ usersError: getErrorMessage(e, 'Impossible de charger les utilisateurs.') });
    } finally {
      set({ isLoadingUsers: false });
    }
  },

  loadUserById: async (id) => {
    set({ isLoadingUser: true, usersError: null, currentUser: null });
    try {
      const user = await adminApi.getUserById(id);
      set({ currentUser: user });
    } catch (e: unknown) {
      set({ usersError: getErrorMessage(e, 'Impossible de charger cet utilisateur.') });
    } finally {
      set({ isLoadingUser: false });
    }
  },

  changeUserStatut: async (id, body) => {
    const updated = await adminApi.changeUserStatut(id, body);
    set((s) => ({
      currentUser: s.currentUser?.id === id ? updated : s.currentUser,
      users: s.users.map((u) => (u.id === id ? updated : u)),
    }));
  },

  changePieceIdentiteStatut: async (id, body) => {
    const updated = await adminApi.changePieceIdentiteStatut(id, body);
    set((s) => ({
      currentUser: s.currentUser?.id === id ? updated : s.currentUser,
      users: s.users.map((u) => (u.id === id ? updated : u)),
    }));
  },

  // ── Annonces ───────────────────────────────────────────────────────────────
  loadAnnonces: async (page = 0) => {
    set({ isLoadingAnnonces: true, annoncesError: null });
    try {
      const res = await adminApi.getAdminAnnonces(page, 10);
      set({
        annonces: res.data,
        annoncesPage: res.currentPage,
        annoncesTotalPages: res.totalPages,
        annoncesTotalItems: res.totalItems,
      });
    } catch (e: unknown) {
      set({ annoncesError: getErrorMessage(e, 'Impossible de charger les annonces.') });
    } finally {
      set({ isLoadingAnnonces: false });
    }
  },

  toggleAnnonceActif: async (id) => {
    const ids = new Set(get().togglingAnnonceIds);
    ids.add(id);
    set({ togglingAnnonceIds: ids });
    try {
      await adminApi.toggleAnnonceActif(id);
      set((s) => ({
        annonces: s.annonces.map((a) =>
          a.id === id ? { ...a, actif: !a.actif } : a,
        ),
      }));
    } finally {
      const next = new Set(get().togglingAnnonceIds);
      next.delete(id);
      set({ togglingAnnonceIds: next });
    }
  },

  clearErrors: () =>
    set({ statsError: null, signalementsError: null, usersError: null, annoncesError: null }),

  reset: () =>
    set({
      stats: null,
      signalements: [],
      users: [],
      currentUser: null,
      annonces: [],
      togglingAnnonceIds: new Set(),
    }),
}));
