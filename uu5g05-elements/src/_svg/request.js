//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Request = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Request",
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
    const uu5Tag = Request.uu5Tag;
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
          <path
            id={uu5Tag + "-c"}
            d="m147.897 208c3.981 0 7.881-.673 11.701-2.02 3.819-1.346 7.217-3.25 10.195-5.713s5.389-5.714 7.234-9.753 2.767-8.554 2.767-13.546h13.206l-22.527-21.968-22.624 21.968h16.021c0 3.284-.793 6.141-2.379 8.571s-3.56 4.187-5.923 5.27c-2.363 1.084-4.92 1.626-7.671 1.626s-5.308-.542-7.671-1.626c-2.362-1.083-4.337-2.84-5.923-5.27s-2.379-5.287-2.379-8.571h-15.924c0 4.992.906 9.507 2.719 13.546 1.812 4.039 4.224 7.29 7.234 9.753s6.424 4.367 10.244 5.713c3.819 1.347 7.719 2.02 11.7 2.02z"
          />
          <path id={uu5Tag + "-d"} d="m116 139h61v8h-61z" />
          <path id={uu5Tag + "-e"} d="m116 123h61v8h-61z" />
        </defs>
        <g fill="none" fillRule="evenodd">
          <use fill="#000" filter={"url(#" + uu5Tag + "-b)"} xlinkHref={"#" + uu5Tag + "-a"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-a"} />
          <path
            d="m174.014 75.6711 34.297 33.4179c.919.895.919 2.345 0 3.24-.441.43-1.039.671-1.662.671h-21.791c-8.206 0-14.858-6.482-14.858-14.4769v-21.232c0-1.2653 1.053-2.2911 2.351-2.2911.624 0 1.222.2414 1.663.6711z"
            fill="currentColor"
          />
          <g fillRule="nonzero">
            <g>
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-c"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-c"} />
            </g>
            <g>
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-d"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-d"} />
            </g>
            <g>
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-e"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-e"} />
            </g>
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Request };
export default Request;
