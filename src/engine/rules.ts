// The named matching rules. Every rule is a pure function returning a
// RuleResult whose `reason` is user-facing — suggestions must be explainable.

import type {
  Color,
  EngineItem,
  Hue,
  Neutral,
  OutfitContext,
  RuleResult,
} from "./types";

const NEUTRALS: readonly Neutral[] = [
  "black",
  "white",
  "gray",
  "navy",
  "beige",
  "brown",
  "denim",
];

// Position on a 7-step color wheel. Adjacent (±1) = analogous,
// opposite-ish (±3 or ±4) = complementary.
const WHEEL: Record<Hue, number> = {
  red: 0,
  orange: 1,
  yellow: 2,
  green: 3,
  blue: 4,
  purple: 5,
  pink: 6,
};

const BOLD_PATTERNS = new Set(["striped", "plaid", "floral", "graphic"]);

export function isNeutral(color: Color): color is Neutral {
  return (NEUTRALS as readonly string[]).includes(color);
}

function huesRelate(a: Hue, b: Hue): boolean {
  if (a === b) return true;
  const distance = Math.abs(WHEEL[a] - WHEEL[b]);
  const wrapped = Math.min(distance, 7 - distance);
  return wrapped === 1 || wrapped === 3;
}

/** Neutrals match everything; hues must be identical, analogous, or complementary. */
export function colorRule(a: EngineItem, b: EngineItem): RuleResult {
  const aHues = a.colors.filter((c): c is Hue => !isNeutral(c));
  const bHues = b.colors.filter((c): c is Hue => !isNeutral(c));
  if (aHues.length === 0 || bHues.length === 0) {
    return {
      rule: "color",
      ok: true,
      reason: "neutral colors go with anything",
    };
  }
  const related = aHues.some((ha) => bHues.some((hb) => huesRelate(ha, hb)));
  return related
    ? {
        rule: "color",
        ok: true,
        reason: `${aHues[0]} and ${bHues[0]} sit well together on the color wheel`,
      }
    : {
        rule: "color",
        ok: false,
        reason: `${aHues[0]} clashes with ${bHues[0]}`,
      };
}

/** Items must be within 1 formality point of each other. */
export function formalityRule(a: EngineItem, b: EngineItem): RuleResult {
  const gap = Math.abs(a.formality - b.formality);
  return gap <= 1
    ? { rule: "formality", ok: true, reason: "similar formality" }
    : {
        rule: "formality",
        ok: false,
        reason: `formality mismatch (${a.formality} vs ${b.formality})`,
      };
}

/** Item must be wearable in the target temperature band. */
export function tempBandRule(
  item: EngineItem,
  context: OutfitContext,
): RuleResult {
  return item.tempBands.includes(context.tempBand)
    ? { rule: "tempBand", ok: true, reason: `suits ${context.tempBand} weather` }
    : {
        rule: "tempBand",
        ok: false,
        reason: `not suited to ${context.tempBand} weather`,
      };
}

/** Hard filter: only clean items can be recommended. */
export function availabilityRule(item: EngineItem): RuleResult {
  return item.availability === "clean"
    ? { rule: "availability", ok: true, reason: "available" }
    : {
        rule: "availability",
        ok: false,
        reason: `unavailable (${item.availability})`,
      };
}

/** At most one bold pattern across the whole outfit. */
export function patternRule(outfit: EngineItem[]): RuleResult {
  const bold = outfit.filter((i) => BOLD_PATTERNS.has(i.pattern));
  return bold.length <= 1
    ? { rule: "pattern", ok: true, reason: "patterns don't compete" }
    : {
        rule: "pattern",
        ok: false,
        reason: `too many bold patterns (${bold.map((i) => i.name).join(", ")})`,
      };
}

/** Limit the outfit to one statement (non-neutral dominant) color family. */
export function statementColorRule(outfit: EngineItem[]): RuleResult {
  const statements = new Set<Hue>();
  for (const item of outfit) {
    const dominant = item.colors[0];
    if (dominant && !isNeutral(dominant)) statements.add(dominant);
  }
  // Related hues (analogous/complementary) count as one deliberate statement.
  const hues = [...statements];
  const allRelated = hues.every((a) => hues.every((b) => huesRelate(a, b)));
  return statements.size <= 1 || allRelated
    ? { rule: "statementColor", ok: true, reason: "one clear statement color" }
    : {
        rule: "statementColor",
        ok: false,
        reason: `competing statement colors (${hues.join(", ")})`,
      };
}

/** Soft penalty (0..1) for recent wear; 0 = worn today, 1 = not recently worn. */
export function recencyScore(
  item: EngineItem,
  context: OutfitContext,
  windowDays = 7,
): number {
  const lastWorn = item.wornOn?.[0];
  if (!lastWorn) return 1;
  const today = context.today ? new Date(context.today) : new Date();
  const days =
    (today.getTime() - new Date(lastWorn).getTime()) / (1000 * 60 * 60 * 24);
  if (days >= windowDays) return 1;
  return Math.max(0, days / windowDays);
}
