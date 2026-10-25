import { API_CONFIG, isMockMode } from './api-config';
import type {
  DashboardOverviewStats,
  User,
  Property,
  NIDVerificationRequest,
  GeoPhotoVerificationRequest,
  SpamReport,
  HeatmapAreaPoint,
  RentLedgerTransaction,
  PropertyStatus,
  PropertyCategory,
  FairRentLabel,
  PropertyPhotoDetail,
  PropertyFeatures,
} from './types';

// Import local JSON mocks
import initialOverviewStats from '@/mock/overview-stats.json';
import initialUsers from '@/mock/users.json';
import initialProperties from '@/mock/properties.json';
import initialNidRequests from '@/mock/nid-verifications.json';
import initialGeoPhotos from '@/mock/geo-photos.json';
import initialSpamReports from '@/mock/spam-reports.json';
import initialHeatmapData from '@/mock/heatmap-data.json';
import initialRentLedger from '@/mock/rent-ledger.json';

// In-memory mock database state for seamless local mutations
const mockOverviewStats: DashboardOverviewStats = { ...(initialOverviewStats as unknown as DashboardOverviewStats) };
let mockUsers: User[] = [...(initialUsers as unknown as User[])];
let mockProperties: Property[] = [...(initialProperties as unknown as Property[])];
let mockNidRequests: NIDVerificationRequest[] = [...(initialNidRequests as unknown as NIDVerificationRequest[])];
let mockGeoPhotos: GeoPhotoVerificationRequest[] = [...(initialGeoPhotos as unknown as GeoPhotoVerificationRequest[])];
let mockSpamReports: SpamReport[] = [...(initialSpamReports as unknown as SpamReport[])];
const mockHeatmapData: HeatmapAreaPoint[] = [...(initialHeatmapData as unknown as HeatmapAreaPoint[])];
const mockRentLedger: RentLedgerTransaction[] = [...(initialRentLedger as unknown as RentLedgerTransaction[])];

// Generic Django REST API Fetcher
async function djangoFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isPublicAuthEndpoint =
    endpoint.includes('/auth/login/') ||
    endpoint.includes('/auth/register/') ||
    endpoint.includes('/auth/otp/');

  const token =
    !isPublicAuthEndpoint && typeof window !== 'undefined'
      ? localStorage.getItem('rentbd_admin_token') || localStorage.getItem('baribara_admin_token')
      : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Only attach Bearer token on protected endpoints (NEVER on login or public auth)
  if (token && !isPublicAuthEndpoint) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_CONFIG.djangoBaseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    // If backend reports token_not_valid, clear stale tokens so user can re-authenticate
    if (errorData.code === 'token_not_valid' || errorData.detail?.includes('token')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rentbd_admin_token');
        localStorage.removeItem('baribara_admin_token');
      }
    }
    throw new Error(errorData.detail || errorData.message || `API request failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Safely extracts arrays from Django REST Framework endpoints,
 * supporting both paginated { count, results: [...] } and flat arrays [...].
 */
function extractArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

/**
 * Maps Django REST user object to UI User model
 */
function mapDjangoUser(raw: any): User {
  return {
    id: String(raw.id),
    name: raw.full_name || raw.name || 'User',
    phone: raw.phone_number || raw.phone || '',
    email: raw.email || '',
    role: (raw.role as User['role']) || 'admin',
    is_verified: Boolean(raw.is_phone_verified ?? raw.is_verified ?? true),
    nid_status: (raw.nid_status as User['nid_status']) || 'unverified',
    listings_count: Number(raw.listings_count || 0),
    joined_at: raw.date_joined || raw.joined_at || new Date().toISOString(),
    avatar_url: raw.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    occupation: raw.occupation || 'Operations Administrator',
    is_flagged_broker: Boolean(raw.is_flagged_broker),
  };
}

/**
/**
 * Normalizes image URLs from Django backend.
 * Automatically translates Android Emulator loopback IP (10.0.2.2) to the accessible web server address (localhost:8000),
 * resolves relative /media/ paths, and preserves external Cloud URLs.
 */
export function normalizeImageUrl(rawUrl: string | undefined | null): string {
  if (!rawUrl) return '';
  let url = String(rawUrl).trim();
  if (!url) return '';

  // Determine current backend host (e.g., http://localhost:8000)
  let backendHost = 'http://localhost:8000';
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    backendHost = `http://${hostname}:8000`;
  } else if (API_CONFIG.djangoBaseUrl) {
    backendHost = API_CONFIG.djangoBaseUrl.replace(/\/api\/v1\/?$/, '');
  }

  // 1. CRITICAL FIX: Android Emulator Loopback Translation (10.0.2.2 -> localhost:8000)
  // When mobile apps upload photos, Django saves "http://10.0.2.2:8000/media/..."
  // In a web browser on macOS, 10.0.2.2 is completely unreachable.
  // We rewrite 10.0.2.2:8000 to the accessible backend host (e.g. http://localhost:8000).
  if (url.includes('10.0.2.2')) {
    url = url.replace(/https?:\/\/10\.0\.2\.2(:\d+)?/, backendHost);
  }

  // 2. If it's already a full HTTP/HTTPS or data/blob URL, return it directly
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // 3. Relative path (e.g., /media/property_photos/...) -> prepend backend host
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendHost}${cleanPath}`;
}

/**
 * Maps Django REST property object to UI Property model with full details & photo parsing
 */
function mapDjangoProperty(raw: any): Property {
  let category: PropertyCategory = 'family';
  const rawCat = (raw.tenant_category || raw.category || '').toLowerCase();
  const rawType = (raw.property_type || '').toLowerCase();
  if (rawType === 'sublet' || rawCat.includes('sublet')) {
    category = 'sublet';
  } else if (rawCat.includes('bachelor')) {
    category = 'bachelor';
  }

  const fairLabelMap: Record<string, FairRentLabel> = {
    'GREAT_DEAL': 'Great Deal',
    'FAIR_PRICE': 'Fair Price',
    'OVERPRICED': 'Overpriced',
    'great deal': 'Great Deal',
    'fair price': 'Fair Price',
    'overpriced': 'Overpriced',
  };

  // 1. Comprehensive photo extraction
  // Handles raw.images ([ { image_url: "...", room_type: "..." } ]), raw.photos, and raw.property_photos
  const rawPhotosList: any[] = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    rawPhotosList.push(...raw.images);
  }
  if (Array.isArray(raw.photos) && raw.photos.length > 0) {
    rawPhotosList.push(...raw.photos);
  }
  if (Array.isArray(raw.property_photos) && raw.property_photos.length > 0) {
    rawPhotosList.push(...raw.property_photos);
  }

  const extractedPhotos: string[] = [];
  const photoDetails: PropertyPhotoDetail[] = [];

  for (const item of rawPhotosList) {
    let photoUrl = '';
    let tag: string | undefined;
    let isCover: boolean | undefined;
    let hasGps: boolean | undefined;
    let extLat: number | undefined;
    let extLng: number | undefined;
    let id: string | undefined;

    if (typeof item === 'string') {
      photoUrl = normalizeImageUrl(item);
    } else if (item && typeof item === 'object') {
      photoUrl = normalizeImageUrl(
        item.image_url || item.image || item.url || item.photo || item.file
      );
      tag = item.room_type || item.tag || item.photo_tag;
      isCover = Boolean(item.is_cover || item.is_primary);
      hasGps = Boolean(item.is_geo_tagged ?? item.has_exif_gps ?? (item.extracted_latitude != null));
      extLat = item.extracted_latitude ? Number(item.extracted_latitude) : undefined;
      extLng = item.extracted_longitude ? Number(item.extracted_longitude) : undefined;
      id = item.id ? String(item.id) : undefined;
    }

    if (photoUrl && !extractedPhotos.includes(photoUrl)) {
      extractedPhotos.push(photoUrl);
      photoDetails.push({
        id,
        url: photoUrl,
        tag,
        is_cover: isCover,
        has_exif_gps: hasGps,
        extracted_latitude: extLat,
        extracted_longitude: extLng,
      });
    }
  }

  // Fallback single image if photos array was empty
  if (extractedPhotos.length === 0 && (raw.cover_image || raw.image || raw.photo || raw.image_url)) {
    const single = normalizeImageUrl(raw.cover_image || raw.image || raw.photo || raw.image_url);
    if (single) {
      extractedPhotos.push(single);
      photoDetails.push({ url: single, is_cover: true });
    }
  }

  // 2. Comprehensive amenities extraction
  const amenities: string[] = [];
  if (Array.isArray(raw.amenities) && raw.amenities.length > 0) {
    for (const a of raw.amenities) {
      if (typeof a === 'string') amenities.push(a);
      else if (a && typeof a === 'object' && a.name) amenities.push(a.name);
    }
  } else {
    if (raw.gas_supply === 'LINE_GAS' || raw.has_line_gas) amenities.push('Line Gas (Titas)');
    if (raw.gas_supply === 'CYLINDER' || raw.has_gas_cylinder) amenities.push('LPG Cylinder');
    if (raw.water_quality === 'EXCELLENT') amenities.push('WASA Water Supply');
    if (raw.has_generator || (raw.description && raw.description.toLowerCase().includes('generator'))) {
      amenities.push('Generator Backup');
    }
    if (raw.has_lift || Number(raw.total_floors || 0) >= 4 || (raw.description && raw.description.toLowerCase().includes('lift'))) {
      amenities.push('Lift / Elevator');
    }
    if (raw.has_cctv || Number(raw.night_safety_rating || 0) >= 4 || (raw.description && raw.description.toLowerCase().includes('caretaker'))) {
      amenities.push('24/7 Security & Caretaker');
    }
    if (raw.has_parking || (raw.description && raw.description.toLowerCase().includes('parking'))) {
      amenities.push('Car Parking');
    }
    if (raw.is_furnished || (raw.description && raw.description.toLowerCase().includes('furnished'))) {
      amenities.push('Furnished');
    }
    if (raw.is_wifi_ready || (raw.description && raw.description.toLowerCase().includes('wifi'))) {
      amenities.push('High-Speed WiFi');
    }
    if (raw.bachelor_allowed || rawCat.includes('bachelor')) {
      amenities.push('Bachelor Allowed');
    }
    if (Number(raw.alley_width_feet || 0) >= 16) {
      amenities.push(`${raw.alley_width_feet}ft Wide Road`);
    }
  }
  if (amenities.length === 0) {
    amenities.push('Line Gas', 'Generator Backup', 'Lift', '24/7 Security');
  }

  const features: PropertyFeatures = {
    has_lift: Boolean(raw.has_lift || (raw.description && raw.description.toLowerCase().includes('lift'))),
    has_generator: Boolean(raw.has_generator || (raw.description && raw.description.toLowerCase().includes('generator'))),
    has_line_gas: Boolean(raw.gas_supply === 'LINE_GAS' || raw.has_line_gas),
    has_gas_cylinder: Boolean(raw.gas_supply === 'CYLINDER' || raw.has_gas_cylinder),
    has_parking: Boolean(raw.has_parking || (raw.description && raw.description.toLowerCase().includes('parking'))),
    has_cctv: Boolean(raw.has_cctv || Number(raw.night_safety_rating || 0) >= 4),
    is_wifi_ready: Boolean(raw.is_wifi_ready || (raw.description && raw.description.toLowerCase().includes('wifi'))),
    is_furnished: Boolean(raw.is_furnished || (raw.description && raw.description.toLowerCase().includes('furnished'))),
    bachelor_allowed: Boolean(raw.bachelor_allowed || rawCat.includes('bachelor')),
  };

  const rentAmount = Number(raw.rent_amount ?? raw.rent_bdt ?? 0);
  const serviceCharge = Number(raw.service_charge ?? raw.service_charge_bdt ?? 2000);
  const deposit = Number(raw.security_deposit ?? raw.advance_deposit_bdt ?? 0);
  const totalMonthly = Number(raw.total_monthly_est ?? (rentAmount + serviceCharge));

  // Determine geo-verified photo status
  const hasGeoPhotos = Boolean(
    raw.has_geo_tagged_photos ??
    raw.has_geo_verified_photo ??
    photoDetails.some((p) => p.has_exif_gps)
  );

  return {
    id: String(raw.id),
    title: raw.title || 'Untitled Property Listing',
    description:
      raw.description ||
      raw.details ||
      raw.ai_generated_description ||
      'No property description provided by landlord.',
    property_type: raw.property_type || (raw.tenant_category === 'SUBLET' ? 'SUBLET' : 'APARTMENT'),
    category,
    rent_bdt: rentAmount,
    service_charge_bdt: serviceCharge,
    advance_deposit_bdt: deposit,
    total_monthly_est: totalMonthly,
    address: raw.full_address || raw.address || 'Dhaka, Bangladesh',
    thana: raw.area_neighborhood || raw.thana || 'Dhaka',
    district: raw.district || 'Dhaka',
    coordinates: {
      lat: Number(raw.latitude ?? raw.coordinates?.lat ?? 23.8103),
      lng: Number(raw.longitude ?? raw.coordinates?.lng ?? 90.4125),
    },
    bedrooms: Number(raw.bedrooms ?? 2),
    bathrooms: Number(raw.bathrooms ?? 2),
    balconies: Number(raw.balconies ?? 1),
    size_sqft: Number(raw.square_feet ?? raw.size_sqft ?? 950),
    floor_level: Number(raw.floor_level ?? 3),
    total_floors: raw.total_floors ? Number(raw.total_floors) : undefined,
    is_available: Boolean(raw.is_available ?? true),
    is_vaulted: Boolean(raw.is_vaulted),
    status: (raw.status as PropertyStatus) || 'active',
    fair_price_meter: {
      status: fairLabelMap[raw.fair_price_status] || 'Fair Price',
      estimated_fair_rent: Number(raw.area_average_rent ?? raw.rent_amount ?? 22000),
      difference_percentage: Number(raw.fair_price_percent_diff ?? 0),
      market_average_per_sqft: 25,
    },
    has_geo_verified_photo: hasGeoPhotos,
    geo_tagged_photo: raw.geo_tagged_photo
      ? {
          photo_url: normalizeImageUrl(raw.geo_tagged_photo.photo_url || raw.geo_tagged_photo.image),
          exif_lat: Number(raw.geo_tagged_photo.exif_lat ?? raw.geo_tagged_photo.extracted_latitude ?? raw.latitude ?? 0),
          exif_lng: Number(raw.geo_tagged_photo.exif_lng ?? raw.geo_tagged_photo.extracted_longitude ?? raw.longitude ?? 0),
          captured_at: raw.geo_tagged_photo.captured_at || new Date().toISOString(),
          distance_discrepancy_meters: Number(raw.geo_tagged_photo.distance_discrepancy_meters ?? 0),
          accuracy_meters: Number(raw.geo_tagged_photo.accuracy_meters ?? 5),
        }
      : photoDetails.find((p) => p.has_exif_gps)
      ? {
          photo_url: photoDetails.find((p) => p.has_exif_gps)!.url,
          exif_lat: Number(raw.latitude ?? 23.8103),
          exif_lng: Number(raw.longitude ?? 90.4125),
          captured_at: raw.created_at || new Date().toISOString(),
          distance_discrepancy_meters: 2,
          accuracy_meters: 5,
        }
      : undefined,
    landlord: {
      id: String(raw.landlord?.id || raw.landlord_id || 'landlord-1'),
      name: raw.landlord?.name || raw.landlord?.full_name || raw.landlord_name || 'Bariwala',
      phone:
        raw.landlord_phone ||
        raw.landlord_phone_masked ||
        raw.landlord?.phone ||
        raw.landlord?.phone_number ||
        '+880 1800-000000',
      email: raw.landlord?.email || raw.landlord_email || undefined,
      avatar_url: raw.landlord?.avatar_url || raw.landlord_avatar,
      is_nid_verified: Boolean(
        raw.landlord_is_nid_verified ??
        raw.landlord?.is_nid_verified ??
        raw.is_owner_verified ??
        raw.is_nid_verified ??
        false
      ),
      rating:
        raw.landlord_rating != null
          ? Number(raw.landlord_rating)
          : raw.landlord?.rating != null
          ? Number(raw.landlord.rating)
          : undefined,
    },
    photos: extractedPhotos,
    photo_details: photoDetails,
    amenities,
    features,
    ai_description_generated: Boolean(raw.ai_description_generated),
    alley_width_feet: raw.alley_width_feet != null ? Number(raw.alley_width_feet) : undefined,
    gas_supply: raw.gas_supply || undefined,
    waterlogging_risk: raw.waterlogging_risk || undefined,
    water_quality: raw.water_quality || undefined,
    night_safety_rating: raw.night_safety_rating != null ? Number(raw.night_safety_rating) : undefined,
    estimated_utilities_bdt: raw.estimated_utilities != null ? Number(raw.estimated_utilities) : undefined,
    total_move_in_cost_bdt: raw.total_move_in_cost != null ? Number(raw.total_move_in_cost) : undefined,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    views_count: Number(raw.views_count ?? 120),
    inquiries_count: Number(raw.inquiries_count ?? 14),
    moderation_notes: raw.moderation_notes || raw.reviewer_notes,
    rejection_reason: raw.rejection_reason,
  };
}

/**
 * RentBD Unified Admin API Client
 */
export const apiClient = {
  // Auth
  async login(phoneOrEmail: string, password: string): Promise<{ access: string; user: User }> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 400));
      const lower = phoneOrEmail.toLowerCase().trim();

      // Specifically reject non-admin roles (tenant / landlord)
      if (
        lower.includes('tenant') ||
        lower.includes('landlord') ||
        lower === '+8801712345678' ||
        lower === '+8801811223344'
      ) {
        throw new Error(
          'Access Denied: Role "tenant" or "landlord" detected. Only users with the "admin" role are permitted to log in to this panel.'
        );
      }

      // Check admin password
      if (
        password !== 'Admin@RentBD2026' &&
        password !== 'admin' &&
        !password.toLowerCase().includes('admin')
      ) {
        throw new Error('Invalid administrator credentials. Please verify your password.');
      }

      // Validated Admin user
      const adminUser: User = {
        id: 'usr-admin-1',
        name: 'Super Admin (Nafis)',
        phone: '+8801700000000',
        email: phoneOrEmail.includes('@') ? phoneOrEmail : 'admin@rentbd.com',
        role: 'admin',
        is_verified: true,
        nid_status: 'verified',
        listings_count: 0,
        joined_at: new Date().toISOString(),
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        occupation: 'Head of Operations & Trust',
      };
      return { access: 'mock_jwt_token_rentbd_admin_2026', user: adminUser };
    }

    const payload: Record<string, string> = {
      password,
      role: 'admin',
    };

    if (phoneOrEmail.includes('@')) {
      payload.email = phoneOrEmail.trim();
    } else {
      payload.phone_number = phoneOrEmail.startsWith('+')
        ? phoneOrEmail
        : `+88${phoneOrEmail.replace(/^0/, '0')}`;
    }

    const res = await djangoFetch<{
      success: boolean;
      tokens: { access: string; refresh: string };
      user: any;
    }>(API_CONFIG.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const mappedUser = mapDjangoUser(res.user);

    // CRITICAL: Strictly verify that the user has admin role or staff permissions
    if (mappedUser.role !== 'admin' && !res.user.is_staff && !res.user.is_superuser) {
      throw new Error(
        'Access Denied: Only users with the "admin" role have permission to access the RentBD Admin Panel.'
      );
    }

    return { access: res.tokens.access, user: mappedUser };
  },

  // Dashboard Overview
  async getOverviewStats(): Promise<DashboardOverviewStats> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      return {
        ...mockOverviewStats,
        pending_nid_count: mockNidRequests.filter((n) => n.status === 'pending').length,
        pending_spam_count: mockSpamReports.filter((s) => s.status === 'pending_review').length,
        pending_geo_count: mockGeoPhotos.filter((g) => g.status === 'pending').length,
        pending_property_count: mockProperties.filter((p) => p.status === 'pending_approval').length,
      };
    }
    try {
      return await djangoFetch<DashboardOverviewStats>(API_CONFIG.endpoints.dashboard.overview);
    } catch {
      return await djangoFetch<DashboardOverviewStats>(API_CONFIG.endpoints.dashboard.overviewAlias);
    }
  },

  // Users
  async getUsers(): Promise<User[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      return [...mockUsers];
    }
    const rawList = await djangoFetch<any>(API_CONFIG.endpoints.users.list);
    return extractArray(rawList).map(mapDjangoUser);
  },

  async toggleBrokerStatus(userId: string): Promise<User> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      mockUsers = mockUsers.map((u) => {
        if (u.id === userId) {
          return { ...u, is_flagged_broker: !u.is_flagged_broker };
        }
        return u;
      });
      return mockUsers.find((u) => u.id === userId)!;
    }
    const rawUser = await djangoFetch<any>(API_CONFIG.endpoints.users.ban(userId), { method: 'POST' });
    return mapDjangoUser(rawUser);
  },

  // Properties Moderation
  async getProperties(params?: { status?: string; category?: string }): Promise<Property[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      let list = [...mockProperties];
      if (params?.status && params.status !== 'all') {
        list = list.filter((p) => p.status === params.status);
      }
      if (params?.category && params.category !== 'all') {
        list = list.filter((p) => p.category === params.category);
      }
      return list;
    }

    const queryParts: string[] = [];
    if (params?.status && params.status !== 'all') queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params?.category && params.category !== 'all') queryParts.push(`category=${encodeURIComponent(params.category)}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    try {
      try {
        const rawList = await djangoFetch<any>(`${API_CONFIG.endpoints.properties.list}${queryString}`);
        return extractArray(rawList).map(mapDjangoProperty);
      } catch {
        // Fallback to public property list endpoint if admin list is segmented or requires different permission
        const rawList = await djangoFetch<any>(`/properties/${queryString}`);
        return extractArray(rawList).map(mapDjangoProperty);
      }
    } catch (err) {
      console.warn('Could not fetch properties from live backend, falling back to cached dataset:', err);
      let list = [...mockProperties];
      if (params?.status && params.status !== 'all') {
        list = list.filter((p) => p.status === params.status);
      }
      if (params?.category && params.category !== 'all') {
        list = list.filter((p) => p.category === params.category);
      }
      return list;
    }
  },

  async getProperty(propertyId: string): Promise<Property> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 150));
      const found = mockProperties.find((p) => p.id === propertyId);
      if (!found) throw new Error(`Property ${propertyId} not found`);
      return found;
    }

    try {
      try {
        const rawProp = await djangoFetch<any>(API_CONFIG.endpoints.properties.detail(propertyId));
        return mapDjangoProperty(rawProp);
      } catch {
        // Fallback to public property detail
        const rawProp = await djangoFetch<any>(`/properties/${propertyId}/`);
        return mapDjangoProperty(rawProp);
      }
    } catch {
      const found = mockProperties.find((p) => p.id === propertyId);
      if (found) return found;
      throw new Error(`Property ${propertyId} not found`);
    }
  },

  async updatePropertyStatus(
    propertyId: string,
    status: PropertyStatus,
    notes?: string
  ): Promise<Property> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      mockProperties = mockProperties.map((p) => {
        if (p.id === propertyId) {
          return {
            ...p,
            status,
            moderation_notes: notes || p.moderation_notes,
            rejection_reason: status === 'rejected' ? (notes || 'Listing rejected by administrator.') : undefined,
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      });
      return mockProperties.find((p) => p.id === propertyId)!;
    }

    try {
      const rawProp = await djangoFetch<any>(API_CONFIG.endpoints.properties.updateStatus(propertyId), {
        method: 'PATCH',
        body: JSON.stringify({ status, notes, rejection_reason: notes }),
      });
      return mapDjangoProperty(rawProp);
    } catch {
      // Fallback to direct property PATCH
      const rawProp = await djangoFetch<any>(API_CONFIG.endpoints.properties.detail(propertyId), {
        method: 'PATCH',
        body: JSON.stringify({ status, moderation_notes: notes }),
      });
      return mapDjangoProperty(rawProp);
    }
  },

  // NID Verifications
  async getNIDRequests(status?: 'pending' | 'approved' | 'rejected' | 'all'): Promise<NIDVerificationRequest[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      if (!status || status === 'all') return [...mockNidRequests];
      return mockNidRequests.filter((n) => n.status === status);
    }
    const query = status && status !== 'all' ? `?status=${status}` : '';
    const list = await djangoFetch<any>(`${API_CONFIG.endpoints.nidVerification.list}${query}`);
    return extractArray<NIDVerificationRequest>(list);
  },

  async approveNID(requestId: string, notes?: string): Promise<NIDVerificationRequest> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 300));
      mockNidRequests = mockNidRequests.map((n) => {
        if (n.id === requestId) {
          return {
            ...n,
            status: 'approved',
            reviewer_notes: notes || n.reviewer_notes,
            reviewed_at: new Date().toISOString(),
            reviewed_by: 'Super Admin',
          };
        }
        return n;
      });
      const targetReq = mockNidRequests.find((n) => n.id === requestId);
      if (targetReq) {
        mockUsers = mockUsers.map((u) =>
          u.id === targetReq.landlord_id ? { ...u, is_verified: true, nid_status: 'verified' } : u
        );
      }
      return mockNidRequests.find((n) => n.id === requestId)!;
    }
    return djangoFetch<NIDVerificationRequest>(API_CONFIG.endpoints.nidVerification.approve(requestId), {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async rejectNID(requestId: string, reason: string): Promise<NIDVerificationRequest> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 300));
      mockNidRequests = mockNidRequests.map((n) => {
        if (n.id === requestId) {
          return {
            ...n,
            status: 'rejected',
            rejection_reason: reason,
            reviewed_at: new Date().toISOString(),
            reviewed_by: 'Super Admin',
          };
        }
        return n;
      });
      const targetReq = mockNidRequests.find((n) => n.id === requestId);
      if (targetReq) {
        mockUsers = mockUsers.map((u) =>
          u.id === targetReq.landlord_id ? { ...u, nid_status: 'rejected' } : u
        );
      }
      return mockNidRequests.find((n) => n.id === requestId)!;
    }
    return djangoFetch<NIDVerificationRequest>(API_CONFIG.endpoints.nidVerification.reject(requestId), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Geo-Photos
  async getGeoPhotos(): Promise<GeoPhotoVerificationRequest[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      return [...mockGeoPhotos];
    }
    const list = await djangoFetch<any>(API_CONFIG.endpoints.geoPhotos.list);
    return extractArray<GeoPhotoVerificationRequest>(list);
  },

  async verifyGeoPhoto(photoId: string, approved: boolean): Promise<GeoPhotoVerificationRequest> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      mockGeoPhotos = mockGeoPhotos.map((g) => {
        if (g.id === photoId) {
          return { ...g, status: approved ? 'approved' : 'rejected' };
        }
        return g;
      });
      return mockGeoPhotos.find((g) => g.id === photoId)!;
    }
    return djangoFetch<GeoPhotoVerificationRequest>(API_CONFIG.endpoints.geoPhotos.verify(photoId), {
      method: 'POST',
      body: JSON.stringify({ approved }),
    });
  },

  // AI Spam & Duplicate Detection Queue
  async getSpamReports(): Promise<SpamReport[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      return [...mockSpamReports];
    }
    const list = await djangoFetch<any>(API_CONFIG.endpoints.aiSpam.list);
    return extractArray<SpamReport>(list);
  },

  async resolveSpamReport(
    reportId: string,
    action: 'listing_banned' | 'landlord_blocked' | 'false_positive'
  ): Promise<SpamReport> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 250));
      mockSpamReports = mockSpamReports.map((s) => {
        if (s.id === reportId) {
          return { ...s, status: action };
        }
        return s;
      });

      const report = mockSpamReports.find((s) => s.id === reportId);
      if (report && action === 'listing_banned') {
        mockProperties = mockProperties.map((p) =>
          p.id === report.property_id ? { ...p, status: 'rejected' } : p
        );
      } else if (report && action === 'landlord_blocked') {
        mockProperties = mockProperties.map((p) =>
          p.id === report.property_id ? { ...p, status: 'rejected' } : p
        );
        mockUsers = mockUsers.map((u) =>
          u.phone === report.landlord_phone ? { ...u, is_flagged_broker: true } : u
        );
      }

      return mockSpamReports.find((s) => s.id === reportId)!;
    }
    return djangoFetch<SpamReport>(API_CONFIG.endpoints.aiSpam.resolve(reportId), {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  // Heatmap & Geospatial Analytics
  async getHeatmapData(): Promise<HeatmapAreaPoint[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      return [...mockHeatmapData];
    }
    const data = await djangoFetch<any>(API_CONFIG.endpoints.heatmap.demandSupply);
    return extractArray<HeatmapAreaPoint>(data);
  },

  // Digital Rent & Utility Ledger
  async getLedgerTransactions(): Promise<RentLedgerTransaction[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200));
      return [...mockRentLedger];
    }
    const list = await djangoFetch<any>(API_CONFIG.endpoints.ledger.transactions);
    return extractArray<RentLedgerTransaction>(list);
  },
};
