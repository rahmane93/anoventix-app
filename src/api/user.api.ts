import type {
  PieceIdentite,
  StatutPieceIdentite,
  TypePieceIdentite,
  UpdateProfileRequest,
  UserProfile,
} from '../types/user.types';
import { API_BASE_URL, apiClient, getToken } from './client';

// ─── User API ─────────────────────────────────────────────────────────────────

/**
 * Récupère le profil de l'utilisateur connecté.
 */
export const getProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>('/api/users/me');
  return response.data;
};

/**
 * Met à jour les informations du profil.
 */
export const updateProfile = async (
  data: UpdateProfileRequest,
): Promise<UserProfile> => {
  const response = await apiClient.put<UserProfile>('/api/users/me', data);
  return response.data;
};

// ─── Helper : fetch multipart (contourne les limitations Axios / RN) ──────────

/**
 * Requête multipart/form-data via fetch natif (POST ou PUT).
 * Axios + React Native ne gère pas correctement le boundary multipart,
 * fetch natif le fait de manière fiable.
 */
async function multipartFetch<T>(
  method: 'POST' | 'PUT',
  path: string,
  formData: FormData,
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      // NE PAS mettre Content-Type : fetch le génère avec le boundary correct
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { message: text }; }

  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `Erreur ${res.status}`;
    if (__DEV__) console.error('[multipartFetch error]', method, res.status, json);
    throw { message: msg, status: res.status, raw: json };
  }

  return json as T;
}

const multipartPost = <T>(path: string, formData: FormData) =>
  multipartFetch<T>('POST', path, formData);

const multipartPut = <T>(path: string, formData: FormData) =>
  multipartFetch<T>('PUT', path, formData);

/**
 * Upload de la photo de profil.
 */
export const uploadPhoto = async (
  file: { uri: string; name: string; type: string },
  photoType: 'profil',
): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  formData.append('type', photoType);
  return multipartPut<UserProfile>('/api/users/me/photo', formData);
};

/**
 * Uploade la pièce d'identité de l'utilisateur connecté.
 * Statut initial du document → EN_ATTENTE.
 */
export const uploadPieceIdentite = async (
  file: { uri: string; name: string; type: string },
  typePieceIdentite: TypePieceIdentite,
  numeroPieceIdentite: string,
): Promise<void> => {
  const formData = new FormData();
  formData.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  formData.append('typePieceIdentite', typePieceIdentite);
  formData.append('numeroPieceIdentite', numeroPieceIdentite);
  await multipartPost<unknown>('/api/users/me/piece-identite', formData);
};

/**
 * Modifie le statut d'une pièce d'identité (admin / modérateur uniquement).
 * @param userId - Identifiant de l'utilisateur propriétaire de la pièce
 * @param statut  - Nouveau statut : 'VALIDEE' | 'REJETEE'
 * @param motifRejet - Motif obligatoire si statut === 'REJETEE'
 */
export const updatePieceStatut = async (
  userId: string,
  statut: StatutPieceIdentite,
  motifRejet?: string,
): Promise<PieceIdentite> => {
  const response = await apiClient.put<PieceIdentite>(
    `/api/users/${userId}/piece-identite/statut`,
    { statut, motifRejet },
  );
  return response.data;
};
