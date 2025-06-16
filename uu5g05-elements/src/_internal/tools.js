import { Environment, Utils, createVisualComponent } from "uu5g05";

const VisualComponentPropList = Object.keys(createVisualComponent.propTypes);

const Tools = {
  // DOM
  getDocumentHeight() {
    let body = document.body;
    let html = document.documentElement;

    return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
  },

  getScrollBarWidth() {
    if (Tools._scrollBarWidth === undefined) {
      let div = document.createElement("div");
      div.style.overflow = "scroll";
      div.style.visibility = "hidden";
      div.style.position = "absolute";
      div.style.width = "100px";
      div.style.height = "100px";

      // temporarily creates a div into DOM
      document.body.appendChild(div);
      try {
        Tools._scrollBarWidth = div.offsetWidth - div.clientWidth;
      } finally {
        document.body.removeChild(div);
      }
    }
    return Tools._scrollBarWidth;
  },

  getOnWheelClickAttrs({ onClick, onMouseDown, onMouseUp }) {
    const attrs = {};

    if (typeof onClick === "function") {
      attrs.onClick = onClick;

      // prevent default in onMouseDown disable scroll cursor by wheel click
      // prevent default does not trigger onClick, so onMouseUp must replace it
      attrs.onMouseDown = (e, ...args) => {
        if (e.button === 1) e.preventDefault();
        typeof onMouseDown === "function" && onMouseDown(e, ...args);
      };

      // because of disabling scroll cursor on wheel click
      attrs.onMouseUp = (e, ...args) => {
        if (e.button === 1 && typeof onClick === "function") onClick(e, ...args);
        typeof onMouseUp === "function" && onMouseUp(e, ...args);
      };
    } else {
      if (onMouseDown) attrs.onMouseDown = onMouseDown;
      if (onMouseUp) attrs.onMouseUp = onMouseUp;
    }

    return attrs;
  },
  getElement(component, propsToPass, { preferChildProps, cache, cacheKey } = {}) {
    let result;

    let cacheData = cache?.[cacheKey];
    if (cacheData) {
      if (Utils.Object.deepEqual(cacheData.propsToPass, propsToPass)) {
        propsToPass = cacheData.propsToPass;
        if (component === cacheData.component) {
          return cacheData.result;
        }
      }
    }

    if (typeof component === "function") {
      if (component.uu5ComponentType) {
        // uu5 component
        if (Array.isArray(propsToPass)) propsToPass = propsToPass[0];
        let Component = component;
        if (propsToPass?.key !== undefined) {
          let { key, ...otherProps } = propsToPass;
          result = <Component key={key} {...otherProps} />;
        } else {
          result = <Component {...propsToPass} />;
        }
      } else {
        // plain fn
        if (Array.isArray(propsToPass)) {
          result = component(...propsToPass);
        } else {
          result = component(propsToPass);
        }
      }
    } else if (Utils.Element.isValid(component)) {
      // jsx
      if (Array.isArray(propsToPass)) propsToPass = propsToPass[0];
      result = Utils.Element.clone(component, mergeProps(component.props, propsToPass, preferChildProps));
    } else {
      // e.g. number, string
      if (Array.isArray(propsToPass)) propsToPass = propsToPass[0];
      result = component;
    }

    if (cache) {
      cache[cacheKey] = { component, propsToPass, result };
    }

    return result;
  },

  constructItemKey(itemIdentifier = "id") {
    let fn = Array.isArray(itemIdentifier)
      ? (item) => {
          let values = itemIdentifier.map((idKey) => getByKey(item, idKey));
          return values.some((v) => v === null) ? null : JSON.stringify(values);
        }
      : (item) => getByKey(item, itemIdentifier);
    return (item) => {
      let result = fn(item);
      if (result == null && item && item.data) result = fn(item.data); // in case that item is wrapper around data (e.g. from useDataList)
      return result;
    };
  },

  // generic size maps used by most components
  TEXT_TYPE_MAP: {
    xxs: "xsmall",
    xs: "small",
    s: "medium",
    m: "medium",
    l: "large",
    xl: "large",
  },
  TEXT_TYPE_MAP_MOBILE: {
    xxs: "small",
    xs: "medium",
    s: "medium",
    m: "large",
    l: "large",
    xl: "large",
  },
  CONTAINER_SIZE_MAP_MOBILE: {
    xxs: "xs",
    xs: "s",
    s: "m",
    m: "l",
    l: "l",
    xl: "xl",
  },

  getLinkProps(elementAttrs = {}, { href, target, role, onClick } = {}) {
    const linkProps = {
      onClick,
      elementAttrs: {
        ...elementAttrs,
        role,
        onKeyDown: (e) => {
          if (typeof elementAttrs?.onKeyDown === "function") elementAttrs.onKeyDown(e);
          switch (e.key) {
            case "Enter":
            case "NumpadEnter":
              if (typeof onClick === "function") onClick(e);
              break;
          }
        },
      },
    };

    if (href) {
      linkProps.href = href;
      linkProps.target = target;
    }

    return linkProps;
  },

  getItemIndexToFocus(itemList, reverseOrder = false) {
    let resultItemList = Array.isArray(itemList) ? [...itemList] : [];
    if (reverseOrder) resultItemList = resultItemList.reverse();

    const result = resultItemList.findIndex(
      (it) => !it.heading || it.actionList || it.onLabelClick || it.itemList || it.onClick,
    );
    return result;
  },

  getPaginationItemList({ count = 1, disabled = false, index, type, handleMobileClick }) {
    const boundaryCount = 1;
    const siblingCount = 1;
    const range = (start, end) => {
      const length = end - start + 1;
      return Array.from({ length }, (_, i) => start + i);
    };

    const startPages = range(1, Math.min(boundaryCount, count));
    const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

    const siblingsStart = Math.max(
      Math.min(
        // Natural start
        index + 1 - siblingCount,
        // Lower boundary when page is high
        count - boundaryCount - siblingCount * 2 - 1,
      ),
      // Greater than startPages
      boundaryCount + 2,
    );

    const siblingsEnd = Math.min(
      Math.max(
        // Natural end
        index + 1 + siblingCount,
        // Upper boundary when page is low
        boundaryCount + siblingCount * 2 + 2,
      ),
      // Less than endPages
      endPages.length > 0 ? endPages[0] - 2 : count - 1,
    );

    const siblingsStartMobile = Math.max(
      Math.min(
        // Natural start
        index + 1 - siblingCount,
        // Lower boundary when page is high
        count - siblingCount * 2,
      ),
      // Greater than startPages
      siblingCount,
    );

    const siblingsEndMobile = Math.min(
      Math.max(
        // Natural end
        index + 1 + siblingCount,
        // Upper boundary when page is low
        siblingCount * 2 + 1,
      ),
      // Less than endPages
      count,
    );

    // Basic list of items to render
    let itemList;
    if (type === "compact") {
      itemList = ["first", "previous", "compactButton", "next", "last"];
    } else if (type === "mobile") {
      itemList = ["first", "previous", ...range(siblingsStartMobile, siblingsEndMobile), "next", "last"];
    } else {
      // "pages" type
      itemList = [
        "first",
        "previous",
        ...startPages,

        // Start ellipsis
        ...(siblingsStart > boundaryCount + 2
          ? ["start-ellipsis"]
          : boundaryCount + 1 < count - boundaryCount
            ? [boundaryCount + 1]
            : []),

        // Sibling pages
        ...range(siblingsStart, siblingsEnd),

        // End ellipsis
        ...(siblingsEnd < count - boundaryCount - 1
          ? ["end-ellipsis"]
          : count - boundaryCount > boundaryCount
            ? [count - boundaryCount]
            : []),

        ...endPages,
        "next",
        "last",
      ];
    }

    const items = itemList.map((item) => {
      if (typeof item === "number") {
        return {
          itemType: "page",
          page: item,
          selected: item - 1 === index,
          disabled,
        };
      } else if (item === "compactButton") {
        return {
          itemType: "compactButton",
          onClick: () => handleMobileClick(),
        };
      } else {
        return {
          itemType: item,
          disabled:
            disabled ||
            (item.indexOf("ellipsis") === -1 && (item === "next" || item === "last" ? index >= count - 1 : index <= 0)),
        };
      }
    });

    return items;
  },

  openLink(uri, targetOrEvent) {
    let target;

    // form Mobile wrapper open links to new window
    if (Environment.isMobileApp) {
      target = "_blank";
    } else {
      target =
        typeof targetOrEvent === "string"
          ? targetOrEvent
          : targetOrEvent && (targetOrEvent.ctrlKey || targetOrEvent.metaKey || targetOrEvent.button === 1)
            ? "_blank"
            : "_self";
    }

    window.open(uri, target, "noopener");
  },

  deepEqualItemListExceptEventHandlerOrKnownProps(itemList, prevItemList) {
    if (!Array.isArray(itemList) || !Array.isArray(prevItemList)) return Utils.Object.deepEqual(itemList, prevItemList);
    if (itemList.length !== prevItemList.length) return false;
    for (let i = 0; i < itemList.length; i++) {
      let item = itemList[i];
      let prevItem = prevItemList[i];
      if (typeof item !== "object" || typeof prevItem !== "object" || !item || !prevItem) {
        if (!Utils.Object.deepEqual(item, prevItem)) return false;
        continue;
      }
      let remainingPrevItemKeys = new Set(Object.keys(prevItem));
      for (let k in item) {
        remainingPrevItemKeys.delete(k);
        if (/^on[A-Z]/.test(k)) continue; // skip event handlers comparisons (props onXyz)
        // assume that some props, e.g. pressed, does not affect sizing (without this, in richtext toolbar
        // there was an issue that if we were in `Ordered list`, i.e. the toolbar button was `pressed: true`
        // and then we went into three dots (collapse menu) and hovered over `Ordered list` and tried to click
        // one of list types in submenu, e.g. roman, the mousedown would result in changing `pressed` which
        // caused re-measuring in ActionGroup, which then caused the submenu to close before click happenned)
        // TODO :-/ Do somehow better.
        if (k === "pressed") continue;
        if (k === "itemList") {
          // we assume that itemList is used for showing values in a popover / menu, i.e. it doesn't affect
          // main element sizing
          let hadItemList = (prevItem[k]?.length || 0) > 0;
          let hasItemList = (item[k]?.length || 0) > 0;
          if (hadItemList !== hasItemList) return false;
        } else {
          if (!Utils.Object.deepEqual(item[k], prevItem[k])) return false;
        }
      }
    }
    return true;
  },

  combineListeners(...fnList) {
    let resultList = fnList.filter((fn) => typeof fn === "function");
    return resultList.length <= 1
      ? resultList[0]
      : (...args) => {
          for (let fn of resultList) fn(...args);
        };
  },

  getKeyWithModifiers(e) {
    return [e.ctrlKey && "Ctrl", e.altKey && "Alt", e.metaKey && "Meta", e.shiftKey && "Shift", e.key]
      .filter(Boolean)
      .join("+");
  },

  mergeProps,

  getDaysDiff(fromDate, toDate) {
    // NOTE Assuming that dates are on day boundaries (time is 00:00:00.000, or at least same in both)
    if (fromDate >= toDate) return 0;
    return Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
  },

  ensureVisualComponentDefinedProps(props = {}, list = VisualComponentPropList) {
    const newProps = {};

    for (let key of list) {
      if (props[key] === undefined) continue;
      if (key === "elementAttrs") {
        const keys = Object.keys(props[key]);
        //ignore data-name
        if (keys.length === 1 && keys[0] === "data-name") continue;
      }

      newProps[key] = props[key];
    }

    if (Object.keys(newProps)?.length) return newProps;
  },
};

function mergeProps(props, defaultProps) {
  if (!defaultProps || !props) return defaultProps || props;
  let elementRef = Utils.Component.combineRefs(defaultProps.elementRef, props.elementRef);
  let ref = Utils.Component.combineRefs(defaultProps.ref, props.ref);
  let className = Utils.Css.joinClassName(defaultProps.className, props.className);
  let elementAttrs =
    defaultProps.elementAttrs || props.elementAttrs
      ? { ...defaultProps.elementAttrs, ...props.elementAttrs }
      : undefined;
  let style = defaultProps.style || props.style ? { ...defaultProps.style, ...props.style } : undefined;

  let resultProps = { ...props, elementRef, ref, className, elementAttrs, style };

  for (let key in defaultProps) {
    if (resultProps[key] === undefined) resultProps[key] = defaultProps[key];
  }

  for (let key in resultProps) {
    if (resultProps[key] === undefined) delete resultProps[key];
  }

  return resultProps;
}

function getByKey(item, key) {
  if (item == null || typeof key !== "string") return null;
  if (key.indexOf(".") === -1) return item[key];
  let result = item;
  let parts = key.split(".");
  for (let i = 0; i < parts.length && result != null; i++) result = result[parts[i]];
  return result;
}

export default Tools;
