import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Forme normalisée des erreurs renvoyées par l'intercepteur de réponse. */
export interface ApiError {
  message: string;
  status?: number;
  raw?: unknown;
  errors?: Record<string, string> | null;
}

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * URL de base de l'API. En développement, utiliser l'IP locale de la machine
 * pour que le téléphone physique puisse joindre le serveur.
 * Ex: http://192.168.1.XX:8080
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080'; // 10.0.2.2 = localhost depuis émulateur Android

const TOKEN_KEY = 'auth_token';

// ─── Instance Axios ───────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Intercepteur Request : injection du token ────────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Intercepteur Response : normalisation des erreurs ────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string; errors?: unknown }>) => {
    const status = error.response?.status;

    // Log complet pour le débogage
    if (__DEV__) {
      if (!error.response) {
        // Erreur réseau : serveur injoignable, timeout, pas de connexion
        console.warn('[API Network Error]', {
          url: error.config?.url,
          message: error.message,
        });
      } else {
        console.warn('[API Error]', {
          status,
          url: error.config?.url,
          data: error.response?.data,
        });
      }
    }

    const data = error.response?.data as any;

    // 422 Unprocessable Entity = erreur de règle métier
    // (ex: pièce d'identité non validée, quota d'annonces dépassé).
    // Le backend renvoie toujours data.message avec une description lisible.
    const message =
      data?.message ??
      data?.error ??
      (typeof data === 'string' ? data : null) ??
      error.message ??
      'Une erreur est survenue';

    // Expose `errors` directement (champs de validation) en plus de `raw`
    // pour un accès uniforme avec les helpers fetch multipart.
    return Promise.reject({
      message,
      status,
      raw: data,
      errors: (data?.errors ?? null) as Record<string, string> | null,
    });
  },
);

// ─── Helpers Token ───────────────────────────────────────────────────────────

export const saveToken = (token: string) =>
  AsyncStorage.setItem(TOKEN_KEY, token);

export const removeToken = () => AsyncStorage.removeItem(TOKEN_KEY);

export const getToken = () => AsyncStorage.getItem(TOKEN_KEY);
