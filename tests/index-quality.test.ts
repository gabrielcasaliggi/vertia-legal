import { describe, expect, it } from "vitest";
import {
  evaluateIndexQuality,
  MIN_USABLE_INDEX_TEXT_LENGTH,
} from "@/lib/pdf/index-quality";

describe("evaluateIndexQuality", () => {
  it("marca texto corto como insuficiente", () => {
    expect(evaluateIndexQuality("texto corto")).toBe("insufficient_text");
  });

  it("marca texto suficiente como ok", () => {
    const text = "a".repeat(MIN_USABLE_INDEX_TEXT_LENGTH);
    expect(evaluateIndexQuality(text)).toBe("ok");
  });
});
