/**
 * Centralized API Configuration for AgriMech
 * Automatically adapts between local development (localhost:5000)
 * and production deployment (unified origin /api or custom API host).
 */

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.__AGRIMECH_API_URL__) {
      return win.__AGRIMECH_API_URL__;
    }
    // When deployed in production on the same domain (e.g. Render, Railway, VPS)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '/api';
    }
  }
  return 'http://localhost:5000/api';
};
