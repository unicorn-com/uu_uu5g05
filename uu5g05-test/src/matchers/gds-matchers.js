expect.extend({
  toHaveGdsBorder(element, path, propertyName = "border") {
    const { UuGds } = require("uu5g05-elements");

    const propertyWidth = `${propertyName}-width`;
    const propertyStyle = `${propertyName}-style`;

    const expectedBorder = UuGds.BorderPalette.getValue(path);

    if (!expectedBorder) {
      return {
        message: () => `The UuGds.BorderPallete doesn't contains item with path [${path}]`,
        pass: false,
      };
    }

    const expectedWidth = `${expectedBorder.width}px`;
    const expectedStyle = expectedBorder.style;

    const style = window.getComputedStyle(element);
    const borderWidth = style.getPropertyValue(propertyWidth);
    const borderStyle = style.getPropertyValue(propertyStyle);

    if (borderWidth === expectedWidth && borderStyle === expectedStyle) {
      return {
        message: () => `expected:
          CSS property ${propertyWidth} not to be ${borderWidth} and
          CSS property ${propertyStyle} not to be ${borderStyle}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected:
          CSS property ${propertyWidth} to be "${expectedWidth}" and
          CSS property ${propertyStyle} to be "${expectedStyle}" but
          received CSS property ${propertyWidth} is "${borderWidth}" and
          received CSS property ${propertyStyle} is "${borderStyle}"`,
        pass: false,
      };
    }
  },

  toHaveGdsColor(element, path, propertyName = "color") {
    const { Utils } = require("uu5g05");
    const { UuGds } = require("uu5g05-elements");

    const style = window.getComputedStyle(element);
    let color = style.getPropertyValue(propertyName).replaceAll(" ", "");
    let expectedColor = UuGds.ColorPalette.getValue(path).replaceAll(" ", "");

    if (!expectedColor) {
      return {
        message: () => `The UuGds.ColorPallete doesn't contains item with path [${path}]`,
        pass: false,
      };
    }

    // Normalization
    color = Utils.Color.toHex(color);
    expectedColor = Utils.Color.toHex(expectedColor);

    if (color === expectedColor) {
      return {
        message: () => `expected CSS property ${propertyName} not to be "${color}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected CSS property ${propertyName} to be "${expectedColor}" but received "${color}"`,
        pass: false,
      };
    }
  },

  toHaveGdsEffect(element, path, options) {
    const { UuGds } = require("uu5g05-elements");

    const style = window.getComputedStyle(element);
    const effect = UuGds.EffectPalette.getValue(path, options);

    if (!effect) {
      return {
        message: () => `The UuGds.EffectPallete doesn't contains item with path [${path}]`,
        pass: false,
      };
    }

    const expectedBoxShadow = UuGds.EffectPalette.getStyles(effect)?.boxShadow;
    const boxShadow = style.getPropertyValue("box-shadow");

    if (boxShadow === expectedBoxShadow) {
      return {
        message: () => `expected CSS property box-shadow not to be "${boxShadow}"`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected CSS property box-shadow to be "${expectedBoxShadow}" but received value "${boxShadow}"`,
        pass: false,
      };
    }
  },

  toBeWithoutGdsEffect(element) {
    const style = window.getComputedStyle(element);
    const boxShadow = style.getPropertyValue("box-shadow");

    if (boxShadow === "") {
      return {
        message: () => `expected CSS property box-shadow to be set on the element`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected CSS property box-shadow not to be set on the element but received "${boxShadow}"`,
        pass: false,
      };
    }
  },

  toHaveGdsRadius(element, path, options, propertyName = "border") {
    const { UuGds } = require("uu5g05-elements");

    const style = window.getComputedStyle(element);
    let expectedRadius = UuGds.RadiusPalette.getValue(path, options);

    if (!expectedRadius && path[1] !== "none") {
      return {
        message: () => `The UuGds.RadiusPallete doesn't contains item with path [${path}]`,
        pass: false,
      };
    }

    let elementRadius = style.getPropertyValue(`${propertyName}-radius`);

    // Normalization
    expectedRadius = expectedRadius === 0 || expectedRadius === "0" ? "" : expectedRadius;
    expectedRadius = typeof expectedRadius === "number" ? `${expectedRadius}px` : expectedRadius;
    elementRadius = elementRadius === 0 || elementRadius === "0" ? "" : elementRadius;

    if (elementRadius === expectedRadius) {
      return {
        message: () => `expected CSS property ${propertyName} not to be "${elementRadius}"`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected CSS property ${propertyName} to be "${expectedRadius}" but received "${elementRadius}"`,
        pass: false,
      };
    }
  },

  toHaveGdsSize(element, path) {
    const { UuGds } = require("uu5g05-elements");

    const style = window.getComputedStyle(element);
    let size = UuGds.SizingPalette.getValue(path);

    if (!size) {
      return {
        message: () => `The UuGds.SizingPalette doesn't contains item with path [${path}]`,
        pass: false,
      };
    }

    if (path[0] !== "box") {
      const expectedHeight = path.includes("inline") ? size : `${size.h}px`;
      const elementHeight =
        style.getPropertyValue(`height`) ||
        style.getPropertyValue(`min-height`) ||
        (element.tagName === "IMG" ? element.height + "px" : "");

      if (elementHeight === expectedHeight) {
        return {
          message: () => `expected CSS property height not to be "${elementHeight}"`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected CSS property height to be "${expectedHeight}" but received "${elementHeight}"`,
          pass: false,
        };
      }
    } else {
      const expectedWidth = `${size.w}px`;
      const elementWidth =
        style.getPropertyValue(`width`) ||
        style.getPropertyValue(`min-width`) ||
        (element.tagName === "IMG" ? element.width + "px" : "");
      const expectedAspectRatio = path[1]?.replace("x", " / ");
      const elementAspectRatio = style.getPropertyValue("aspect-ratio");
      const jsdomSupportsAspectRatio = "aspectRatio" in style;

      if (elementWidth !== expectedWidth) {
        return {
          message: () => `expected CSS property width to be "${expectedWidth}" but received "${elementWidth}"`,
          pass: false,
        };
      } else if (jsdomSupportsAspectRatio && elementAspectRatio !== expectedAspectRatio) {
        return {
          message: () =>
            `expected CSS property aspectRatio to be "${expectedAspectRatio}" but received "${elementAspectRatio}"`,
          pass: false,
        };
      } else {
        return {
          message: () => `expected CSS property width not to be "${elementWidth}"`,
          pass: true,
        };
      }
    }
  },

  toHaveGdsSpacing(element, property, path) {
    const { UuGds } = require("uu5g05-elements");

    const style = window.getComputedStyle(element);
    let spacing = UuGds.SpacingPalette.getValue(path);

    if (!spacing) {
      return {
        message: () => `The UuGds.SpacingPalette doesn't contain item with path [${path}]`,
        pass: false,
      };
    }

    const expectedSpacing = `${spacing}px`;
    const elementSpacing = style.getPropertyValue(property);

    if (expectedSpacing === elementSpacing) {
      return {
        message: () => `expected CSS property ${property} not to be "${elementSpacing}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected CSS property ${property} to be "${expectedSpacing}" but received "${elementSpacing}"`,
        pass: false,
      };
    }
  },

  toHaveGdsShape(element, pathOrShape, { state = "default", cssReset = true, skipColor = false } = {}) {
    const { Utils } = require("uu5g05");
    const { UuGds } = require("uu5g05-elements");

    const style = window.getComputedStyle(element);
    const shape = Array.isArray(pathOrShape) ? UuGds.Shape.getValue(pathOrShape) : pathOrShape;

    if (!shape) {
      return {
        message: () =>
          Array.isArray(pathOrShape)
            ? `The UuGds.Shape doesn't contains item with path [${pathOrShape}]`
            : `The shape is invalid: ${pathOrShape}`,
        pass: false,
      };
    }

    const shapeStyle = UuGds.Shape.getStateStyles(shape[state], cssReset);
    for (const key of Object.keys(shapeStyle)) {
      if (skipColor && key === "color") {
        continue;
      }

      // Conversion from camelCase to hypens (e.g. backgroundColor -> background-color)
      const propertyName = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      const value = shapeStyle[key];
      let expectedValue = typeof value === "number" ? `${value}px` : value;
      let propertyValue = style.getPropertyValue(propertyName);

      if (/^rgba?\(/.test(propertyValue)) {
        propertyValue = Utils.Color.toHex(propertyValue);
        expectedValue = Utils.Color.toHex(expectedValue);
      }

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
      message: () =>
        Array.isArray(pathOrShape)
          ? `expected UuGds.Shape not to be [${pathOrShape}]`
          : `expected UuGds.Shape not to be ${JSON.stringify(pathOrShape)}`,
      pass: true,
    };
  },

  toHaveGdsTypography(element, pathOrTypography) {
    const { UuGds } = require("uu5g05-elements");

    const style = window.getComputedStyle(element);
    const typography = Array.isArray(pathOrTypography) ? UuGds.Typography.getValue(pathOrTypography) : pathOrTypography;

    if (!typography) {
      return {
        message: () =>
          Array.isArray(pathOrTypography)
            ? `The UuGds.Typography doesn't contain item with path [${pathOrTypography}]`
            : `The typography is invalid: ${pathOrTypography}`,
        pass: false,
      };
    }

    const expectedFontSize = `${typography.fontSize}px`;
    const fontSize = style.getPropertyValue("font-size");
    const fontWeight = style.getPropertyValue("font-weight");
    const lineHeight = style.getPropertyValue("line-height");

    if (fontSize === expectedFontSize && fontWeight === typography.fontWeight && lineHeight === typography.lineHeight) {
      return {
        message: () => `expected:
          CSS property font-size not to be "${fontSize}" and
          CSS property font-weight not to be "${fontWeight}" and
          CSS property line-height not to be "${lineHeight}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected:
          CSS property font-size to be "${expectedFontSize}" and
          CSS property font-weight to be "${typography.fontWeight}" and
          CSS property line-height to be "${typography.lineHeight}" but
          received CSS property font-size is "${fontSize}" and
          received CSS property font-weight is "${fontWeight}" and
          received CSS property line-height is "${lineHeight}"`,
        pass: false,
      };
    }
  },
});
