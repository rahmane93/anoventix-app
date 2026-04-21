import type { Localisation } from '../types/annonce.types';
import { apiClient } from './client';

// ─── Cache (mémoire) ─────────────────────────────────────────────────────────

const localisationByIdCache = new Map<string, Localisation>();

// ─── Localisation API ──────────────────────────────────────────────────────────

/**
 * Récupère toutes les localisations d'une région.
 * Permet d'en déduire les préfectures, communes et quartiers uniques.
 */
export const getLocalisationsByRegion = async (region: string): Promise<Localisation[]> => {
  const res = await apiClient.get<Localisation[]>(`/api/localisations/region/${encodeURIComponent(region)}`);
  const payload: any = res.data as any;
  if (Array.isArray(payload)) return payload as Localisation[];
  if (payload && Array.isArray(payload.data)) return payload.data as Localisation[];
  return [];
};

/**
 * Récupère toutes les localisations d'une préfecture.
 */
export const getLocalisationsByPrefecture = async (prefecture: string): Promise<Localisation[]> => {
  const res = await apiClient.get<Localisation[]>(`/api/localisations/prefecture/${encodeURIComponent(prefecture)}`);
  const payload: any = res.data as any;
  if (Array.isArray(payload)) return payload as Localisation[];
  if (payload && Array.isArray(payload.data)) return payload.data as Localisation[];
  return [];
};

/**
 * Récupère toutes les localisations d'une commune.
 */
export const getLocalisationsByCommune = async (commune: string): Promise<Localisation[]> => {
  const res = await apiClient.get<Localisation[]>(`/api/localisations/commune/${encodeURIComponent(commune)}`);
  const payload: any = res.data as any;
  if (Array.isArray(payload)) return payload as Localisation[];
  if (payload && Array.isArray(payload.data)) return payload.data as Localisation[];
  return [];
};

// ─── Helpers dédupliqués ──────────────────────────────────────────────────────

export const unique = <T>(arr: T[]): T[] => [...new Set(arr)];

/**
 * Récupère une localisation par son ID.
 * Endpoint : GET /api/localisations/{id}
 */
export const getLocalisationById = async (localisationId: string): Promise<Localisation> => {
  const id = String(localisationId);
  const cached = localisationByIdCache.get(id);
  if (cached) return cached;

  const res = await apiClient.get<Localisation>(`/api/localisations/${encodeURIComponent(id)}`);
  const payload: any = res.data as any;
  const loc: Localisation = (payload?.data ?? payload) as Localisation;
  localisationByIdCache.set(String(loc.id), loc);
  return loc;
};
