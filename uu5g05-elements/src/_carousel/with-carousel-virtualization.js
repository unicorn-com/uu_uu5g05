//@@viewOn:imports
import { createComponent, useRef, Utils } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

function withCarouselVirtualization(Component) {
  const Comp = createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withCarouselVirtualization(${Component.uu5Tag || ""})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Component.propTypes,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Component.defaultProps,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { index } = props;
      const { children, ...otherProps } = props;
      const childList = Utils.Content.toArray(children);

      // Remember items that were already rendered once
      const renderedItemIndexCacheRef = useRef({});

      const virtualizedChildren = childList.map((child, i) => {
        // Render only items whose index difference is 1 compared to the active index
        // or if they were already rendered once
        let render = Math.abs(index - i) <= 1 || i in renderedItemIndexCacheRef.current;
        if (render) renderedItemIndexCacheRef.current[i] = true;
        return render ? child : <div className={CLASS_NAMES.ghostChild()} key={i} />;
      });
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return <Component {...otherProps}>{virtualizedChildren}</Component>;
      //@@viewOff:render
    },
  });

  Utils.Component.mergeStatics(Comp, Component);
  Comp.uu5ComponentType = Component.uu5ComponentType;

  return Comp;
}

//@@viewOn:helpers
const CLASS_NAMES = {
  ghostChild: () => Config.Css.css({ display: "contents" }),
};
//@@viewOff:helpers

export { withCarouselVirtualization };
export default withCarouselVirtualization;
