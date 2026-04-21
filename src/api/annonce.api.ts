import type { AnnonceFilterParams, BienImmo, CreateBienImmoRequest, PageResponse, UpdateBienImmoRequest } from '../types/annonce.types';
import { API_BASE_URL, apiClient, getToken } from './client';

// ─── Helper URL médias ────────────────────────────────────────────────────────

/**
 * Les URLs des médias sont relatives (/uploads/...).
 * Cette fonction préfixe avec API_BASE_URL si nécessaire.
 */
export function buildMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Normalise les URLs de tous les medias d'une annonce. */
function normalizeMediaUrls(item: BienImmo): BienImmo {
  return {
    ...item,
    medias: (item.medias ?? []).map((m) => ({ ...m, url: buildMediaUrl(m.url) })),
  };
}

// ─── Annonce API ──────────────────────────────────────────────────────────────

// ─── Helper multipart (création avec images) ──────────────────────────────────

async function multipartPost<T>(path: string, formData: FormData): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      // Ne pas définir Content-Type: fetch ajoute boundary automatiquement
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = { message: text };
  }

  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `Erreur ${res.status}`;
    throw { message: msg, status: res.status, errors: json?.errors ?? null };
  }

  return json as T;
}

async function multipartPut<T>(path: string, formData: FormData): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      // Ne pas définir Content-Type: fetch ajoute boundary automatiquement
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = { message: text };
  }

  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `Erreur ${res.status}`;
    throw { message: msg, status: res.status, errors: json?.errors ?? null };
  }

  return json as T;
}

/**
 * Crée une nouvelle annonce immobilière avec images (multipart).
 */
export const createBienImmo = async (req: CreateBienImmoRequest): Promise<BienImmo> => {
  const formData = new FormData();

  formData.append('titre', req.titre);
  formData.append('description', req.description);
  formData.append('prix', String(req.prix));
  formData.append('typeAnnonce', req.typeAnnonce);
  formData.append('typeBien', req.typeBien);
  formData.append('localisationId', req.localisationId);

  if (req.typeUsage) formData.append('typeUsage', req.typeUsage);
  if (req.documentsDisponibles) formData.append('documentsDisponibles', req.documentsDisponibles);
  if (req.fraisHonoraire != null) formData.append('fraisHonoraire', String(req.fraisHonoraire));
  if (req.surfaceTotal != null) formData.append('surfaceTotal', String(req.surfaceTotal));
  if (req.complementAdresse) formData.append('complementAdresse', req.complementAdresse);

  req.medias.forEach((file) => {
    formData.append('medias', { uri: file.uri, name: file.name, type: file.type } as any);
  });

  const created = await multipartPost<BienImmo>('/api/biens-immo', formData);
  return normalizeMediaUrls(created);
};

/**
 * Met à jour une annonce immobilière (hors images).
 * Les images sont gérées séparément (pas de multipart ici).
 */
export const updateBienImmo = async (id: number, req: UpdateBienImmoRequest): Promise<BienImmo> => {
  try {
    const { medias: _ignored, ...payload } = req;
    const res = await apiClient.put<BienImmo>(`/api/biens-immo/${id}`, payload);
    return normalizeMediaUrls(res.data);
  } catch (err: any) {
    throw {
      message: err?.message ?? "Impossible de modifier l'annonce.",
      status: err?.status,
      errors: err?.errors ?? err?.raw?.errors ?? null,
    };
  }
};

/**
 * Ajoute une ou plusieurs images à une annonce existante (multipart).
 * Endpoint : PUT /api/biens-immo/{id}/medias (champ fichiers: medias)
 */
export const addBienImmoMedias = async (
  id: number,
  medias: { uri: string; name: string; type: string }[],
): Promise<void> => {
  try {
    const formData = new FormData();
    medias.forEach((file) => {
      formData.append('medias', { uri: file.uri, name: file.name, type: file.type } as any);
    });
    await multipartPut<unknown>(`/api/biens-immo/${id}/medias`, formData);
  } catch (err: any) {
    throw {
      message: err?.message ?? "Impossible d'ajouter les images.",
      status: err?.status,
      errors: err?.errors ?? err?.raw?.errors ?? null,
    };
  }
};

/**
 * Supprime un média par son ID.
 * Endpoint : DELETE /api/biens-immo/{id}/medias/{mediaId}
 */
export const deleteBienImmoMedia = async (id: number, mediaId: number): Promise<void> => {
  try {
    await apiClient.delete(`/api/biens-immo/${id}/medias/${mediaId}`);
  } catch (err: any) {
    throw {
      message: err?.message ?? 'Impossible de supprimer le média.',
      status: err?.status,
      errors: err?.raw?.errors ?? null,
    };
  }
};

/**
 * Récupère les annonces de l'utilisateur connecté (paginé).
 * Endpoint : GET /api/biens-immo/user?page=0&size=10
 */
export const getMesAnnonces = async (
  page = 0,
  size = 20,
): Promise<PageResponse<BienImmo>> => {
  const token = await getToken();
  const res = await fetch(
    `${API_BASE_URL}/api/biens-immo/user?page=${page}&size=${size}`,
    { headers: { Authorization: `Bearer ${token ?? ''}` } },
  );
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = {}; }
  if (!res.ok) throw { message: json?.message ?? `Erreur ${res.status}` };

  // Normalise les URLs relatives des médias
  const data: BienImmo[] = (json.data ?? []).map(normalizeMediaUrls);
  return { ...json, data } as PageResponse<BienImmo>;
};

/**
 * Recherche publique d'annonces par description/titre.
 * Endpoint : GET /api/biens-immo/public/search?q=...&page=0&size=50
 */
export const searchAnnonces = async (
  q: string,
  page = 0,
  size = 50,
): Promise<PageResponse<BienImmo>> => {
  const res = await fetch(
    `${API_BASE_URL}/api/biens-immo/public/search?q=${encodeURIComponent(q.trim())}&page=${page}&size=${size}`,
  );
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = {}; }
  if (!res.ok) throw { message: json?.message ?? `Erreur ${res.status}` };

  const data: BienImmo[] = (json.data ?? []).map(normalizeMediaUrls);
  return { ...json, data } as PageResponse<BienImmo>;
};

/**
 * Récupère toutes les annonces publiques (paginées).
 * Endpoint : GET /api/biens-immo/filter?page=0&size=20 (sans filtres)
 */
export const getPublicAnnonces = async (
  page = 0,
  size = 20,
): Promise<PageResponse<BienImmo>> => {
  const token = await getToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(
    `${API_BASE_URL}/api/biens-immo/filter?page=${page}&size=${size}`,
    { headers },
  );

  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { message: text }; }
  if (!res.ok) throw { message: json?.message ?? `Erreur ${res.status}`, status: res.status };

  const data: BienImmo[] = (json.data ?? []).map(normalizeMediaUrls);
  return { ...json, data } as PageResponse<BienImmo>;
};

/**
 * Filtre les annonces avec des critères cumulables.
 * Endpoint : GET /api/biens-immo/filter?typeAnnonce=VENTE&quartier=...
 */
export const filterAnnonces = async (
  params: AnnonceFilterParams & { page?: number; size?: number },
): Promise<PageResponse<BienImmo>> => {
  const qs = new URLSearchParams();
  if (params.reference) qs.set('reference', params.reference);
  if (params.typeAnnonce) qs.set('typeAnnonce', params.typeAnnonce);
  if (params.typeBien) qs.set('typeBien', params.typeBien);
  if (params.typeUsage) qs.set('typeUsage', params.typeUsage);
  if (params.prixMin != null) qs.set('prixMin', String(params.prixMin));
  if (params.prixMax != null) qs.set('prixMax', String(params.prixMax));
  if (params.region) qs.set('region', params.region);
  if (params.prefecture) qs.set('prefecture', params.prefecture);
  if (params.commune) qs.set('commune', params.commune);
  if (params.quartier) qs.set('quartier', params.quartier);
  qs.set('page', String(params.page ?? 0));
  qs.set('size', String(params.size ?? 20));
  if (params.sort) qs.set('sort', params.sort);
  if (params.direction) qs.set('direction', params.direction);

  const token = await getToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}/api/biens-immo/filter?${qs.toString()}`, { headers });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = {}; }
  if (!res.ok) throw { message: json?.message ?? `Erreur ${res.status}` };
  const data: BienImmo[] = (json.data ?? []).map(normalizeMediaUrls);
  return { ...json, data } as PageResponse<BienImmo>;
};

/**
 * Récupère une annonce par son ID.
 */
export const getAnnonceById = async (id: number): Promise<BienImmo> => {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/biens-immo/${id}`, {
    headers: { Authorization: `Bearer ${token ?? ''}` },
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = {}; }
  if (!res.ok) throw { message: json?.message ?? `Erreur ${res.status}` };
  return normalizeMediaUrls(json as BienImmo);
};

// ─── Signalements ─────────────────────────────────────────────────────────────

export type MotifSignalement =
  | 'ARNAQUE_FRAUDE'
  | 'INFOS_INCORRECTES'
  | 'DEJA_VENDU_LOUE'
  | 'MAUVAISE_CATEGORIE'
  | 'PROBLEME_LOCALISATION'
  | 'AUTRE';

export const MOTIF_LABELS: Record<MotifSignalement, string> = {
  ARNAQUE_FRAUDE: 'Arnaque / fraude',
  INFOS_INCORRECTES: 'Infos incorrectes',
  DEJA_VENDU_LOUE: 'Déjà vendu / loué',
  MAUVAISE_CATEGORIE: 'Mauvaise catégorie',
  PROBLEME_LOCALISATION: 'Problème de localisation',
  AUTRE: 'Autre',
};

export const signalerAnnonce = async (
  annonceId: number,
  payload: { motif: MotifSignalement; commentaire?: string },
): Promise<void> => {
  const res = await apiClient.post(`/api/biens-immo/${annonceId}/signaler`, payload);
  if (res.status !== 201 && res.status !== 200) {
    throw { message: res.data?.message ?? 'Signalement échoué' };
  }
};

export const retirerSignalement = async (annonceId: number): Promise<void> => {
  await apiClient.delete(`/api/biens-immo/${annonceId}/signaler`);
};
