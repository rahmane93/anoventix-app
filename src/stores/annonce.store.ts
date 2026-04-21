import { create } from 'zustand';
import * as annonceApi from '../api/annonce.api';
import * as localisationApi from '../api/localisation.api';
import type { BienImmo, CreateBienImmoRequest, Localisation, UpdateBienImmoRequest } from '../types/annonce.types';
import { getErrorMessage } from '../utils/format';

// Régions de Guinée — liste fixe (pas d'endpoint GET /api/localisations)
export const REGIONS_GUINEE = [
  'Conakry',
  'Boké',
  'Kindia',
  'Mamou',
  'Labé',
  'Faranah',
  'Kankan',
  "N'Zérékoré",
];

// ─── Interface ────────────────────────────────────────────────────────────────

interface AnnonceStore {
  isLoadingLoc: boolean;
  isCreating: boolean;
  isLoading: boolean;
  isSearching: boolean;
  mesAnnonces: BienImmo[];
  searchResults: BienImmo[];
  searchQuery: string;
  currentAnnonce: BienImmo | null;
  error: string | null;

  loadLocalisationsByRegion: (region: string) => Promise<Localisation[]>;
  createAnnonce: (req: CreateBienImmoRequest) => Promise<BienImmo>;
  updateAnnonce: (id: number, req: UpdateBienImmoRequest) => Promise<BienImmo>;
  loadMesAnnonces: () => Promise<void>;
  searchAnnonces: (q: string) => Promise<void>;
  clearSearch: () => void;
  loadAnnonceById: (id: number) => Promise<void>;
  clearCurrentAnnonce: () => void;
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAnnonceStore = create<AnnonceStore>((set) => ({
  isLoadingLoc: false,
  isCreating: false,
  isLoading: false,
  isSearching: false,
  mesAnnonces: [],
  searchResults: [],
  searchQuery: '',
  currentAnnonce: null,
  error: null,

  /**
   * Charge les localisations d'une région spécifique.
   * Retourne la liste pour que le composant puisse filtrer préfectures / communes / quartiers.
   */
  loadLocalisationsByRegion: async (region) => {
    set({ isLoadingLoc: true, error: null });
    try {
      const list = await localisationApi.getLocalisationsByRegion(region);
      const safeList = Array.isArray(list) ? list : [];
      set({ isLoadingLoc: false });
      return safeList;
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Impossible de charger les localisations.'), isLoadingLoc: false });
      return [];
    }
  },

  /**
   * Crée une annonce immobilière et la retourne.
   */
  createAnnonce: async (req) => {
    set({ isCreating: true, error: null });
    try {
      const annonce = await annonceApi.createBienImmo(req);
      set({ isCreating: false });
      return annonce;
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, "Impossible de créer l'annonce."), isCreating: false });
      throw err;
    }
  },

  /**
   * Met à jour une annonce immobilière.
   */
  updateAnnonce: async (id, req) => {
    set({ isCreating: true, error: null });
    try {
      const annonce = await annonceApi.updateBienImmo(id, req);
      set({ isCreating: false });
      return annonce;
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, "Impossible de modifier l'annonce."), isCreating: false });
      throw err;
    }
  },

  /**
   * Charge les annonces de l'utilisateur connecté.
   */
  loadMesAnnonces: async () => {
    set({ isLoading: true, error: null });
    try {
      const page = await annonceApi.getMesAnnonces(0, 50);
      set({ mesAnnonces: page.data, isLoading: false });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Impossible de charger vos annonces.'), isLoading: false });
    }
  },

  /**
   * Recherche publique d'annonces par mot-clé.
   */
  searchAnnonces: async (q) => {
    if (!q.trim()) {
      set({ searchResults: [], searchQuery: '' });
      return;
    }
    set({ isSearching: true, searchQuery: q.trim(), error: null });
    try {
      const page = await annonceApi.searchAnnonces(q, 0, 50);
      set({ searchResults: page.data, isSearching: false });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, "Impossible d'effectuer la recherche."), isSearching: false });
    }
  },

  clearSearch: () => set({ searchResults: [], searchQuery: '' }),

  /**
   * Charge le détail d'une annonce par son ID.
   */
  loadAnnonceById: async (id) => {
    set({ isLoading: true, error: null, currentAnnonce: null });
    try {
      const annonce = await annonceApi.getAnnonceById(id);
      set({ currentAnnonce: annonce, isLoading: false });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, "Impossible de charger l'annonce."), isLoading: false });
    }
  },

  clearCurrentAnnonce: () => set({ currentAnnonce: null }),

  clearError: () => set({ error: null }),
}));
