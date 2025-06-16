//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config";
//@@viewOff:imports

const Items = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Items",
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
    const uu5Tag = Items.uu5Tag;
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
            d="m61.8956 82.165 123.0754-15.1118c7.675-.9422 14.66 4.5152 15.602 12.1895l15.112 123.0753c.942 7.675-4.515 14.66-12.189 15.602l-123.0762 15.112c-7.6744.942-14.6595-4.515-15.6018-12.189l-15.1118-123.0761c-.9423-7.6744 4.5151-14.6596 12.1894-15.6019z"
          />
          <path
            id={uu5Tag + "-b"}
            d="m116.835 64.4311 122.116 21.5323c7.614 1.3427 12.699 8.6039 11.356 16.2186l-21.532 122.116c-1.343 7.615-8.604 12.699-16.219 11.356l-122.1157-21.532c-7.6145-1.343-12.6989-8.604-11.3563-16.219l21.532-122.1157c1.343-7.6145 8.604-12.6989 16.219-11.3562z"
          />
          <filter id={uu5Tag + "-c"} height="127.4%" width="127.4%" x="-13.7%" y="-12.5%">
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
          <g fillRule="nonzero">
            <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-a"} />
            <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-a"} />
          </g>
          <use fill="#000" filter={"url(#" + uu5Tag + "-c)"} xlinkHref={"#" + uu5Tag + "-b"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-b"} />
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Items };
export default Items;
