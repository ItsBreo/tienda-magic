// Interfaces centralizadas para el proyecto Magic Shop

export interface Card {
  id: number;
  name: string;
  image_url?: string;
  rarity: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  set_code?: string;
  collector_number?: string;
  scryfall_id?: string;
  price_eur?: number;
  price_usd?: number;
  mana_value?: number;
  card_set_id?: number;
}

export interface Pack {
  id: number;
  name: string;
  price: number;
  card_set_id: string;
  type: string;
  image_url?: string;
  config: {
    commons?: number;
    uncommons?: number;
    rares?: number;
    mythics?: number;
    foil?: boolean;
    total_cards?: number;
    description?: string;
  };
}

export interface CardSet {
  id: number;
  code: string;
  name: string;
  released_at?: string;
  card_count: number;
  icon_svg_uri?: string;
  type?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Tipos de rareza para validación
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'mythic' | 'special';

// Tipos de pack para validación
export type PackType = 'expansion' | 'master' | 'collector' | 'jumpstart' | 'expedition' | 'core';
