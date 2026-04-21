import type { BienImmo, PageResponse } from '../types/annonce.types';
import { buildMediaUrl } from './annonce.api';
import { API_BASE_URL, getToken } from './client';

// ─── Helper ───────────────────────────────────────────────────────────────────

async function authFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { message: text }; }

  if (!res.ok) {
    throw { message: json?.message ?? `Erreur ${res.status}`, status: res.status };
  }

  return json;
}

function normalizeItem(item: BienImmo): BienImmo {
  return {
    ...item,
    medias: (item.medias ?? []).map((m) => ({ ...m, url: buildMediaUrl(m.url) })),
  };
}

// ─── Favoris API ──────────────────────────────────────────────────────────────

/**
 * Ajoute une annonce aux favoris.
 * POST /api/users/me/favoris/{annonceId}
 * Retourne le UserDTO avec favorisIds mis à jour.
 */
export const addFavori = async (annonceId: number): Promise<number[]> => {
  const json = await authFetch(`/api/users/me/favoris/${annonceId}`, { method: 'POST' });
  return (json?.favorisIds ?? []) as number[];
};

/**
 * Retire une annonce des favoris.
 * DELETE /api/users/me/favoris/{annonceId}
 */
export const removeFavori = async (annonceId: number): Promise<number[]> => {
  const json = await authFetch(`/api/users/me/favoris/${annonceId}`, { method: 'DELETE' });
  return (json?.favorisIds ?? []) as number[];
};

/**
 * Récupère la liste paginée des favoris de l'utilisateur.
 * GET /api/users/me/favoris?page=0&size=10
 */
export const getFavoris = async (page = 0, size = 20): Promise<PageResponse<BienImmo>> => {
  const json = await authFetch(`/api/users/me/favoris?page=${page}&size=${size}`);
  const data: BienImmo[] = (json.data ?? []).map(normalizeItem);
  return { ...json, data } as PageResponse<BienImmo>;
};
