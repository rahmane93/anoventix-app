import type { BienImmo, PageResponse } from '../types/annonce.types';
import type {
    AgentDTO,
    CreateAgentRequest,
    CreateEntrepriseRequest,
    EntrepriseDTO,
    UpdateEntrepriseRequest,
} from '../types/entreprise.types';
import { apiClient } from './client';

// ─── Entreprise API ───────────────────────────────────────────────────────────

/**
 * Crée une entreprise pour l'utilisateur PROFESSIONNEL connecté.
 */
export const createEntreprise = async (
  data: CreateEntrepriseRequest,
): Promise<EntrepriseDTO> => {
  const response = await apiClient.post<EntrepriseDTO>('/api/entreprises', data);
  return response.data;
};

/**
 * Met à jour les informations de l'entreprise.
 */
export const updateEntreprise = async (
  id: string,
  data: UpdateEntrepriseRequest,
): Promise<EntrepriseDTO> => {
  const response = await apiClient.put<EntrepriseDTO>(`/api/entreprises/${id}`, data);
  return response.data;
};

/**
 * Récupère l'entreprise d'un utilisateur par son ID.
 */
export const getEntrepriseByUserId = async (userId: string): Promise<EntrepriseDTO> => {
  const response = await apiClient.get<EntrepriseDTO>(`/api/entreprises/user/${userId}`);
  return response.data;
};

/**
 * Récupère une entreprise par son ID.
 */
export const getEntrepriseById = async (id: string): Promise<EntrepriseDTO> => {
  const response = await apiClient.get<EntrepriseDTO>(`/api/entreprises/${id}`);
  return response.data;
};

/**
 * Récupère les annonces liées à une entreprise.
 * Le backend peut renvoyer soit un tableau direct, soit une page { data: [...] }.
 */
export const getEntrepriseAnnonces = async (entrepriseId: string): Promise<BienImmo[]> => {
  const response = await apiClient.get<BienImmo[] | PageResponse<BienImmo>>(
    `/api/entreprises/${entrepriseId}/annonces`,
  );
  return Array.isArray(response.data) ? response.data : (response.data.data ?? []);
};

/**
 * Récupère la liste des agents d'une entreprise.
 * Le backend peut renvoyer soit un tableau direct, soit une page { data: [...] }.
 */
export const getEntrepriseAgents = async (entrepriseId: string): Promise<AgentDTO[]> => {
  const response = await apiClient.get<AgentDTO[] | PageResponse<AgentDTO>>(
    `/api/entreprises/${entrepriseId}/agents`,
  );
  return Array.isArray(response.data) ? response.data : (response.data.data ?? []);
};

/**
 * Crée un agent rattaché à une entreprise.
 * L'agent reçoit un email avec son mot de passe temporaire.
 */
export const createAgent = async (
  entrepriseId: string,
  data: CreateAgentRequest,
): Promise<AgentDTO> => {
  const response = await apiClient.post<AgentDTO>(
    `/api/entreprises/${entrepriseId}/agents`,
    data,
  );
  return response.data;
};

/**
 * Retire un agent de l'entreprise (réponse 204 sans corps).
 */
export const deleteAgent = async (
  entrepriseId: string,
  agentId: string,
): Promise<void> => {
  const response = await apiClient.delete(
    `/api/entreprises/${entrepriseId}/agents/${agentId}`,
  );
  // 204 No Content — pas de corps à lire
  if (response.status !== 204 && response.status !== 200) {
    throw { message: `Erreur inattendue (${response.status})`, status: response.status };
  }
};

/**
 * Suspend un agent de l'entreprise.
 */
export const suspendAgent = async (
  entrepriseId: string,
  agentId: string,
): Promise<void> => {
  const response = await apiClient.put(
    `/api/entreprises/${entrepriseId}/agents/${agentId}/suspendre`,
  );
  if (response.status !== 204 && response.status !== 200) {
    throw { message: `Erreur inattendue (${response.status})`, status: response.status };
  }
};

/**
 * Réactive un agent de l'entreprise.
 */
export const activateAgent = async (
  entrepriseId: string,
  agentId: string,
): Promise<void> => {
  const response = await apiClient.put(
    `/api/entreprises/${entrepriseId}/agents/${agentId}/activer`,
  );
  if (response.status !== 204 && response.status !== 200) {
    throw { message: `Erreur inattendue (${response.status})`, status: response.status };
  }
};

/**
 * Vérifie si l'entreprise peut créer une annonce (quota).
 */
export const canCreateAnnonce = async (entrepriseId: string): Promise<boolean> => {
  const response = await apiClient.get<boolean>(
    `/api/entreprises/${entrepriseId}/can-create-annonce`,
  );
  return response.data;
};

/**
 * Vérifie si l'entreprise peut ajouter un agent (quota).
 */
export const canAddAgent = async (entrepriseId: string): Promise<boolean> => {
  const response = await apiClient.get<boolean>(
    `/api/entreprises/${entrepriseId}/can-add-agent`,
  );
  return response.data;
};
