// Outfit assembly: slots, completion, and generation. Pure logic — no I/O.

import {
  availabilityRule,
  colorRule,
  formalityRule,
  patternRule,
  recencyScore,
  statementColorRule,
  tempBandRule,
} from "./rules";
import type {
  Category,
  EngineItem,
  OutfitContext,
  Scored,
  TempBand,
} from "./types";

export interface Slot {
  category: Category;
  /** Tops only: which layer this slot holds. */
  layer?: "base" | "mid" | "outer";
  required: boolean;
}

const COLD_ENOUGH_FOR_OUTER: readonly TempBand[] = ["mild", "cool", "cold"];
const COLD_ENOUGH_FOR_MID: readonly TempBand[] = ["cool", "cold"];

/**
 * An outfit is a set of slots, not a fixed 5-tuple. Layer slots only exist
 * when the temperature calls for them — no jacket slot in an Austin summer.
 */
export function slotsFor(context: OutfitContext): Slot[] {
  const slots: Slot[] = [
    { category: "top", layer: "base", required: true },
    { category: "bottom", required: true },
    { category: "footwear", required: true },
    { category: "hat", required: false },
    { category: "accessory", required: false },
  ];
  if (COLD_ENOUGH_FOR_MID.includes(context.tempBand)) {
    slots.push({ category: "top", layer: "mid", required: false });
  }
  if (COLD_ENOUGH_FOR_OUTER.includes(context.tempBand)) {
    slots.push({
      category: "top",
      layer: "outer",
      required: context.tempBand === "cold",
    });
  }
  return slots;
}

function fitsSlot(item: EngineItem, slot: Slot): boolean {
  if (item.category !== slot.category) return false;
  if (slot.category !== "top") return true;
  // Un-layered tops count as base layer.
  return (item.layer ?? "base") === slot.layer;
}

/**
 * Score `candidate` against every already-chosen item plus the context.
 * Returns null when any hard rule fails; otherwise a score with the
 * human-readable reasons that justify the suggestion.
 */
export function scoreCandidate(
  candidate: EngineItem,
  chosen: EngineItem[],
  context: OutfitContext,
): Scored<EngineItem> | null {
  const hardChecks = [
    availabilityRule(candidate),
    tempBandRule(candidate, context),
    ...chosen.flatMap((c) => [
      colorRule(candidate, c),
      formalityRule(candidate, c),
    ]),
    patternRule([...chosen, candidate]),
    statementColorRule([...chosen, candidate]),
  ];
  if (Math.abs(candidate.formality - context.formality) > 1) {
    hardChecks.push({
      rule: "formality",
      ok: false,
      reason: `formality ${candidate.formality} doesn't fit the occasion (${context.formality})`,
    });
  }
  if (hardChecks.some((r) => !r.ok)) return null;

  const reasons = [...new Set(hardChecks.map((r) => r.reason))];
  const recency = recencyScore(candidate, context);
  if (recency < 1) reasons.push("worn recently, slightly penalized");
  return { value: candidate, score: recency, reasons };
}

/**
 * Suggest items of `category` that match every item in `chosen`.
 * Sorted best-first.
 */
export function suggestItems(
  chosen: EngineItem[],
  inventory: EngineItem[],
  category: Category,
  context: OutfitContext,
): Scored<EngineItem>[] {
  const chosenIds = new Set(chosen.map((i) => i.id));
  return inventory
    .filter((i) => i.category === category && !chosenIds.has(i.id))
    .map((i) => scoreCandidate(i, chosen, context))
    .filter((s): s is Scored<EngineItem> => s !== null)
    .sort((a, b) => b.score - a.score);
}

export interface GeneratedOutfit {
  items: Scored<EngineItem>[];
  /** Required slots that no available item could fill. */
  unfilled: Slot[];
}

/**
 * Complete an outfit: fill every empty slot for the context, keeping the
 * already-chosen items fixed. `generateOutfit` is the chosen = [] case.
 */
export function completeOutfit(
  chosen: EngineItem[],
  inventory: EngineItem[],
  context: OutfitContext,
): GeneratedOutfit {
  const picked: Scored<EngineItem>[] = [];
  const unfilled: Slot[] = [];
  const current = [...chosen];

  for (const slot of slotsFor(context)) {
    if (current.some((i) => fitsSlot(i, slot))) continue;
    const candidates = inventory.filter(
      (i) => fitsSlot(i, slot) && !current.some((c) => c.id === i.id),
    );
    const best = candidates
      .map((c) => scoreCandidate(c, current, context))
      .filter((s): s is Scored<EngineItem> => s !== null)
      .sort((a, b) => b.score - a.score)[0];
    if (best) {
      picked.push(best);
      current.push(best.value);
    } else if (slot.required) {
      unfilled.push(slot);
    }
  }
  return { items: picked, unfilled };
}

export function generateOutfit(
  inventory: EngineItem[],
  context: OutfitContext,
): GeneratedOutfit {
  return completeOutfit([], inventory, context);
}
