//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Product = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Product",
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
    const uu5Tag = Product.uu5Tag;
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
            d="m61.8218 104.882c0-1.597.9501-3.042 2.4168-3.674l83.0714-35.8035c1.011-.4355 2.156-.4355 3.167 0l83.072 35.8035c1.466.632 2.416 2.077 2.416 3.674v88.999c0 1.591-.942 3.03-2.4 3.666l-83.071 36.255c-1.021.445-2.18.445-3.2 0l-83.0722-36.255c-1.4577-.636-2.4-2.075-2.4-3.666z"
          />
          <filter id={uu5Tag + "-b"} height="127.8%" width="127%" x="-13.5%" y="-12.7%">
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
            d="m66.5767 100.201 86.9263 37.59 81.725-35.223c.47.662.737 1.467.737 2.314v88.999c0 1.591-.942 3.03-2.4 3.666l-83.071 36.255c-.511.222-1.055.334-1.6.334v-89.622l-87.0723-37.654v-1.978c0-1.597.9501-3.041 2.4168-3.674z"
          />
        </defs>
        <g fill="none" fillRule="evenodd">
          <use fill="#000" filter={"url(#" + uu5Tag + "-b)"} xlinkHref={"#" + uu5Tag + "-a"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-a"} />
          <g fillRule="nonzero">
            <g>
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-c"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-c"} />
            </g>
            <path
              d="m105.863 83.2695 16.086-6.9414 85.656 38.1449-.008.0021.001 32.3689-16.011 7.028v-32.5z"
              fill="currentColor"
            />
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Product };
export default Product;
