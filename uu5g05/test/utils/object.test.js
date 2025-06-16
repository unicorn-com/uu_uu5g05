import { Utils } from "uu5g05";

describe("[uu5g05] Utils.Object", () => {
  it("deepEqual(a, b)", () => {
    expect(Utils.Object.deepEqual(false, false)).toBe(true);
    expect(Utils.Object.deepEqual(true, true)).toBe(true);
    expect(Utils.Object.deepEqual(true, false)).toBe(false);
    expect(Utils.Object.deepEqual(0, 0)).toBe(true);
    expect(Utils.Object.deepEqual(0, false)).toBe(false);
    expect(Utils.Object.deepEqual(0, 1)).toBe(false);
    expect(Utils.Object.deepEqual(1, "1")).toBe(false);
    expect(Utils.Object.deepEqual("1", "1")).toBe(true);
    expect(Utils.Object.deepEqual({ a: { b: 0 } }, { a: { b: 0 } })).toBe(true);
    expect(Utils.Object.deepEqual({ a: { b: 0 } }, { a: { B: 0 } })).toBe(false);
    expect(Utils.Object.deepEqual({ a: [0, 10] }, { a: [0, 10] })).toBe(true);
    expect(Utils.Object.deepEqual({ a: () => 0 }, { a: () => 0 })).toBe(false);
    let fn = () => 0;
    let date1 = new Date();
    let date2 = new Date(date1);
    expect(
      Utils.Object.deepEqual(
        { a: fn, b: [1, "2", { 1: [] }, fn, false, NaN, /a/, date1] },
        { b: [1, "2", { 1: [] }, fn, false, NaN, /a/, date2], a: fn },
      ),
    ).toBe(true);
    expect(Utils.Object.deepEqual({ length: 0 }, [])).toBe(false);
  });

  it("shallowEqual(a, b)", () => {
    expect(Utils.Object.shallowEqual(false, false)).toBe(true);
    expect(Utils.Object.shallowEqual(true, true)).toBe(true);
    expect(Utils.Object.shallowEqual(true, false)).toBe(false);
    expect(Utils.Object.shallowEqual(0, 0)).toBe(true);
    expect(Utils.Object.shallowEqual(0, false)).toBe(false);
    expect(Utils.Object.shallowEqual(0, 1)).toBe(false);
    expect(Utils.Object.shallowEqual(1, "1")).toBe(false);
    expect(Utils.Object.shallowEqual("1", "1")).toBe(true);
    expect(Utils.Object.shallowEqual({ a: 0 }, { a: 0 })).toBe(true);
    expect(Utils.Object.shallowEqual({ a: { b: 0 } }, { a: { b: 0 } })).toBe(false);
    let obj = { b: 0 };
    let arr = [0, 10];
    expect(Utils.Object.shallowEqual({ a: obj }, { a: obj })).toBe(true);
    expect(Utils.Object.shallowEqual({ a: arr }, { a: arr })).toBe(true);
    expect(Utils.Object.shallowEqual({ a: () => 0 }, { a: () => 0 })).toBe(false);
    let fn = () => 0;
    let date1 = new Date();
    let regexp = /a/;
    expect(
      Utils.Object.shallowEqual(
        { a: fn, b: 1, c: "2", d: fn, e: false, f: NaN, g: regexp, h: date1 },
        { a: fn, b: 1, c: "2", d: fn, e: false, f: NaN, g: regexp, h: date1 },
      ),
    ).toBe(true);
    expect(Utils.Object.shallowEqual({ length: 0 }, [])).toBe(false);
  });

  it("matchByKey(object, key)", () => {
    const object = {
      "*/invalidDtoIn": "b",
      "uu-jokes-main/*": "c",
      "uu-*": "d",
      "uu-jokes-main/invalidDtoIn": "a",
    };
    expect(Utils.Object.matchByKey(object, "uu-jokes-main/invalidDtoIn")).toBe("a"); // exact match is always preferred
    expect(Utils.Object.matchByKey(object, "uu-app-main/invalidDtoIn")).toBe("b"); // 1st matching inexact match
    expect(Utils.Object.matchByKey(object, "uu-jokes-main/notFound")).toBe("c");
    expect(Utils.Object.matchByKey(object, "uu-app-main/notFound")).toBe("d");
    expect(Utils.Object.matchByKey(object, "uso-app-main/notFound")).toBe(undefined);
  });
});
