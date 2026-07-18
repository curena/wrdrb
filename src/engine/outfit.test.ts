import { describe, expect, it } from "vitest";
import { completeOutfit, generateOutfit, slotsFor, suggestItems } from "./outfit";
import type { EngineItem, OutfitContext } from "./types";

let nextId = 1;
function item(overrides: Partial<EngineItem> = {}): EngineItem {
  return {
    id: nextId++,
    name: `item ${nextId}`,
    category: "top",
    colors: ["black"],
    pattern: "solid",
    formality: 3,
    tempBands: ["hot", "warm", "mild"],
    availability: "clean",
    ...overrides,
  };
}

const hotAustin: OutfitContext = { tempBand: "hot", formality: 2 };
const coldDay: OutfitContext = { tempBand: "cold", formality: 2 };

describe("slotsFor", () => {
  it("has no outer-layer slot in hot weather", () => {
    const slots = slotsFor(hotAustin);
    expect(slots.some((s) => s.layer === "outer")).toBe(false);
    expect(slots.some((s) => s.layer === "mid")).toBe(false);
  });

  it("requires an outer layer in cold weather", () => {
    const outer = slotsFor(coldDay).find((s) => s.layer === "outer");
    expect(outer?.required).toBe(true);
  });
});

describe("suggestItems", () => {
  it("suggests matching bottoms for a chosen top, best first", () => {
    const redTop = item({ colors: ["red"], formality: 2 });
    const jeans = item({ category: "bottom", colors: ["denim"], formality: 2 });
    const clashing = item({
      category: "bottom",
      colors: ["yellow"],
      formality: 2,
    });
    const inLaundry = item({
      category: "bottom",
      colors: ["black"],
      formality: 2,
      availability: "laundry",
    });
    const results = suggestItems(
      [redTop],
      [jeans, clashing, inLaundry],
      "bottom",
      hotAustin,
    );
    expect(results.map((r) => r.value.id)).toEqual([jeans.id]);
    expect(results[0].reasons.length).toBeGreaterThan(0);
  });

  it("never suggests items worn recently over fresh ones", () => {
    const top = item({ formality: 2 });
    const wornYesterday = item({
      category: "footwear",
      formality: 2,
      wornOn: ["2026-07-17"],
    });
    const fresh = item({ category: "footwear", formality: 2 });
    const results = suggestItems([top], [wornYesterday, fresh], "footwear", {
      ...hotAustin,
      today: "2026-07-18",
    });
    expect(results[0].value.id).toBe(fresh.id);
    expect(results[1].value.id).toBe(wornYesterday.id);
  });
});

describe("completeOutfit / generateOutfit", () => {
  const summerInventory = [
    item({ category: "top", colors: ["white"], formality: 2 }),
    item({ category: "bottom", colors: ["denim"], formality: 2 }),
    item({ category: "footwear", colors: ["white"], formality: 2 }),
    item({ category: "hat", colors: ["beige"], formality: 2 }),
  ];

  it("generates a full outfit with no jacket in hot weather", () => {
    const outfit = generateOutfit(summerInventory, hotAustin);
    expect(outfit.unfilled).toEqual([]);
    const categories = outfit.items.map((i) => i.value.category);
    expect(categories).toContain("top");
    expect(categories).toContain("bottom");
    expect(categories).toContain("footwear");
    expect(outfit.items.every((i) => i.value.layer !== "outer")).toBe(true);
  });

  it("keeps chosen items fixed and fills around them", () => {
    const chosenTop = summerInventory[0];
    const outfit = completeOutfit([chosenTop], summerInventory, hotAustin);
    expect(outfit.items.every((i) => i.value.id !== chosenTop.id)).toBe(true);
    expect(outfit.items.some((i) => i.value.category === "bottom")).toBe(true);
  });

  it("reports unfilled required slots instead of guessing", () => {
    const noWinterCoat = [
      item({ category: "top", tempBands: ["cold"], formality: 2 }),
      item({ category: "bottom", tempBands: ["cold"], formality: 2 }),
      item({ category: "footwear", tempBands: ["cold"], formality: 2 }),
    ];
    const outfit = generateOutfit(noWinterCoat, coldDay);
    expect(outfit.unfilled.some((s) => s.layer === "outer")).toBe(true);
  });
});
