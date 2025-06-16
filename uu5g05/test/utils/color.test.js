import { Utils } from "uu5g05";

describe("[uu5g05] Utils.Color", () => {
  it("toRgba(cssColor)", async () => {
    expect(Utils.Color.toRgba("#f00")).toEqual([255, 0, 0, 1]);
    expect(Utils.Color.toRgba("#ab0180")).toEqual([171, 1, 128, 1]);
    let result = Utils.Color.toRgba("#ab010080");
    expect(result.slice(0, 3)).toEqual([171, 1, 0]);
    expect(result[3]).toBeCloseTo(0.5);
    expect(Utils.Color.toRgba("transparent")).toEqual([0, 0, 0, 0]);
  });

  it("toHex(cssColor, preserveAlpha)", async () => {
    expect(Utils.Color.toHex("#f00")).toBe("#ff0000");
    expect(Utils.Color.toHex("rgb(171, 1, 128)")).toBe("#ab0180");
    expect(Utils.Color.toHex("rgb(171,1,128)")).toBe("#ab0180");
    expect(Utils.Color.toHex("rgba(171, 1, 0, 128)")).toBe("#ab0100");
    // NOTE Commented out because of Jest (JSDOM) difference in color normalization vs. browser.
    // expect(Utils.Color.toHex("rgba(171, 1, 0, 128)", true)).toBe("#ab010080");
    expect(Utils.Color.toHex("transparent", true)).toBe("#00000000");
  });

  it("isLight(cssColor)", async () => {
    expect(Utils.Color.isLight("#000")).toBe(false);
    expect(Utils.Color.isLight("#fff")).toBe(true);

    expect(Utils.Color.isLight("#f88")).toBe(true);
    expect(Utils.Color.isLight("#0f0")).toBe(true);
    expect(Utils.Color.isLight("#666")).toBe(false);
  });
});
