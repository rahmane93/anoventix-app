import { create } from 'zustand';
import * as favorisApi from '../api/favoris.api';
import type { BienImmo } from '../types/annonce.types';
import { getErrorMessage } from '../utils/format';

// ─── Interface ────────────────────────────────────────────────────────────────

interface FavorisStore {
  favoris: BienImmo[];
  /** IDs des annonces favorites — synchronisé depuis l'API */
  favorisIds: number[];
  isLoading: boolean;
  /** Set des IDs dont le toggle est en cours — permet un loading par carte, pas global */
  togglingIds: Set<number>;
  error: string | null;

  /** Charge la liste paginée des favoris (page 0) */
  loadFavoris: () => Promise<void>;
  /** Ajoute une annonce aux favoris */
  addFavori: (annonceId: number) => Promise<void>;
  /** Retire une annonce des favoris */
  removeFavori: (annonceId: number) => Promise<void>;
  /** Toggle : ajoute si absent, retire si présent */
  toggleFavori: (annonceId: number) => Promise<void>;
  /** Vérifie si une annonce est en favori */
  isFavori: (annonceId: number) => boolean;
  clearError: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addToggling(s: FavorisStore, id: number): Set<number> {
  const next = new Set(s.togglingIds);
  next.add(id);
  return next;
}

function removeToggling(s: FavorisStore, id: number): Set<number> {
  const next = new Set(s.togglingIds);
  next.delete(id);
  return next;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFavorisStore = create<FavorisStore>((set, get) => ({
  favoris: [],
  favorisIds: [],
  isLoading: false,
  togglingIds: new Set(),
  error: null,

  loadFavoris: async () => {
    set({ isLoading: true, error: null });
    try {
      const page = await favorisApi.getFavoris(0, 50);
      const ids = page.data.map((b) => b.id);
      set({ favoris: page.data, favorisIds: ids, isLoading: false });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Impossible de charger vos favoris.'), isLoading: false });
    }
  },

  addFavori: async (annonceId) => {
    set((s) => ({ togglingIds: addToggling(s, annonceId), error: null }));
    try {
      const ids = await favorisApi.addFavori(annonceId);
      set((s) => ({ favorisIds: ids, togglingIds: removeToggling(s, annonceId) }));
    } catch (err: unknown) {
      set((s) => ({ error: getErrorMessage(err, "Erreur lors de l'ajout aux favoris."), togglingIds: removeToggling(s, annonceId) }));
    }
  },

  removeFavori: async (annonceId) => {
    set((s) => ({ togglingIds: addToggling(s, annonceId), error: null }));
    try {
      const ids = await favorisApi.removeFavori(annonceId);
      set((s) => ({
        favorisIds: ids,
        favoris: s.favoris.filter((b) => b.id !== annonceId),
        togglingIds: removeToggling(s, annonceId),
      }));
    } catch (err: unknown) {
      set((s) => ({ error: getErrorMessage(err, 'Erreur lors de la suppression.'), togglingIds: removeToggling(s, annonceId) }));
    }
  },

  toggleFavori: async (annonceId) => {
    // Éviter les doubles appels en cas de tapotements rapides.
    if (get().togglingIds.has(annonceId)) return;

    const currentIds = get().favorisIds;
    const isCurrentFav = currentIds.includes(annonceId);

    // Optimistic update + verrouillage de la carte concernée uniquement
    if (isCurrentFav) {
      set((s) => ({
        togglingIds: addToggling(s, annonceId),
        error: null,
        favorisIds: s.favorisIds.filter((id) => id !== annonceId),
        favoris: s.favoris.filter((b) => b.id !== annonceId),
      }));
    } else {
      set((s) => ({
        togglingIds: addToggling(s, annonceId),
        error: null,
        favorisIds: [...s.favorisIds, annonceId],
      }));
    }

    try {
      if (isCurrentFav) {
        const ids = await favorisApi.removeFavori(annonceId);
        set((s) => ({
          favorisIds: ids,
          favoris: s.favoris.filter((b) => b.id !== annonceId),
          togglingIds: removeToggling(s, annonceId),
        }));
      } else {
        const ids = await favorisApi.addFavori(annonceId);
        set((s) => ({ favorisIds: ids, togglingIds: removeToggling(s, annonceId) }));
      }
    } catch (err: unknown) {
      // Annuler l'optimistic update en cas d'erreur
      set((s) => ({
        favorisIds: currentIds,
        error: getErrorMessage(err, 'Erreur lors de la mise à jour des favoris.'),
        togglingIds: removeToggling(s, annonceId),
      }));
    }
  },

  isFavori: (annonceId) => get().favorisIds.includes(annonceId),

  clearError: () => set({ error: null }),
}));
