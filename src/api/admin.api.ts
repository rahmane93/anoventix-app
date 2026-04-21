import type {
    AdminAnnonce,
    AdminAnnoncesPage,
    AdminStats,
    AdminUser,
    AnnonceStats,
    ChangePieceIdentiteStatutRequest,
    ChangeStatutUserRequest,
    SignalementsPage,
} from '../types/admin.types';
import { apiClient } from './client';

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const res = await apiClient.get<AdminStats>('/api/admin/stats');
  return res.data;
}

// ─── Signalements ─────────────────────────────────────────────────────────────

export async function getSignalements(
  page = 0,
  size = 20,
): Promise<SignalementsPage> {
  const res = await apiClient.get<SignalementsPage>('/api/admin/signalements', {
    params: { page, size },
  });
  return res.data;
}

// ─── Utilisateurs ─────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<AdminUser[]> {
  const res = await apiClient.get<AdminUser[]>('/api/users');
  return res.data;
}

export async function getUserById(id: string): Promise<AdminUser> {
  const res = await apiClient.get<AdminUser>(`/api/users/${id}`);
  return res.data;
}

export async function changeUserStatut(
  id: string,
  body: ChangeStatutUserRequest,
): Promise<AdminUser> {
  const res = await apiClient.put<AdminUser>(`/api/users/${id}/statut`, body);
  return res.data;
}

export async function changePieceIdentiteStatut(
  id: string,
  body: ChangePieceIdentiteStatutRequest,
): Promise<AdminUser> {
  const res = await apiClient.put<AdminUser>(
    `/api/users/${id}/piece-identite/statut`,
    body,
  );
  return res.data;
}

// ─── Annonces admin ───────────────────────────────────────────────────────────

export async function getAdminAnnonces(
  page = 0,
  size = 10,
  sort = 'dateCreation',
  direction = 'desc',
): Promise<AdminAnnoncesPage> {
  const res = await apiClient.get<AdminAnnoncesPage>('/api/biens-immo', {
    params: { page, size, sort, direction },
  });
  return res.data;
}

export async function toggleAnnonceActif(id: number): Promise<void> {
  await apiClient.put(`/api/biens-immo/${id}/toggle-actif`);
}

export async function getAdminAnnonceById(id: number): Promise<AdminAnnonce> {
  const res = await apiClient.get<AdminAnnonce>(`/api/biens-immo/${id}`);
  return res.data;
}

export async function getAnnonceStats(id: number): Promise<AnnonceStats> {
  const res = await apiClient.get<AnnonceStats>(`/api/biens-immo/${id}/stats`);
  return res.data;
}
