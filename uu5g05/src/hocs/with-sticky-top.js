import { useMemo } from "../hooks/react-hooks.js";
import useMemoObject from "../hooks/use-memo-object.js";
import useStickyTop from "../hooks/use-sticky-top.js";
import createComponent from "../create-component/create-component.js";
import UtilsComponent from "../utils/component.js";
import UtilsObject from "../utils/object.js";
import UtilsStyle from "../utils/style.js";
import PropTypes from "../prop-types.js";

function withStickyTop(Component, options = {}) {
  if (typeof options === "string") options = { stickyVisibility: options };
  const Comp = createComponent({
    uu5Tag: `withStickyTop(${Component.displayName})`,

    propTypes: {
      ...Component.propTypes,
      stickyVisibility: PropTypes.oneOf(["always", "onScrollUp"]),
    },

    defaultProps: {
      stickyVisibility: options?.stickyVisibility,
    },

    render(props) {
      const { stickyVisibility, style, elementRef, ...otherProps } = props;
      const propsToPass = useMemoObject(otherProps, UtilsObject.shallowEqual); // need to not change reference for the optimization to take place below
      const styleObject = typeof style === "string" ? UtilsStyle.parse(style) : style;

      const { ref, style: newStyle, metrics } = useStickyTop(stickyVisibility, options?.gatherMetrics);
      const usedStyle = useMemoObject(
        {
          ...styleObject,
          ...newStyle,
          transition: [styleObject?.transition, newStyle?.transition].filter(Boolean).join(", "),
        },
        UtilsObject.shallowEqual,
      );
      const result = useMemo(
        () => (
          <Component
            {...propsToPass}
            style={usedStyle}
            elementRef={UtilsComponent.combineRefs(ref, elementRef)}
            stickyTopMetrics={metrics}
          />
        ),
        [elementRef, metrics, propsToPass, ref, usedStyle],
      );

      return result;
    },
  });

  UtilsComponent.mergeStatics(Comp, Component);

  return Comp;
}

export { withStickyTop };
export default withStickyTop;
