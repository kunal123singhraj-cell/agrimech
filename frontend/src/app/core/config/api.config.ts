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
    const host = window.location.hostname;
    const port = window.location.port;

    // If accessed via Angular dev server on port 4200, route to port 5000 on the same host (supports localhost, 127.0.0.1, and LAN IP)
    if (port === '4200') {
      return `http://${host}:5000/api`;
    }

    // In production or when served directly from Express on port 5000
    return '/api';
  }
  return 'http://localhost:5000/api';
};

