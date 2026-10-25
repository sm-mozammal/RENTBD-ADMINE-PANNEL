export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'tenant' | 'landlord' | 'caretaker' | 'admin';
  is_verified: boolean;
  nid_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  listings_count: number;
  joined_at: string;
  avatar_url?: string;
  occupation?: string;
  rating?: number;
  is_flagged_broker?: boolean;
}

export type PropertyCategory = 'family' | 'bachelor' | 'sublet';
export type PropertyStatus = 'active' | 'pending_approval' | 'flagged_spam' | 'rented' | 'rejected';
export type FairRentLabel = 'Fair Price' | 'Great Deal' | 'Overpriced';

export interface PropertyPhotoDetail {
  id?: string;
  url: string;
  tag?: string; // 'BEDROOM' | 'LIVING' | 'KITCHEN' | 'BATHROOM' | 'BALCONY' | 'BUILDING_EXTERIOR'
  is_cover?: boolean;
  has_exif_gps?: boolean;
  extracted_latitude?: number;
  extracted_longitude?: number;
}

export interface PropertyFeatures {
  has_lift?: boolean;
  has_generator?: boolean;
  has_line_gas?: boolean;
  has_gas_cylinder?: boolean;
  has_parking?: boolean;
  has_cctv?: boolean;
  is_wifi_ready?: boolean;
  is_furnished?: boolean;
  bachelor_allowed?: boolean;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  property_type?: string;
  category: PropertyCategory;
  rent_bdt: number;
  service_charge_bdt: number;
  advance_deposit_bdt: number;
  total_monthly_est?: number;
  address: string;
  thana: string;
  district: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  size_sqft: number;
  floor_level: number;
  total_floors?: number;
  is_available: boolean;
  is_vaulted?: boolean;
  status: PropertyStatus;
  fair_price_meter: {
    status: FairRentLabel;
    estimated_fair_rent: number;
    difference_percentage: number;
    market_average_per_sqft: number;
  };
  has_geo_verified_photo: boolean;
  landlord: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    avatar_url?: string;
    is_nid_verified: boolean;
    rating?: number;
  };
  photos: string[];
  photo_details?: PropertyPhotoDetail[];
  geo_tagged_photo?: {
    photo_url: string;
    exif_lat: number;
    exif_lng: number;
    captured_at: string;
    distance_discrepancy_meters: number;
    accuracy_meters: number;
  };
  amenities: string[];
  features?: PropertyFeatures;
  ai_description_generated?: boolean;
  alley_width_feet?: number;
  gas_supply?: string;
  waterlogging_risk?: string;
  water_quality?: string;
  night_safety_rating?: number;
  estimated_utilities_bdt?: number;
  total_move_in_cost_bdt?: number;
  created_at: string;
  updated_at: string;
  views_count: number;
  inquiries_count: number;
  moderation_notes?: string;
  rejection_reason?: string;
}

export interface NIDVerificationRequest {
  id: string;
  landlord_id: string;
  landlord_name: string;
  landlord_phone: string;
  landlord_email: string;
  nid_number: string;
  nid_type: 'smart_card' | 'old_format';
  nid_front_url: string;
  nid_back_url: string;
  live_selfie_url: string;
  ai_face_match_confidence: number; // 0 - 100%
  extracted_data?: {
    name_bn?: string;
    name_bangla?: string;
    name_en?: string;
    name_english?: string;
    father_name?: string;
    dob?: string;
    date_of_birth?: string;
    address?: string;
    blood_group?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewer_notes?: string;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string;
}

export interface GeoPhotoVerificationRequest {
  id: string;
  property_id: string;
  property_title: string;
  landlord_name: string;
  landlord_phone: string;
  photo_url: string;
  property_coordinates: {
    lat: number;
    lng: number;
    address: string;
  };
  exif_coordinates: {
    lat: number;
    lng: number;
  };
  distance_difference_meters: number;
  accuracy_meters: number;
  captured_at: string;
  is_camera_live: boolean;
  status: 'pending' | 'approved' | 'flagged_gps_mismatch' | 'rejected';
}

export type SpamFlagType = 
  | 'duplicate_photo'
  | 'suspicious_low_rent'
  | 'blacklisted_broker_phone'
  | 'plagiarized_description'
  | 'fake_phone_pattern';

export interface SpamReport {
  id: string;
  property_id: string;
  property_title: string;
  landlord_name: string;
  landlord_phone: string;
  rent_bdt: number;
  average_area_rent: number;
  flags: {
    type: SpamFlagType;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  ai_confidence_score: number; // 0 - 100%
  duplicate_match?: {
    original_property_id: string;
    original_property_title: string;
    original_landlord_name: string;
    image_hash_distance: number;
    matched_image_url: string;
    current_image_url: string;
  };
  detected_at: string;
  status: 'pending_review' | 'listing_banned' | 'landlord_blocked' | 'false_positive';
}

export interface HeatmapAreaPoint {
  area_id: string;
  area_name: string;
  thana: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  demand_searches_30d: number;
  active_supply_count: number;
  ratio_demand_supply: number; // High ratio = high opportunity
  average_rent_bdt: number;
  top_property_type: PropertyCategory;
  market_pressure: 'extreme_undersupply' | 'high_demand' | 'balanced' | 'oversupplied';
  search_velocity_growth_pct: number;
}

export interface RentLedgerTransaction {
  id: string;
  property_id: string;
  property_title: string;
  landlord_name: string;
  tenant_name: string;
  month: string;
  base_rent_bdt: number;
  service_charge_bdt: number;
  utility_bdt: number;
  total_paid_bdt: number;
  payment_method: 'bKash' | 'Nagad' | 'Bank_Transfer' | 'Cash';
  receipt_url?: string;
  platform_fee_collected: number;
  transaction_date: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface UsersAnalytics {
  total_users: number;
  tenants_count: number;
  landlords_count: number;
  dual_role_count: number;
  verified_landlords_count: number;
  flagged_brokers_count: number;
  growth_pct: number;
  active_contracts_count: number;
}

export interface PropertiesAnalytics {
  total_properties: number;
  active_listings: number;
  pending_approval: number;
  rented_in_vault: number;
  rejected: number;
  flagged_spam: number;
  growth_pct: number;
  average_rent_bdt: number;
}

export interface FinanceAnalytics {
  total_revenue_bdt: string | number;
  growth_pct: number;
  bills_paid_count: number;
  bills_pending_count: number;
  bills_overdue_count: number;
  collection_rate_pct: number;
  total_platform_commission_bdt: string | number;
}

export interface TopDemandSupplyArea {
  area_name: string;
  thana: string;
  demand_searches: number;
  active_supply: number;
  ratio_demand_supply: number;
  average_rent_bdt: number;
  market_pressure: 'extreme_undersupply' | 'high_demand' | 'balanced' | 'oversupplied' | string;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
  listings: number;
  new_users?: number;
}

export interface DashboardOverviewStats {
  total_users: number;
  users_growth_pct: number;
  active_listings: number;
  listings_growth_pct: number;
  pending_nid_count: number;
  pending_geo_count?: number;
  pending_spam_count: number;
  pending_property_count?: number;
  total_revenue_bdt: string | number;
  revenue_growth_pct: number;
  rent_agreements_generated: number;
  average_monthly_rent_bdt?: string | number;

  users_analytics?: UsersAnalytics;
  properties_analytics?: PropertiesAnalytics;
  finance_analytics?: FinanceAnalytics;

  fair_rent_breakdown: Record<string, number>;
  category_breakdown: Record<string, number>;
  monthly_revenue_history: MonthlyRevenuePoint[];
  top_demand_supply_areas?: TopDemandSupplyArea[];

  recent_activity?: {
    recent_pending_nids?: Array<{
      id: string;
      landlord_name: string;
      landlord_phone: string;
      nid_number: string;
      ai_face_match_confidence: number;
      submitted_at: string;
    }>;
    recent_pending_properties?: Array<{
      id: string;
      title: string;
      landlord_name: string;
      rent_amount: number;
      area_neighborhood: string;
      submitted_at: string;
    }>;
    recent_spam_reports?: Array<{
      id: string;
      property_title: string;
      landlord_name: string;
      ai_confidence_score: number;
      submitted_at: string;
    }>;
  };
}

export type AdminDashboardData = DashboardOverviewStats;
