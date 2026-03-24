export interface Mug {
  id: number;
  name: string;
  home_floor: number;
  personality: string;
  personality_prompt: string;
  avatar_emoji: string;
  image_url: string | null;
  chat_image_url: string | null;
  voice_id: string | null;
  created_at: string;
}

export interface Scan {
  id: number;
  mug_id: number;
  floor: number;
  scanner_name: string;
  is_rescue: boolean;
  created_at: string;
}

export interface MugMessage {
  id: number;
  mug_id: number;
  author: string;
  message: string;
  created_at: string;
}

export interface MugProfile extends Mug {
  current_floor: number | null;
  last_seen: string | null;
  days_away: number;
  total_scans: number;
  recent_scans: Scan[];
  recent_messages: MugMessage[];
  selfies: Selfie[];
}

export interface Selfie {
  id: number;
  mug_id: number;
  image_url: string;
  author: string;
  created_at: string;
}

export interface ActivityEntry {
  id: number;
  mug_id: number;
  floor: number;
  scanner_name: string;
  is_rescue: boolean;
  created_at: string;
  mug_name: string;
  mug_home_floor: number;
  mug_personality: string;
  mug_avatar_emoji: string;
  mug_image_url: string | null;
}

export interface MugOnFloor {
  id: number;
  name: string;
  home_floor: number;
  avatar_emoji: string;
  image_url: string | null;
  current_floor: number;
}

export interface LeaderboardEntry {
  floor: number;
  mugs_hoarded: number;
  mugs_missing: number;
}

export interface RescuerEntry {
  scanner_name: string;
  rescue_count: number;
}
