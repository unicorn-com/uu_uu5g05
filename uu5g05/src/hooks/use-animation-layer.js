//@@viewOn:imports
import String from "../utils/string";
import Dom from "../utils/dom";
import Element from "../utils/element";
import Css from "../utils/css";
import { useState, useEffect } from "../hooks/react-hooks";
import { useAnimationLayerContext } from "../contexts/animation-layer-context";
import Config from "../config/config";
//@@viewOff:imports

function useAnimationLayer(componentJsx, { _prefixId } = {}) {
  const { render, register, unregister } = useAnimationLayerContext();
  const [stateId] = useState(() => String.generateId());
  const id = (_prefixId ? _prefixId + "-" : "") + stateId;

  useEffect(() => {
    register(id);
    return () => unregister(id);
  }, []);

  return {
    render: ({ position, _relative } = {}) => {
      let [result, error] = render(id);
      if (result) {
        result = _relative
          ? componentJsx
          : Dom.createPortal(
              Element.clone(componentJsx, {
                className: Css.joinClassName(
                  componentJsx.props.className,
                  Config.Css.css({
                    position: "fixed",
                    ...(position ?? { right: 16, bottom: 16 }),
                  }),
                ),
              }),
              result,
            );
      }

      return [result, error];
    },
  };
}

//@@viewOn:exports
export { useAnimationLayer };
export default useAnimationLayer;
//@@viewOff:exports
