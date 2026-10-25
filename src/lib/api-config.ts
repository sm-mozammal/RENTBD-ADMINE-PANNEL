/**
 * API Configuration for RentBD Admin Dashboard
 * 
 * Set `useMockData: true` for zero-rework local demonstration with comprehensive dummy JSON,
 * or toggle to `false` when connecting to the live Django REST API backend.
 * 
 * Supports browser-level dynamic toggle via localStorage for instant live testing.
 */

export const API_CONFIG = {
  // Toggle this flag or set NEXT_PUBLIC_USE_MOCK_DATA="false" in .env.local
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false',
  
  // Django REST API Base URL
  djangoBaseUrl: process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/v1',
  
  // Endpoints corresponding to Django REST ViewSets
  endpoints: {
    auth: {
      login: '/auth/login/',
      refresh: '/auth/token/refresh/',
      me: '/auth/profile/',
    },
    dashboard: {
      overview: '/admin/analytics/dashboard/',
      overviewAlias: '/admin/overview-stats/',
      activity: '/admin/recent-activity/',
    },
    users: {
      list: '/admin/users/',
      detail: (id: string) => `/admin/users/${id}/`,
      ban: (id: string) => `/admin/users/${id}/ban/`,
    },
    nidVerification: {
      list: '/admin/nid-verifications/',
      detail: (id: string) => `/admin/nid-verifications/${id}/`,
      approve: (id: string) => `/admin/nid-verifications/${id}/approve/`,
      reject: (id: string) => `/admin/nid-verifications/${id}/reject/`,
    },
    geoPhotos: {
      list: '/admin/geo-photos/',
      verify: (id: string) => `/admin/geo-photos/${id}/verify/`,
    },
    properties: {
      list: '/admin/properties/',
      detail: (id: string) => `/admin/properties/${id}/`,
      updateStatus: (id: string) => `/admin/properties/${id}/status/`,
      fairRentAnalysis: (id: string) => `/admin/properties/${id}/fair-rent-analysis/`,
    },
    aiSpam: {
      list: '/admin/ai-spam-queue/',
      resolve: (id: string) => `/admin/ai-spam-queue/${id}/resolve/`,
      trainFeedback: '/admin/ai-spam-queue/feedback/',
    },
    heatmap: {
      demandSupply: '/admin/analytics/demand-supply-heatmap/',
      areaBreakdown: (areaId: string) => `/admin/analytics/area/${areaId}/`,
    },
    ledger: {
      transactions: '/admin/finance/ledger/',
      monetizationStats: '/admin/finance/revenue-breakdown/',
    },
  },
  
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
};

/**
 * Returns whether mock mode is currently enabled.
 * Allows client-side overrides stored in localStorage for quick switching in the UI header.
 */
export function isMockMode(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('rentbd_use_mock_data') || localStorage.getItem('baribara_use_mock_data');
    if (stored !== null) {
      return stored === 'true';
    }
  }
  return API_CONFIG.useMockData;
}

export function setMockMode(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rentbd_use_mock_data', String(enabled));
    window.dispatchEvent(new Event('rentbd_mock_mode_changed'));
  }
}
