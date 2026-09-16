export type ListingStatus = "draft" | "pending" | "active" | "rejected" | "sold" | "archived";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface ProductListing {
  id: string;
  title: string;
  price_kes: number;
  location: string | null;
  status: ListingStatus;
  created_at: string;
  seller_id: string;
  seller_name?: string;
  seller_rating?: number;
  cover_image_url?: string | null;
  is_favorited?: boolean;
}

export interface HostelListing {
  id: string;
  name: string;
  price_per_month: number;
  location: string;
  distance_from_campus_km: number | null;
  room_type: string | null;
  gender_preference: string | null;
  has_wifi: boolean;
  has_water: boolean;
  has_electricity: boolean;
  has_security: boolean;
  cover_image_url?: string | null;
  rating?: number;
}

export interface ServiceListing {
  id: string;
  title: string;
  category: string;
  starting_price_kes: number | null;
  provider_name?: string;
  rating?: number;
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface VendorListing {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  offers_delivery: boolean;
  avg_prep_minutes: number | null;
  logo_url?: string | null;
  rating?: number;
}

export interface MenuItemListing {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price_kes: number;
  image_url: string | null;
  is_available: boolean;
}

export interface CartLine {
  menuItemId: string;
  name: string;
  unitPriceKes: number;
  quantity: number;
}

export type ResourceCategory =
  | "notes"
  | "revision_materials"
  | "past_papers"
  | "study_guides"
  | "course_materials";

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  notes: "Notes",
  revision_materials: "Revision materials",
  past_papers: "Past papers",
  study_guides: "Study guides",
  course_materials: "Course materials",
};

export interface ResourceListing {
  id: string;
  title: string;
  description: string | null;
  category: ResourceCategory | null;
  school: string | null;
  department: string | null;
  course: string | null;
  unit: string | null;
  storage_path: string;
  download_count: number;
  created_at: string;
  uploader_id?: string;
  uploader_name?: string;
}

export type EventCategory =
  | "clubs"
  | "sports"
  | "entertainment"
  | "academic"
  | "career"
  | "business"
  | "other";

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  clubs: "Clubs",
  sports: "Sports",
  entertainment: "Entertainment",
  academic: "Academic",
  career: "Career",
  business: "Business",
  other: "Other",
};

export interface CampusEvent {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory | null;
  image_url: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  organizer_id?: string | null;
  organizer_name?: string;
  is_saved?: boolean;
}

export interface ConversationSummary {
  id: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  contextType: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}
