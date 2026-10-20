import { describe, expect, it } from "vitest";
import { canonicalFunction, functionDefaults, presetFunctions } from "./presets";

describe("presets", () => {
  it("offers functions in the interface language", () => {
    expect(presetFunctions("wedding", "en")[0]).toBe("Haldi");
    expect(presetFunctions("wedding", "ta")[0]).toBe("மஞ்சள் நீராட்டு");
    expect(presetFunctions("birthday", "te")).toEqual(["పుట్టినరోజు వేడుక"]);
  });

  it("recognises translated names as the same function", () => {
    expect(canonicalFunction("మెహందీ")).toBe("Mehendi");
    expect(canonicalFunction(" sangeet ")).toBe("Sangeet");
    expect(canonicalFunction("Kolam workshop")).toBeUndefined();
    expect(functionDefaults("संगीत")).toEqual(functionDefaults("Sangeet"));
  });
});
