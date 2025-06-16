function testVisualProperties(setup, opts = {}) {
  const excludes = opts.excludes || [];
  if (!excludes.includes("id")) {
    it("checks id property is properly passed", async () => {
      const id = "id-1";
      const { element } = await setup({ id });

      expect(element).toHaveAttribute("id", id);
    });
  }

  if (!excludes.includes("className")) {
    it("checks className property is properly passed", async () => {
      const className = "class-1";
      const { element } = await setup({ className });

      expect(element).toHaveClass(className);
    });
  }

  if (!excludes.includes("style")) {
    it("checks style property is properly passed", async () => {
      const style = "margin: 50px;";
      const { element, view } = await setup({ style });

      expect(element).toHaveStyle(style);

      view.unmount();

      const styleObject = { margin: "50px" };
      const { element: element2 } = await setup({ style: styleObject });

      expect(element2).toHaveStyle("margin: 50px");
    });
  }

  if (!excludes.includes("disabled")) {
    it("checks disabled property is properly passed", async () => {
      const { element } = await setup({ disabled: true });

      expect(element).toHaveAttribute("disabled", "");
    });
  }

  if (!excludes.includes("hidden")) {
    it("checks hidden property is properly passed", async () => {
      const { element } = await setup({ hidden: true });

      expect(element).toHaveAttribute("hidden", "");
    });
  }

  if (!excludes.includes("elementRef")) {
    it("checks elementRef property is properly passed", async () => {
      const { Utils } = require("uu5g05");

      const id = "id-1";
      const elementRef = Utils.Component.createRef();
      const { element } = await setup({ id, elementRef });

      expect(element).toHaveAttribute("id", id);
      expect(elementRef.current).toHaveAttribute("id", id);
    });
  }

  if (!excludes.includes("elementAttrs")) {
    it("checks elementAttrs property is properly passed", async () => {
      const testId = "component-1";
      const elementAttrs = { "data-test-attribute": testId };
      const { element } = await setup({ elementAttrs });

      expect(element).toHaveAttribute("data-test-attribute", testId);
    });
  }

  if (!excludes.includes("noPrint")) {
    it("checks noPrint property is properly passed", async () => {
      const { element } = await setup({ noPrint: true });

      // TODO MFA Improve this test
      const classList = Array.from(element.classList);
      const noPrintClass = classList.find((item) => item.includes("uu-"));
      expect(noPrintClass).not.toBeUndefined();
    });
  }

  if (!excludes.includes("fullTextSearchPriority")) {
    it("checks fullTextSearchPriority  property is properly passed", async () => {
      const fullTextSearchPriority = 3;
      const { element } = await setup({ fullTextSearchPriority });

      expect(element).toHaveClass(`uu-fulltextsearch-${fullTextSearchPriority}`);
    });
  }
}

module.exports = { testVisualProperties };
