/**
 * Copyright (C) 2021 Unicorn a.s.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License at
 * <https://gnu.org/licenses/> for more details.
 *
 * You may obtain additional information at <https://unicorn.com> or contact Unicorn a.s. at address: V Kapslovne 2767/2,
 * Praha 3, Czech Republic or at the email: info@unicorn.com.
 */
import { useMemo, useLayoutEffect, useState } from "../hooks/react-hooks.js";
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import Color from "../utils/color";
import AppBackgroundContext from "../contexts/app-background-context";
import Uu5Loader from "../utils/uu5-loader";

//@@viewOn:helpers
// NOTE Copied from build tool of uu_graphicdesignsystemg01 gds-to-json.js.
function identifyGdsBackground(color) {
  let perceivedBrightness = toPerceivedBrightness(color);
  if (perceivedBrightness === undefined) return;

  let gdsBackground = "light";
  if (perceivedBrightness < 0.418) {
    gdsBackground = "dark";
  } else if (perceivedBrightness < 0.88) {
    gdsBackground = "full";
  } else if (perceivedBrightness < 0.95) {
    gdsBackground = "soft";
  }

  return gdsBackground;
}

// https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color#answer-56678483
function sRGBtoLinear(colorChannel) {
  return colorChannel <= 0.04045 ? colorChannel / 12.92 : Math.pow((colorChannel + 0.055) / 1.055, 2.4);
}

function luminanceToPerceivedBrightness(luminance) {
  return luminance <= 216 / 24389 ? luminance * (24389 / 27) : Math.pow(luminance, 1 / 3) * 116 - 16;
}

function toPerceivedBrightness(color) {
  if (!color) return;
  let [r, g, b, o] = Color.toRgba(color);
  if (o != null && o < 1) return; // consider transparent / semi-transparent values as not having solid background

  let luminance = 0.2126 * sRGBtoLinear(r / 255) + 0.7152 * sRGBtoLinear(g / 255) + 0.0722 * sRGBtoLinear(b / 255);
  let perceivedBrightness = luminanceToPerceivedBrightness(luminance) / 100;
  return perceivedBrightness; // 0..1; 0 being dark, 1 being light
}

//@@viewOff:helpers

const AppBackgroundProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AppBackgroundProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    background: PropTypes.background,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    background: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { background, children } = props;

    const [defaultColor] = useState(() => {
      const styles = getComputedStyle(document.body);
      return {
        background: styles.backgroundColor === "rgba(0, 0, 0, 0)" ? null : styles.backgroundColor,
        color: styles.color === "rgb(0, 0, 0)" ? null : styles.color,
      };
    });

    const [bg, setBg] = useState(() => {
      let backgroundColor;
      if (!background) {
        const bgColor = defaultColor.background;
        if (bgColor !== "rgba(0, 0, 0, 0)") backgroundColor = bgColor;
      }
      if (backgroundColor) background = identifyGdsBackground(backgroundColor);

      return { background, backgroundColor };
    });

    const contextValue = useMemo(
      () => ({
        background: bg.background,
        backgroundColor: bg.backgroundColor,
        setBackground: ({ background, backgroundColor }) => {
          if (backgroundColor) {
            background = identifyGdsBackground(backgroundColor);
          } else {
            background ||= "light";
          }

          setBg({ background, backgroundColor });
        },
      }),
      [bg.background, bg.backgroundColor],
    );

    useLayoutEffect(() => {
      if (bg.backgroundColor) {
        document.body.style.backgroundColor = bg.backgroundColor;

        const bodyColor = getComputedStyle(document.body).color;
        const isLight = Color.isLight(bodyColor);
        if (bg.background === "dark") {
          if (!isLight) {
            const Uu5Elements = Uu5Loader.get("uu5g05-elements");
            document.body.style.color = Uu5Elements
              ? Uu5Elements.UuGds.ColorPalette.getValue(["building", "light", "main"])
              : "#fff";
          }
        } else {
          if (isLight) {
            const Uu5Elements = Uu5Loader.get("uu5g05-elements");
            document.body.style.color = Uu5Elements
              ? Uu5Elements.UuGds.ColorPalette.getValue(["building", "dark", "main"])
              : "#212121";
          }
        }
      } else {
        document.body.style.backgroundColor = defaultColor.background;
        document.body.style.color = defaultColor.color;
      }
      document.documentElement.style.colorScheme = bg.background;
    }, [bg.background, bg.backgroundColor, defaultColor.background, defaultColor.color]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <AppBackgroundContext.Provider value={contextValue}>
        {typeof children === "function" ? children(contextValue) : children}
      </AppBackgroundContext.Provider>
    );
    //@@viewOff:render
  },
});

export { AppBackgroundProvider };
export default AppBackgroundProvider;
