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

const THOUSAND_REGEXP = /\B(?=(\d{3})+(?!\d))/g;

const UtilsNumber = {
  random(max, min = 0) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  },

  format(value, { groupingSeparator = "", decimalSeparator }) {
    let [num, dec] = (value + "").split(".");

    // TODO Use Intl.NumberFormatter (not all languages split groups by 3 digits).
    let formattedValue = num.replace(THOUSAND_REGEXP, groupingSeparator);
    if (dec) formattedValue = [formattedValue, dec].join(decimalSeparator);

    return formattedValue;
  },

  // NOTE Copied to uu5g04 (src/forms/number.js), keep in sync.
  // this function is used from outside of this file.
  _transformPastedTextToNumberString(text, groupingSeparator) {
    let numberString;
    let ambiguous = false;
    if (typeof text === "number") text = text + "";
    let numbersAndSepsOnly = text.match(/-?\d+[.,\s0-9]*|-?[.,]\d+[.,\s0-9]*/)?.[0]?.trim() || ""; // use only first number
    let negativePrefix = numbersAndSepsOnly[0] === "-" ? "-" : "";
    if (negativePrefix) numbersAndSepsOnly = numbersAndSepsOnly.slice(1).trim();
    numbersAndSepsOnly = numbersAndSepsOnly.replace(/[.,\s]+$/, ""); // ignore separators at the end

    // numbersAndSepsOnly now contains e.g. "1,2" or "1.456.3" or ".,23452...23" or "1 234.567"
    let dotCount = numbersAndSepsOnly.split(".").length - 1;
    let commaCount = numbersAndSepsOnly.split(",").length - 1;
    let isWellFormedWithSpaceAsThousandSeparator =
      dotCount + commaCount <= 1 && // at most 1 occurrence of , or .
      numbersAndSepsOnly.includes(" ") && // has space
      !numbersAndSepsOnly.split(/[.,]/)[1]?.includes(" "); // there is no space after , or .
    if ((dotCount > 0 && commaCount > 0) || isWellFormedWithSpaceAsThousandSeparator) {
      // both types of separators => use last of separators as decimal point
      let parts = numbersAndSepsOnly.replace(/\s+/g, "").split(/[.,]/);
      let decimalPart = parts.length > 1 ? parts.pop() : "";
      numberString = parts.join("") + (decimalPart && !decimalPart.match(/^0+$/) ? "." + decimalPart : ""); // strip .00 from the end to make it clearer for user
    } else if (dotCount > 0 || commaCount > 0) {
      // single type of separator
      let separatorCount = dotCount || commaCount;
      let separatorChar = dotCount > 0 ? "." : ",";
      let isGrouppedByTriples = numbersAndSepsOnly
        .split(separatorChar)
        .slice(1)
        .every((it) => it.length === 3);
      if (isGrouppedByTriples) {
        // e.g. "2,134,567,890" or "1,234"
        if (separatorCount > 1 || groupingSeparator === separatorChar) {
          // 1,234,567 or (1,234 && we use ',' for thousands) => 1234567 or 1234; dtto for "."
          numberString = numbersAndSepsOnly.replace(/\s+/g, "").replaceAll(separatorChar, "");
          ambiguous = separatorCount === 1;
        } else {
          // 1,234 && we don't use "," for thousands => use 1.234 and warn
          numberString = numbersAndSepsOnly.replace(/\s+/g, "").replace(separatorChar, ".").replace(/\.0*$/, "");
          ambiguous = true;
        }
      } else {
        // e.g. "2134,56,789" or "1,23" => use last of separators as decimal point
        let parts = numbersAndSepsOnly.replace(/\s+/g, "").split(separatorChar);
        let decimalPart = parts.pop();
        numberString = parts.join("") + (decimalPart && !decimalPart.match(/^0+$/) ? "." + decimalPart : ""); // strip .00 from the end to make it clearer for user
      }
    } else {
      // no separators present => use as-is
      numberString = numbersAndSepsOnly.replace(/\s+/g, "");
    }

    let fullNumberString =
      numberString && !Number.isNaN(Number(numberString)) ? negativePrefix + numberString : undefined;

    return { numberString: fullNumberString, ambiguous };
  },

  parse(value, options) {
    let result;
    if (value !== undefined && value !== "") {
      let groupingSeparator = options?.groupingSeparator || " ";
      let { numberString } = UtilsNumber._transformPastedTextToNumberString(value, groupingSeparator);
      result = numberString ? Number(numberString) : null;
    }
    return result;
  },
};

export { UtilsNumber as Number };
export default UtilsNumber;
