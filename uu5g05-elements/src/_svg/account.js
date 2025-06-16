//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Account = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Account",
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
    const uu5Tag = Account.uu5Tag;
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
            d="m95 100c0-5.5228 4.4772-10 10-10h90c5.523 0 10 4.4772 10 10v120c0 5.523-4.477 10-10 10h-90c-5.5229 0-10-4.477-10-10z"
          />
          <filter id={uu5Tag + "-b"} height="133.6%" width="142.7%" x="-21.4%" y="-15.4%">
            <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
            <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="7.5" />
            <feColorMatrix
              in="shadowBlurOuter1"
              type="matrix"
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.12 0"
            />
          </filter>
          <rect id={uu5Tag + "-c"} height="8" rx="4" width="40" x="130" y="199" />
          <path
            id={uu5Tag + "-d"}
            d="m138 71c0-4.4183 3.582-8 8-8h8c4.418 0 8 3.5817 8 8v28c0 4.418-3.582 8-8 8h-8c-4.418 0-8-3.582-8-8z"
          />
          <filter id={uu5Tag + "-e"} height="206.8%" width="295.8%" x="-97.9%" y="-48.9%">
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
          <g fillRule="nonzero">
            <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-c"} />
            <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-c"} />
          </g>
          <path
            d="m118 191c0-2.209 1.791-4 4-4h56c2.209 0 4 1.791 4 4s-1.791 4-4 4h-56c-2.209 0-4-1.791-4-4z"
            fill="currentColor"
            fillRule="nonzero"
          />
          <path
            d="m150 146.304c9.941 0 18 7.964 18 17.788-.278 9.152-35.268 9.269-36 0 0-9.756 8.311-17.788 18-17.788zm-.133-19.304c4.627 0 8.379 3.737 8.379 8.347 0 4.575-3.877 8.348-8.379 8.348-4.625-.008-8.372-3.741-8.38-8.348 0-4.61 3.752-8.347 8.38-8.347z"
            fill="currentColor"
          />
          <g fillRule="nonzero">
            <use fill="#000" filter={"url(#" + uu5Tag + "-e)"} xlinkHref={"#" + uu5Tag + "-d"} />
            <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-d"} />
            <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-d"} />
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Account };
export default Account;
