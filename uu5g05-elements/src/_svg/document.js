//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Document = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Document",
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
    const uu5Tag = Document.uu5Tag;
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
            d="m108 74.6991h64.172c.53 0 1.039.2104 1.414.585l35.453 35.4149v96c0 9.941-8.059 18-18 18h-83.039c-9.9411 0-18-8.059-18-18v-113.9999c0-9.9411 8.0589-18 18-18z"
          />
          <filter id={uu5Tag + "-b"} height="131.3%" width="139.5%" x="-19.7%" y="-14.3%">
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
            d="m174.014 75.6711 34.297 33.4179c.919.895.919 2.345 0 3.24-.441.43-1.039.671-1.662.671h-21.791c-8.206 0-14.858-6.482-14.858-14.4769v-21.232c0-1.2653 1.053-2.2911 2.351-2.2911.624 0 1.222.2414 1.663.6711z"
            fill="currentColor"
          />
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Document };
export default Document;
