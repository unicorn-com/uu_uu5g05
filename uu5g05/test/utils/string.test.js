import { Utils } from "uu5g05";

describe("[uu5g05] Utils.String", () => {
  it("generateId(length); should return ID with given length", () => {
    let result = Utils.String.generateId.orig();
    expect(result).toMatch(/^[a-f0-9]{32}$/);

    result = Utils.String.generateId.orig(10);
    expect(result).toMatch(/^[a-f0-9]{10}$/);
  });

  it("format(string, ...params); should recognize %s, %d, %%", () => {
    let result = Utils.String.format("a %d b %s %% c", 10, "text");
    expect(result).toBe("a 10 b text % c");
  });

  it("format(string, ...params); should recognize %s, %d, %% - serialize unusual values (arrays, null, ...)", () => {
    let result = Utils.String.format(
      "a zero:%d b array:%s c null:%s regexp:%s symbol:%s missingParam:%s",
      0,
      ["Y", "Z"],
      null,
      /./,
      Symbol.for("s"),
    );
    expect(result).toBe("a zero:0 b array:Y,Z c null:null regexp:/./ symbol:Symbol(s) missingParam:undefined");
  });

  it("format(string, ...params); should recognize {0}, {1}, ...", () => {
    let result = Utils.String.format("a {0} b {1} {abc} c", 10, "text");
    expect(result).toBe("a 10 b text {abc} c");
  });

  it("format(string, ...params); should recognize {0}, {1}, ... - serialize unusual values (arrays, null, ...)", () => {
    let result = Utils.String.format(
      "a zero:{0} b array:{2} c null:{1} regexp:{3} symbol:{4} missingParam:{5}",
      0,
      null,
      ["Y", "Z"],
      /./,
      Symbol.for("s"),
    );
    expect(result).toBe("a zero:0 b array:Y,Z c null:null regexp:/./ symbol:Symbol(s) missingParam:{5}");
  });

  it("format(string, obj); should recognize ${key}, ${key2}, ...", () => {
    let result = Utils.String.format("a ${key} b ${key2} c", { key: 10, key2: "text" });
    expect(result).toBe("a 10 b text c");
  });

  it("format(string, obj); should recognize ${key}, ${key2}, ... - serialize unusual values (arrays, null, ...)", () => {
    let result = Utils.String.format(
      "a zero:${kZero} b array:${kArray} c null:${kNull} regexp:${kRegExp} symbol:${kSymbol} missingParam:${kBad}",
      {
        kZero: 0,
        kNull: null,
        kArray: ["Y", "Z"],
        kRegExp: /./,
        kSymbol: Symbol.for("s"),
      },
    );
    expect(result).toBe("a zero:0 b array:Y,Z c null:null regexp:/./ symbol:Symbol(s) missingParam:undefined");
  });
});
