const { createSerializer } = require("@emotion/jest");

// 1. Add serializer that strips away <Portal containerInfo=... /> prop as it contains duplicit
//    content (same as children) and @emotion/jest has issues with it (inserts emotion classes in it)
// 2. Also remove _ref and *Ref props so that DOM elements aren't duplicated/serialized.
let React;
function removeProps(val, props) {
  let newProps = {};
  for (let k of props) newProps[k] = undefined;
  let args = [val, newProps];
  if ("children" in val && !("children" in newProps)) args.push(val.children);
  val = (React = React || require("react")).cloneElement(...args);
  return val;
}
let processedSet = new WeakSet();
expect.addSnapshotSerializer({
  print: (val, serialize, ...rest) => {
    let propsToRemove = [];
    if ("$$typeof" in val && val.props) {
      if (val.props["containerInfo"] != null && val.type === "Portal") propsToRemove.push("containerInfo");
      for (let prop in val.props) {
        if (prop.match(/^_ref$|.Ref$/) && val.props[prop] != null) propsToRemove.push(prop);
      }
      if (propsToRemove.length) val = removeProps(val, propsToRemove);
    }
    processedSet.add(val);
    return serialize(val, ...rest);
  },

  test: (val) => {
    return val && typeof val === "object" && "$$typeof" in val && val.props && !processedSet.has(val);
  },
});

// add @emotion/jest serializer so that CSS styles are visible instead of hashed classNames
expect.addSnapshotSerializer(createSerializer({ includeStyles: true, DOMElements: true }));

// add serializer that fixes @emotion/jest serializer :-/ (they assume that serialized tree isn't changed
// but there are serializers that alter which nodes from the tree get serialized / not and these changes
// are not handled by @emotion/jest properly - currently they visit only top node and try to compute everything
// at that point; instead they should visit each node and collect info on the fly, computing the result in
// the top level after all nodes were collected)
// NOTE This is just works-in-simple-cases workaround.
let nested = false;
let thisLibOwnerPrefix = process.env.NAME + "/";
expect.addSnapshotSerializer({
  print(val, serialize, ...rest) {
    nested = true;

    // hide emotion styles that are not from currently tested library
    let cleanupFns = [];
    let styleEls = document.querySelectorAll("style[data-emotion]");
    for (let styleEl of styleEls) {
      if (!(styleEl.dataset["owner"] || "").startsWith(thisLibOwnerPrefix)) {
        styleEl.setAttribute("data-emotion-serializer-hide-emotion", styleEl.getAttribute("data-emotion"));
        styleEl.removeAttribute("data-emotion");
        cleanupFns.push(() => {
          styleEl.setAttribute("data-emotion", styleEl.getAttribute("data-emotion-serializer-hide-emotion"));
          styleEl.removeAttribute("data-emotion-serializer-hide-emotion");
        });
      }
    }

    try {
      // serialize
      let result = serialize(val);

      // strip repeating emotion CSS styles
      let initialStyles = "";
      let stylesDefStart = result.search(/.(emotion|animation)-\d+\s*\{/);
      let jsxStartIndex = result.indexOf("<");
      let hasClasses = stylesDefStart >= 0 && (stylesDefStart < jsxStartIndex || jsxStartIndex === -1);
      if (hasClasses && jsxStartIndex !== -1) {
        let resultPrefix = result.slice(0, jsxStartIndex);
        initialStyles = resultPrefix.trim();
        result = result
          .slice(resultPrefix.length)
          .replace(new RegExp(" *" + regexpQuote(initialStyles) + " *\r?\n", "g"), "");
      }

      // wrap emotion classes into /**/ comment as they're sometimes within prop value, not at the beginning of the snapshot
      // (e.g. dropdown.test.js when snapshotting items in opened dropdown)
      // PART 1
      let replacementMap = {};
      let replacementCounter = 0;
      result = result.replace(
        /(\s*)((?:@keyframes\s+animation-\d|@media\s|\.emotion-\d+\s*\{)(?:\s|\S)*?)($|<[A-Za-z])/g,
        (m, spaces, styles, jsx) => {
          let extraIndent = spaces.match(/[^\n]*$/)[0];
          let key = "R$$$" + replacementCounter++ + "$$$R";
          replacementMap[key] = ["/*", ...styles.trim().split("\n"), "*/", ""].join("\n" + extraIndent);
          return spaces + key + jsx;
        },
      );

      // when comparing snapshots, serializers get called again and the end result is expected
      // to have no indentation on lines (more precisely, there's an extra serializer / something
      // that removes spaces from lines, but @emotion/jest doesn't pass the emotion styles to serialize()
      // call / doesn't use that something) => detect this & remove indentation in emotion styles
      let isWithoutIndent = result.split("\n").every((it) => it[0] !== " ");
      if (isWithoutIndent && initialStyles) {
        initialStyles = initialStyles
          .split("\n")
          .map((it) => it.replace(/^ +/, ""))
          .join("\n");
      }

      // PART 2
      for (let replacementKey in replacementMap) {
        result = result.replace(replacementKey, () => replacementMap[replacementKey]);
      }

      if (initialStyles) result = initialStyles + "\n\n" + result;

      return result;
    } finally {
      nested = false;
      for (let cleanupFn of cleanupFns) cleanupFn();
    }
  },
  test(val) {
    return !nested;
  },
});

function regexpQuote(text) {
  return text.replace(/[.?*+^$[\]\\(){}|]/g, "\\$&");
}
