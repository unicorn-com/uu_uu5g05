//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Forbidden = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Forbidden",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    color: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    color: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { color } = props;
    const uu5Tag = Forbidden.uu5Tag;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props);

    return (
      <svg
        {...attrs}
        style={{ color }}
        height="300"
        viewBox="0 0 300 300"
        width="300"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          <path
            id={uu5Tag + "-a"}
            d="m63.3397 154.942c-1.7863-3.094-1.7863-6.906 0-10l39.2263-67.942c1.787-3.094 5.088-5 8.66-5h78.453c3.573 0 6.874 1.906 8.661 5l39.226 67.942c1.787 3.094 1.787 6.906 0 10l-39.226 67.943c-1.787 3.094-5.088 5-8.661 5h-78.453c-3.572 0-6.873-1.906-8.66-5z"
          />
          <filter id={uu5Tag + "-b"} height="130.2%" width="126.6%" x="-13.3%" y="-13.8%">
            <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
            <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="7.5" />
            <feColorMatrix
              in="shadowBlurOuter1"
              type="matrix"
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.12 0"
            />
          </filter>
        </defs>
        <g fill="none" fillRule="evenodd">
          <use fill="#000" filter={"url(#" + uu5Tag + "-b)"} xlinkHref={"#" + uu5Tag + "-a"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-a"} />
          <path
            d="m127.759 114.521c-1.562-1.562-4.094-1.562-5.656 0l-7.072 7.071c-1.562 1.562-1.562 4.095 0 5.657l23.047 23.046-22.694 22.694c-1.562 1.562-1.562 4.095 0 5.657l7.071 7.071c1.563 1.562 4.095 1.562 5.657 0l22.694-22.694 22.208 22.208c1.562 1.562 4.095 1.562 5.657 0l7.071-7.071c1.562-1.562 1.562-4.094 0-5.657l-22.208-22.208 22.561-22.561c1.562-1.562 1.562-4.095 0-5.657l-7.071-7.071c-1.562-1.562-4.095-1.562-5.657 0l-22.561 22.561z"
            fill="currentColor"
            fillRule="nonzero"
          />
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Forbidden };
export default Forbidden;
