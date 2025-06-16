import { UuGds } from "uu5g05-elements";

function addMatcherToHaveLineShape() {
  expect.extend({
    toHaveLineShape(element, path, direction = "horizontal", state = "default", cssReset = true) {
      const style = window.getComputedStyle(element);
      const fullPath = ["line", ...path];
      const shape = UuGds.Shape.getValue(fullPath);

      if (!shape) {
        return {
          message: () => `The UuGds.Shape doesn't contains item with path [${fullPath}]`,
          pass: false,
        };
      }

      const shapeStyle = UuGds.Shape.getStateStyles(shape[state], cssReset);
      for (const key of Object.keys(shapeStyle)) {
        if (key === "color" || key === "backgroundColor") {
          continue;
        }

        // Conversion from camelCase to hypens (e.g. backgroundColor -> background-color)
        const side = direction === "horizontal" ? "top" : "left";
        const propertyName = key.replace(/([a-z])([A-Z])/g, `$1-${side}-$2`).toLowerCase();
        const value = shapeStyle[key];
        let expectedValue = typeof value === "number" ? `${value}px` : value;
        let propertyValue = style.getPropertyValue(propertyName);

        // Normalization
        expectedValue = expectedValue.toLowerCase();
        propertyValue = propertyValue.toLowerCase();

        if (propertyValue === expectedValue) {
          continue;
        } else {
          return {
            message: () =>
              `expected CSS property ${propertyName} to be "${expectedValue}" but received "${propertyValue}"`,
            pass: false,
          };
        }
      }

      return {
        message: () => `expected UuGds.Shape not to be [${fullPath}]`,
        pass: true,
      };
    },
  });
}

export { addMatcherToHaveLineShape };
