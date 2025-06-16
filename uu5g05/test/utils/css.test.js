import { Utils } from "uu5g05";

function expectStyle(className, expectedFn) {
  let el = document.createElement("div");
  document.body.appendChild(el);
  el.className = className;
  let computedStyle = getComputedStyle(el);
  expect(expectedFn(computedStyle, el)).toBeTruthy();
  el.remove();
}

describe("[uu5g05] Utils.Css", () => {
  it("createCssModule(key)", async () => {
    const cssModule = Utils.Css.createCssModule("test");
    expect(cssModule).toMatchObject({
      css: expect.any(Function),
      injectGlobal: expect.any(Function),
      keyframes: expect.any(Function),
      join: expect.any(Function),
    });

    const cssModule2 = Utils.Css.createCssModule("test");
    expect(cssModule === cssModule2).toBeTruthy();
  });

  it("joinClasName(...classNames)", async () => {
    expect(Utils.Css.joinClassName("", undefined, 0, "abc", "")).toBe("0 abc");
  });

  it("<cssModule>.css(object)", async () => {
    const cssModule = Utils.Css.createCssModule("test");
    expectStyle(cssModule.css({ width: 10 }), (computedStyle) => computedStyle.width === "10px");
    expectStyle(
      cssModule.css({ "&": cssModule.css({ width: 20 }) }),
      (computedStyle) => computedStyle.width === "20px",
    );
  });

  it("<cssModule>.css`...`", async () => {
    const cssModule = Utils.Css.createCssModule("test");
    expectStyle(cssModule.css`width: 10px`, (computedStyle) => computedStyle.width === "10px");
    expectStyle(cssModule.css`& {${cssModule.css`width: 20px;`}}`, (computedStyle) => computedStyle.width === "20px");
    let className1 = cssModule.css`width: 30px;`;
    expectStyle(
      className1 + " " + cssModule.css`&.${className1} {${cssModule.css`height: 40px;`}}`,
      (computedStyle) => computedStyle.width === "30px" && computedStyle.height === "40px",
    );
    expectStyle(
      className1 + " " + cssModule.css`&.${""}${className1} {${cssModule.css`height: 40px;`}}`,
      (computedStyle) => computedStyle.width === "30px" && computedStyle.height === "40px",
    );
    expectStyle(
      className1 + " " + cssModule.css`&${"."}${""}${className1} {${cssModule.css`height: 40px;`}}`,
      (computedStyle) => computedStyle.width === "30px" && computedStyle.height === "40px",
    );
    expectStyle(cssModule.css`${cssModule.css`height: 40px;`}`, (computedStyle) => computedStyle.height === "40px");
    expectStyle(
      cssModule.css`${""}${cssModule.css`height: 40px;`}`,
      (computedStyle) => computedStyle.height === "40px",
    );
    expectStyle(
      cssModule.css`${cssModule.css`width: 45px;`}${""}${cssModule.css`height: 40px;`}`,
      (computedStyle) => computedStyle.height === "40px" && computedStyle.width === "45px",
    );
  });

  it("<cssModule>.injectGlobal`...`", async () => {
    const cssModule = Utils.Css.createCssModule("test");
    cssModule.injectGlobal(`.test-utils-css { width: 50px; }`);
    expectStyle("test-utils-css", (computedStyle) => computedStyle.width === "50px");
  });

  it("<cssModule>.join(...classNames)", async () => {
    const cssModule = Utils.Css.createCssModule("test");
    const className1 = cssModule.css({ width: 60, order: 1 });
    const className2 = cssModule.css({ width: 70, height: 70 });
    const className3 = "abc";
    expectStyle(
      cssModule.join(className1, className2, className3),
      (computedStyle, el) =>
        computedStyle.width === "70px" &&
        computedStyle.order === "1" &&
        computedStyle.height === "70px" &&
        [...el.classList].includes(className3),
    );
    // the order of class names matters (latter with the same specificity wins)
    expectStyle(
      cssModule.join(className2, className1, className3),
      (computedStyle, el) =>
        computedStyle.width === "60px" &&
        computedStyle.order === "1" &&
        computedStyle.height === "70px" &&
        [...el.classList].includes(className3),
    );
  });
});
