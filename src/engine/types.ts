// Pure domain types for the matching engine. No I/O, no framework imports.

export type Category = "top" | "bottom" | "hat" | "accessory" | "footwear";

export type Pattern =
  | "solid"
  | "striped"
  | "plaid"
  | "floral"
  | "graphic"
  | "other";

export type Availability =
  | "clean"
  | "laundry"
  | "cleaners"
  | "storage"
  | "lent";

export type TempBand = "hot" | "warm" | "mild" | "cool" | "cold";

export type Layer = "base" | "mid" | "outer";

// Neutrals match everything; hue colors follow the color wheel.
export type Neutral =
  | "black"
  | "white"
  | "gray"
  | "navy"
  | "beige"
  | "brown"
  | "denim";

export type Hue =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink";

export type Color = Neutral | Hue;

export interface EngineItem {
  id: number;
  name: string;
  category: Category;
  /** Ordered, dominant color first. */
  colors: Color[];
  pattern: Pattern;
  /** 1 (very casual) – 5 (very formal). */
  formality: number;
  tempBands: TempBand[];
  /** Only meaningful for tops. */
  layer?: Layer;
  availability: Availability;
  /** ISO dates this item was worn, most recent first. */
  wornOn?: string[];
}

export interface OutfitContext {
  tempBand: TempBand;
  /** Target formality 1–5; matched items must be within 1. */
  formality: number;
  /** Today's date (ISO) for recency scoring. Defaults to now. */
  today?: string;
}

export interface RuleResult {
  rule: string;
  ok: boolean;
  reason: string;
}

export interface Scored<T> {
  value: T;
  /** Higher is better. Hard-rule failures never appear in results. */
  score: number;
  reasons: string[];
}
