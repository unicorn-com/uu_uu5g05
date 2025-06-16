//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Message = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Message",
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
    const uu5Tag = Message.uu5Tag;
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
            d="m147.6 54.7151c1.422-.9535 3.378-.9535 4.8 0l76 50.9499c1.007.675 1.6 1.735 1.6 2.86v101.9c0 1.974-1.791 3.575-4 3.575h-152c-2.2091 0-4-1.601-4-3.575v-101.9c0-1.125.5928-2.185 1.6-2.86z"
          />
          <filter id={uu5Tag + "-b"} height="129.4%" width="129.4%" x="-14.7%" y="-13.4%">
            <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
            <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="7.5" />
            <feColorMatrix
              in="shadowBlurOuter1"
              type="matrix"
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.12 0"
            />
          </filter>
          <path id={uu5Tag + "-c"} d="m70 214h160l-80-53.631z" />
          <filter id={uu5Tag + "-d"} height="187.6%" width="129.4%" x="-14.7%" y="-40.1%">
            <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
            <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="7.5" />
            <feColorMatrix
              in="shadowBlurOuter1"
              type="matrix"
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.2 0"
            />
          </filter>
          <path id={uu5Tag + "-e"} d="m150 53.1061 80 53.6309-80 53.632-80-53.632z" />
          <linearGradient id={uu5Tag + "-f"} x1="50%" x2="50%" y1="0%" y2="100%">
            <stop offset="0" stopOpacity="0" />
            <stop offset="1" />
          </linearGradient>
          <mask id={uu5Tag + "-g"} fill="#fff">
            <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-a"} />
          </mask>
        </defs>
        <g fill="none" fillRule="evenodd">
          <use fill="#000" filter={"url(#" + uu5Tag + "-b)"} xlinkHref={"#" + uu5Tag + "-a"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-a"} />
          <g mask={"url(#" + uu5Tag + "-g)"}>
            <use fill="#000" filter={"url(#" + uu5Tag + "-d)"} xlinkHref={"#" + uu5Tag + "-c"} />
            <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-c"} />
          </g>
          <g fillRule="nonzero">
            <g mask={"url(#" + uu5Tag + "-g)"}>
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-e"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-e"} />
            </g>
            <path
              d="m70 106.737h160l-80 53.632z"
              fill={"url(#" + uu5Tag + "-f)"}
              fillOpacity=".15"
              mask={"url(#" + uu5Tag + "-g)"}
            />
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Message };
export default Message;
