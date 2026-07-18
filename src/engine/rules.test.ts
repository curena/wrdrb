import { describe, expect, it } from "vitest";
import {
  availabilityRule,
  colorRule,
  formalityRule,
  patternRule,
  recencyScore,
  statementColorRule,
  tempBandRule,
} from "./rules";
import type { EngineItem, OutfitContext } from "./types";

let nextId = 1;
function item(overrides: Partial<EngineItem> = {}): EngineItem {
  return {
    id: nextId++,
    name: "test item",
    category: "top",
    colors: ["black"],
    pattern: "solid",
    formality: 3,
    tempBands: ["mild"],
    availability: "clean",
    ...overrides,
  };
}

const context: OutfitContext = { tempBand: "mild", formality: 3 };

describe("colorRule", () => {
  it("lets neutrals match anything", () => {
    const black = item({ colors: ["black"] });
    const red = item({ colors: ["red"] });
    expect(colorRule(black, red).ok).toBe(true);
  });

  it("accepts analogous hues", () => {
    const blue = item({ colors: ["blue"] });
    const green = item({ colors: ["green"] });
    expect(colorRule(blue, green).ok).toBe(true);
  });

  it("accepts complementary hues", () => {
    const red = item({ colors: ["red"] });
    const green = item({ colors: ["green"] });
    expect(colorRule(red, green).ok).toBe(true);
  });

  it("rejects clashing hues", () => {
    const red = item({ colors: ["red"] });
    const yellow = item({ colors: ["yellow"] });
    const result = colorRule(red, yellow);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("clashes");
  });
});

describe("formalityRule", () => {
  it("accepts a 1-point gap and rejects a 2-point gap", () => {
    const suitJacket = item({ formality: 5 });
    const dressShirt = item({ formality: 4 });
    const sneakers = item({ formality: 2, category: "footwear" });
    expect(formalityRule(suitJacket, dressShirt).ok).toBe(true);
    expect(formalityRule(suitJacket, sneakers).ok).toBe(false);
  });
});

describe("tempBandRule", () => {
  it("rejects items outside the target band", () => {
    const parka = item({ tempBands: ["cold"] });
    expect(tempBandRule(parka, { ...context, tempBand: "hot" }).ok).toBe(false);
    expect(tempBandRule(parka, { ...context, tempBand: "cold" }).ok).toBe(true);
  });
});

describe("availabilityRule", () => {
  it("only passes clean items", () => {
    expect(availabilityRule(item({ availability: "clean" })).ok).toBe(true);
    expect(availabilityRule(item({ availability: "laundry" })).ok).toBe(false);
    expect(availabilityRule(item({ availability: "storage" })).ok).toBe(false);
  });
});

describe("patternRule", () => {
  it("allows one bold pattern but not two", () => {
    const plaid = item({ pattern: "plaid" });
    const solid = item({ pattern: "solid" });
    const floral = item({ pattern: "floral" });
    expect(patternRule([plaid, solid]).ok).toBe(true);
    expect(patternRule([plaid, floral]).ok).toBe(false);
  });
});

describe("statementColorRule", () => {
  it("allows one statement color plus neutrals", () => {
    const redTop = item({ colors: ["red"] });
    const blackPants = item({ colors: ["black"], category: "bottom" });
    expect(statementColorRule([redTop, blackPants]).ok).toBe(true);
  });

  it("rejects unrelated competing statement colors", () => {
    const redTop = item({ colors: ["red"] });
    const yellowShoes = item({ colors: ["yellow"], category: "footwear" });
    expect(statementColorRule([redTop, yellowShoes]).ok).toBe(false);
  });
});

describe("recencyScore", () => {
  it("penalizes recently worn items and forgives old wears", () => {
    const todayCtx: OutfitContext = { ...context, today: "2026-07-18" };
    const wornYesterday = item({ wornOn: ["2026-07-17"] });
    const wornLastMonth = item({ wornOn: ["2026-06-01"] });
    const neverWorn = item();
    expect(recencyScore(wornYesterday, todayCtx)).toBeLessThan(0.5);
    expect(recencyScore(wornLastMonth, todayCtx)).toBe(1);
    expect(recencyScore(neverWorn, todayCtx)).toBe(1);
  });
});
