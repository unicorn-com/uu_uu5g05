import { Utils } from "uu5g05";
import { Utils as TestUtils } from "uu5g05-test";

describe("[uu5g05] Utils.NestingLevel", () => {
  it("buildList(from, to)", async () => {
    let list = Utils.NestingLevel.valueList;
    expect(Utils.NestingLevel.buildList(list[0], list[list.length - 1])).toEqual(list);
    expect(Utils.NestingLevel.buildList(list[1], list[list.length - 2])).toEqual(list.slice(1, list.length - 1));
    expect(Utils.NestingLevel.buildList(list[2], list[2])).toEqual([list[2]]);
  });

  it("buildList(from) - should return levels from 'from' upto smallest level", async () => {
    let list = Utils.NestingLevel.valueList;
    expect(Utils.NestingLevel.buildList(list[0])).toEqual(list);
    expect(Utils.NestingLevel.buildList(list[2])).toEqual(list.slice(2));
  });

  it("buildList() - should return all levels", async () => {
    let list = Utils.NestingLevel.valueList;
    expect(Utils.NestingLevel.buildList()).toEqual(list);
  });

  it("getNestingLevel(props, statics)", async () => {
    let level;
    TestUtils.omitConsoleLogs('Nesting level "asdf" is not a supported value.');

    level = Utils.NestingLevel.getNestingLevel({ nestingLevel: "area" }, { nestingLevel: ["boxCollection", "box"] });
    expect(level).toBe("boxCollection");

    level = Utils.NestingLevel.getNestingLevel(
      { nestingLevel: "areaCollection" },
      { nestingLevel: ["boxCollection", "box"] },
    );
    expect(level).toBe("boxCollection");

    level = Utils.NestingLevel.getNestingLevel(
      { nestingLevel: "boxCollection" },
      { nestingLevel: ["boxCollection", "box"] },
    );
    expect(level).toBe("boxCollection");

    level = Utils.NestingLevel.getNestingLevel({ nestingLevel: "box" }, { nestingLevel: ["boxCollection", "box"] });
    expect(level).toBe("box");

    level = Utils.NestingLevel.getNestingLevel(
      { nestingLevel: "spotCollection" },
      { nestingLevel: ["boxCollection", "box"] },
    );
    expect(level).toBeFalsy();

    level = Utils.NestingLevel.getNestingLevel({ nestingLevel: "asdf" }, { nestingLevel: ["boxCollection", "box"] });
    expect(level).toBe("boxCollection");

    level = Utils.NestingLevel.getNestingLevel({ nestingLevel: "box" }, {});
    expect(level).toBe("box");

    level = Utils.NestingLevel.getNestingLevel({ nestingLevel: "spotCollection" }, {});
    expect(level).toBe("spotCollection");

    level = Utils.NestingLevel.getNestingLevel({ nestingLevel: "asdf" }, {});
    expect(level).toBe("areaCollection"); // biggest default is areaCollection (uve && route are used only if explicitly set)

    level = Utils.NestingLevel.getNestingLevel({ nestingLevel: "uve" }, {});
    expect(level).toBe("uve");

    level = Utils.NestingLevel.getNestingLevel({ nestingLevel: "route" }, {});
    expect(level).toBe("route");

    level = Utils.NestingLevel.getNestingLevel({}, { nestingLevel: ["boxCollection", "box"] });
    expect(level).toBe("boxCollection");

    level = Utils.NestingLevel.getNestingLevel({}, { nestingLevel: ["box", "boxCollection"] });
    expect(level).toBe("boxCollection");

    level = Utils.NestingLevel.getNestingLevel({}, {});
    expect(level).toBe("areaCollection"); // biggest default is areaCollection (uve && route are used only if explicitly set)
  });

  it("getChildNestingLevel(props, statics)", async () => {
    let level;
    TestUtils.omitConsoleLogs('Nesting level "asdf" is not a supported value.');

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "area" },
      { nestingLevel: ["boxCollection", "box"] },
    );
    expect(level).toBe("boxCollection");

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "areaCollection" },
      { nestingLevel: ["boxCollection", "box"] },
    );
    expect(level).toBe("boxCollection");

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "boxCollection" },
      { nestingLevel: ["boxCollection", "box"] },
    );
    expect(level).toBe("boxCollection");

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "box" },
      { nestingLevel: ["boxCollection", "box"] },
    );
    expect(level).toBe("spotCollection");

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "spotCollection" },
      { nestingLevel: ["boxCollection", "box"] },
    );
    expect(level).toBeFalsy();

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "asdf" },
      { nestingLevel: ["boxCollection", "box"] },
    );
    expect(level).toBe("boxCollection");

    level = Utils.NestingLevel.getChildNestingLevel({ nestingLevel: "box" }, {});
    expect(level).toBe("spotCollection");

    level = Utils.NestingLevel.getChildNestingLevel({ nestingLevel: "spotCollection" }, {});
    expect(level).toBe("spotCollection");

    level = Utils.NestingLevel.getChildNestingLevel({ nestingLevel: "asdf" }, {});
    expect(level).toBe("areaCollection"); // biggest default is areaCollection (uve && route are used only if explicitly set)

    level = Utils.NestingLevel.getChildNestingLevel({ nestingLevel: "uve" }, {});
    expect(level).toBe("route");

    level = Utils.NestingLevel.getChildNestingLevel({}, {});
    expect(level).toBe("areaCollection"); // biggest default is areaCollection (uve && route are used only if explicitly set)
  });

  it("compare(levelA, levelB)", async () => {
    let list = Utils.NestingLevel.valueList;
    for (let i = 0; i < list.length; i++) {
      let levelA = list[i];
      for (let j = 0; j < list.length; j++) {
        let levelB = list[j];
        let result = Utils.NestingLevel.compare(levelA, levelB);
        if (i < j) expect(result).toBeLessThan(0);
        else if (i > j) expect(result).toBeGreaterThan(0);
        else expect(result).toBe(0);
      }
    }
  });

  it("compare(levelA, invalidOrEmptyLevel) - should treat invalid/empty level as 'inline'", async () => {
    expect(Utils.NestingLevel.compare("inline", "asdf")).toBe(0);
    expect(Utils.NestingLevel.compare("inline")).toBe(0);
  });
});

// TODO Next major - remove.
describe("[uu5g05] Utils.NestingLevel with deprecated values", () => {
  it("buildList(from[, to])", async () => {
    expect(Utils.NestingLevel.buildList("spa", "inline")).toEqual([
      "spa",
      "page",
      "bigBoxCollection",
      "bigBox",
      "boxCollection",
      "box",
      "smallBoxCollection",
      "smallBox",
      "inline",
    ]);
    expect(Utils.NestingLevel.buildList("bigBox", "box")).toEqual(["bigBox", "boxCollection", "box"]);
    expect(Utils.NestingLevel.buildList("bigBox", "area")).toEqual(["bigBox"]);
    expect(Utils.NestingLevel.buildList("bigBox", "spotCollection")).toEqual([
      "bigBox",
      "boxCollection",
      "box",
      "smallBoxCollection",
    ]);
    expect(Utils.NestingLevel.buildList("smallBox")).toEqual(["smallBox", "inline"]);
  });

  it("getNestingLevel(props, statics)", async () => {
    let level;
    TestUtils.omitConsoleLogs('Nesting level "asdf" is not a supported value.');

    // should return legacy nesting level values only if statics.nestingLevel contains legacy value
    level = Utils.NestingLevel.getNestingLevel(
      { nestingLevel: "page" },
      { nestingLevel: ["bigBoxCollection", "bigBox"] },
    );
    expect(level).toBe("bigBoxCollection");

    level = Utils.NestingLevel.getNestingLevel(
      { nestingLevel: "bigBoxCollection" },
      { nestingLevel: ["bigBoxCollection", "bigBox"] },
    );
    expect(level).toBe("bigBoxCollection");

    level = Utils.NestingLevel.getNestingLevel(
      { nestingLevel: "areaCollection" },
      { nestingLevel: ["bigBoxCollection", "bigBox"] },
    );
    expect(level).toBe("bigBoxCollection");

    level = Utils.NestingLevel.getNestingLevel(
      { nestingLevel: "bigBox" },
      { nestingLevel: ["bigBoxCollection", "bigBox"] },
    );
    expect(level).toBe("bigBox");

    level = Utils.NestingLevel.getNestingLevel(
      { nestingLevel: "spotCollection" },
      { nestingLevel: ["bigBoxCollection", "bigBox"] },
    );
    expect(level).toBeFalsy();

    level = Utils.NestingLevel.getNestingLevel(
      { nestingLevel: "smallBoxCollection" },
      { nestingLevel: ["boxCollection", "box"] },
    );
    expect(level).toBeFalsy();

    level = Utils.NestingLevel.getNestingLevel({ nestingLevel: "asdf" }, { nestingLevel: ["bigBoxCollection", "box"] });
    expect(level).toBe("bigBoxCollection");

    level = Utils.NestingLevel.getNestingLevel({ nestingLevel: "bigBox" }, {});
    expect(level).toBe("area");

    level = Utils.NestingLevel.getNestingLevel({ nestingLevel: "smallBoxCollection" }, {});
    expect(level).toBe("spotCollection");
  });

  it("getChildNestingLevel(props, statics)", async () => {
    let level;
    TestUtils.omitConsoleLogs('Nesting level "asdf" is not a supported value.');

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "page" },
      { nestingLevel: ["bigBoxCollection", "bigBox"] },
    );
    expect(level).toBe("bigBoxCollection");

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "bigBoxCollection" },
      { nestingLevel: ["bigBoxCollection", "bigBox"] },
    );
    expect(level).toBe("bigBoxCollection");

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "areaCollection" },
      { nestingLevel: ["bigBoxCollection", "bigBox"] },
    );
    expect(level).toBe("bigBoxCollection");

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "box" },
      { nestingLevel: ["bigBoxCollection", "box"] },
    );
    expect(level).toBe("smallBoxCollection");

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "spotCollection" },
      { nestingLevel: ["bigBoxCollection", "bigBox"] },
    );
    expect(level).toBeFalsy();

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "smallBoxCollection" },
      { nestingLevel: ["boxCollection", "box"] },
    );
    expect(level).toBeFalsy();

    level = Utils.NestingLevel.getChildNestingLevel(
      { nestingLevel: "asdf" },
      { nestingLevel: ["bigBoxCollection", "box"] },
    );
    expect(level).toBe("bigBoxCollection");

    level = Utils.NestingLevel.getChildNestingLevel({ nestingLevel: "bigBox" }, {});
    expect(level).toBe("boxCollection");

    level = Utils.NestingLevel.getChildNestingLevel({ nestingLevel: "smallBoxCollection" }, {});
    expect(level).toBe("spotCollection");
  });

  it("compare(levelA, levelB)", async () => {
    let list = Utils.NestingLevel.valueList;
    let listLegacy = [
      "spa",
      "page",
      "bigBoxCollection",
      "bigBox",
      "boxCollection",
      "box",
      "smallBoxCollection",
      "smallBox",
      "inline",
    ]; // eslint-disable-line prettier/prettier
    for (let i = 0; i < list.length; i++) {
      let levelA = list[i];
      for (let j = 0; j < listLegacy.length; j++) {
        let levelB = listLegacy[j];

        let resultAB = Utils.NestingLevel.compare(levelA, levelB);
        if (i < j) expect(resultAB).toBeLessThan(0);
        else if (i > j) expect(resultAB).toBeGreaterThan(0);
        else expect(resultAB).toBe(0);

        let resultBA = Utils.NestingLevel.compare(levelB, levelA);
        if (i > j) expect(resultBA).toBeLessThan(0);
        else if (i < j) expect(resultBA).toBeGreaterThan(0);
        else expect(resultBA).toBe(0);
      }
    }
  });
});
