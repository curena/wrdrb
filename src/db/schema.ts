import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// Enums are stored as text; the engine's types in src/engine/types.ts are the
// source of truth for allowed values.

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(), // top | bottom | hat | accessory | footwear
  colors: text("colors", { mode: "json" }).notNull().$type<string[]>(), // ordered, dominant first
  pattern: text("pattern").notNull().default("solid"),
  formality: integer("formality").notNull().default(3), // 1 (casual) – 5 (formal)
  tempBands: text("temp_bands", { mode: "json" })
    .notNull()
    .$type<string[]>(), // hot | warm | mild | cool | cold
  layer: text("layer"), // for tops: base | mid | outer; null otherwise
  availability: text("availability").notNull().default("clean"),
  purchaseDate: text("purchase_date"),
  purchasePrice: real("purchase_price"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const photos = sqliteTable("photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  extractedColors: text("extracted_colors", { mode: "json" }).$type<string[]>(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const outfits = sqliteTable("outfits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  rating: integer("rating"), // 1–5, null until rated
  favorite: integer("favorite", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const outfitItems = sqliteTable("outfit_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  outfitId: integer("outfit_id")
    .notNull()
    .references(() => outfits.id, { onDelete: "cascade" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
});

export const wearLogs = sqliteTable("wear_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  outfitId: integer("outfit_id").references(() => outfits.id, {
    onDelete: "set null",
  }),
  wornOn: text("worn_on").notNull(), // ISO date
  context: text("context"), // free-form: "work", "wedding", ...
});

// Write-only in V1; consumed by the learning loop in V2.
export const suggestionFeedback = sqliteTable("suggestion_feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemIds: text("item_ids", { mode: "json" }).notNull().$type<number[]>(),
  action: text("action").notNull(), // accepted | rejected | tweaked
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
