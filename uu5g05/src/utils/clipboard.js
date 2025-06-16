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

import DeviceProvider from "../providers/device-provider.js";

const MIME_TYPE_MAP = {
  json: "application/json",
  text: "text/plain",
  html: "text/html",
  uu5string: "x-uu5string/plain", // TODO remove in new major version
  uu5String: "x-uu5string/plain",
  image: "image/png",
  uu5Component: "x-uu5component/copy",
};

const Clipboard = {
  read(event, type = "text") {
    let result;
    let mimeType = MIME_TYPE_MAP[type] || type;
    let items = (event.originalEvent || event).clipboardData.items;
    let item;
    if (items && items.length) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type === mimeType) {
          item = items[i];
          break;
        }
      }
      if (item) {
        // NOTE For "string" we could use item.getAsString(callback) but the callback is executed
        // asynchronously so we'll use sync access via event.clipboardData.getData() instead.
        // https://html.spec.whatwg.org/multipage/dnd.html#the-datatransferitem-interface
        if (item.kind === "string") result = event.clipboardData.getData(mimeType);
        else result = item.getAsFile();
        if (mimeType === MIME_TYPE_MAP.json || mimeType === MIME_TYPE_MAP.uu5Component)
          result = result ? JSON.parse(result) : null;
      } else {
        // (for Android) the less common formats could have been inlined into text/html - check
        let htmlItem = event.clipboardData.getData(MIME_TYPE_MAP.html);
        let nestedHtmlMapMatch = htmlItem?.match(/<!--AWCP(.*?)-->/)?.[1];
        if (nestedHtmlMapMatch) {
          let nestedHtmlMap = JSON.parse(nestedHtmlMapMatch);
          result = nestedHtmlMap[mimeType];
        }
      }
    }
    return result;
  },

  async write(textOrMimeTypeMap, e) {
    let copied = false;
    if (textOrMimeTypeMap == null) return copied;
    if (textOrMimeTypeMap instanceof Blob) textOrMimeTypeMap = { image: textOrMimeTypeMap };
    else if (typeof textOrMimeTypeMap === "string") textOrMimeTypeMap = { text: textOrMimeTypeMap };
    if (typeof textOrMimeTypeMap !== "object") return copied;

    let normMap = {};
    for (let k in textOrMimeTypeMap) normMap[MIME_TYPE_MAP[k] || k] = textOrMimeTypeMap[k];

    let imageCount = Object.keys(normMap).filter((type) => type.match(/^image$|^image\//)).length;
    if (imageCount > 1 || (imageCount === 1 && Object.keys(normMap).length !== 1)) {
      console.error("Copying to clipboard does not support mixing of images with other MIME types.");
      return copied;
    }
    if (imageCount) {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        console.error("This browser does not support copying images to clipboard programmatically.");
        return copied;
      }
      try {
        await navigator.clipboard.write([new ClipboardItem(normMap)]);
        copied = true;
      } catch (e) {
        // log but ignore
        console.error(e);
      }
    } else {
      const copy = (e) => {
        e.preventDefault();
        let { platform, isMobileOrTablet } = DeviceProvider.device;
        let usedMap = normMap;
        // NOTE Android supports only text/plain and text/html => nest other types as a comment inside of text/html.
        if (isMobileOrTablet && platform === "android") {
          let nestedHtmlMap = {};
          for (let mimeType in normMap) {
            let value = normMap[mimeType];
            if (mimeType !== MIME_TYPE_MAP.text && mimeType !== MIME_TYPE_MAP.html) {
              nestedHtmlMap[mimeType] = value;
              if (usedMap === normMap) usedMap = { ...usedMap };
              delete usedMap[mimeType];
            }
          }
          if (Object.keys(nestedHtmlMap).length > 0) {
            usedMap[MIME_TYPE_MAP.html] =
              (usedMap[MIME_TYPE_MAP.html] || "") +
              `<!--AWCP${JSON.stringify(nestedHtmlMap).replace(/--/g, "-\\u002d").replace(/<\//g, "<\\u002f")}-->`;
          }
        }
        for (let mimeType in usedMap) {
          let value = usedMap[mimeType];
          if (mimeType === MIME_TYPE_MAP.json || mimeType === MIME_TYPE_MAP.uu5Component) value = JSON.stringify(value);
          e.clipboardData.setData(mimeType, value);
        }
      };

      if (e?.type === "copy") {
        copy(e);
        copied = true;
      } else {
        let tempElement = document.createElement("textarea");
        tempElement.id = "uu5-utils-clipboard-write"; // required for uu5g05-elements/*/focus-lock.js
        tempElement.style.cssText = "opacity: 0; position: fixed; left: 0px; top: 0px; pointer-events: none;";
        tempElement.value = " ";
        tempElement.addEventListener("copy", (e) => {
          copied = true;
          e.stopPropagation();
          copy(e);
        });

        document.body.appendChild(tempElement);
        tempElement.select();
        // NOTE In some cases the "copy" event won't fire, e.g. if we got called too late since latest user action (click / etc.).
        // In such case the developer will have to check our return value and tell user to Ctrl+C again.
        document.execCommand?.("copy");
        tempElement.parentNode.removeChild(tempElement);
      }
    }
    return copied;
  },
};

export { Clipboard };
export default Clipboard;
