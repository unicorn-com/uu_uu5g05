const React = require("react");
const { setup } = require("./visual-component/setup");
const { testVisualProperties } = require("./visual-component/test-visual-properties");
const { Test } = require("./test.js");

function testBorderRadius(setup, radiusList, opts, level) {
  it.each(radiusList)("checks borderRadius = %s is properly set to root element", async (borderRadius) => {
    const props = { borderRadius, ...opts };
    const { element } = await setup(props);

    expect(element).toHaveGdsRadius([level, borderRadius], props);
  });
}

function testBackground(setup, shape, colorScheme, significance, cssReset) {
  const { BackgroundProvider } = require("uu5g05");

  it.each(["light", "dark", "full", "soft"])(
    "checks component has right effect for %s background",
    async (background) => {
      const Wrapper = ({ children }) => React.createElement(BackgroundProvider, { background }, children);
      const props = { colorScheme };
      const { element } = await setup(props, { Wrapper });

      expect(element).toHaveGdsShape([shape, background, colorScheme, significance], { cssReset });
    },
  );
}

function colorConvert(color1, color2) {
  const { Utils } = require("uu5g05");

  expect(Utils.Color.toHex(color1, true)).toBe(Utils.Color.toHex(color2, true));
}

function testColorScheme(setup, shape, colorScheme, significance, cssReset) {
  it("checks colorScheme is properly shown", async () => {
    const props = { colorScheme };
    const { element } = await setup(props);

    expect(element).toHaveGdsShape([shape, "light", colorScheme, significance], { cssReset });
  });
}

function testSignificance(setup, shape, colorScheme, significance, cssReset) {
  it.each(significance)("checks significance = %s is properly shown", async (significance) => {
    const props = { significance, colorScheme };
    const { element } = await setup(props);

    expect(element).toHaveGdsShape([shape, "light", colorScheme, significance], { cssReset });
  });
}

function testTooltip(setup) {
  it("checks tooltip as text is properly shown", async () => {
    const tooltip = "Test tooltip";
    const props = { tooltip };
    await setup(props);

    expect(Test.screen.getByTitle(tooltip)).toBeVisible();
  });
}

function testTooltipLsi(setup) {
  it("checks tooltip as lsi is properly shown", async () => {
    const tooltip = { en: "Test tooltip" };
    const props = { tooltip };
    await setup(props);

    expect(Test.screen.getByTitle(tooltip.en)).toBeVisible();
  });
}

const VisualComponent = {
  testProperties: testVisualProperties,
  testBorderRadius,
  testBackground,
  testColorScheme,
  testSignificance,
  testTooltip,
  testTooltipLsi,
  colorConvert,
  setup,
};

module.exports = { VisualComponent };
