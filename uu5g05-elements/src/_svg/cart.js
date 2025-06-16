//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Cart = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Cart",
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
    const uu5Tag = Cart.uu5Tag;
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
            d="m79.9918 87.4093c-10.3727 0-17.7571 10.0779-14.6316 19.9687l18.7901 59.461c2.0169 6.382 7.9381 10.721 14.6316 10.721h93.6611c2.65 0 4.958-1.81 5.589-4.384l19.277-78.6424c.42-1.7165.029-3.5312-1.062-4.9217s-2.76-2.2026-4.527-2.2026zm-3.6579 16.5007c-.7813-2.473 1.0648-4.9921 3.6579-4.9921h11.8468v17.2631h-11.627zm6.3022 19.943h9.2025v17.263h-3.7473zm7.8797 24.936 1.3228 4.185v-4.185zm8.9952 0v17.262h15.345v-17.262zm38.362 17.262h-15.345v-17.262h15.345zm7.672 0h15.345v-17.262h-15.345zm38.362 0h-15.344v-17.262h15.344zm7.673-3.157 3.457-14.105h-3.457zm0-21.778h5.338l4.232-17.263h-9.57zm-7.673-17.263h-15.344v17.263h15.344zm0-7.672h-15.344v-17.2631h15.344zm7.673 0h11.45l4.232-17.2631h-15.682zm-46.035 7.672h15.345v17.263h-15.345zm0-7.672h15.345v-17.2631h-15.345zm-7.672 7.672h-15.345v17.263h15.345zm0-7.672h-15.345v-17.2631h15.345zm-23.017 0v-17.2631h-15.345v17.2631zm0 24.935v-17.263h-15.345v17.263z"
          />
          <filter id={uu5Tag + "-b"} height="152.1%" width="130.8%" x="-15.4%" y="-23.8%">
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
            d="m200.508 187.827c-1.321-1.686-3.911-3.548-8.65-4.511-1.541-.313-2.887-1.243-3.725-2.574-.837-1.332-1.093-2.948-.709-4.473l25.895-102.6181c.777-3.0814 3.906-4.9491 6.987-4.1715s4.949 3.9059 4.172 6.9873l-24.548 97.2813c4.04 1.627 7.295 3.991 9.637 6.981 3.392 4.329 4.512 9.533 3.691 14.455-1.639 9.829-10.72 17.861-23.117 17.861l-116.0449.959c-3.178 0-5.7543-3.536-5.7543-6.714s2.5763-6.713 5.7543-6.713l116.0449.959c7.264 0 11.13-4.436 11.765-8.245.316-1.895-.095-3.802-1.398-5.464z"
          />
        </defs>
        <g fill="none" fillRule="evenodd">
          <circle cx="180.071" cy="208.249" fill="currentColor" fillRule="nonzero" r="18.222" />
          <circle cx="98.5518" cy="208.249" fill="currentColor" fillRule="nonzero" r="18.222" />
          <use fill="#000" filter={"url(#" + uu5Tag + "-b)"} xlinkHref={"#" + uu5Tag + "-a"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-a"} />
          <g fillRule="nonzero">
            <g>
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-c"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-c"} />
            </g>
            <path
              d="m221.31 82.6139c-4.237 0-7.672-3.435-7.672-7.6724s3.435-7.6724 7.672-7.6724h23.018c4.237 0 7.672 3.435 7.672 7.6724s-3.435 7.6724-7.672 7.6724z"
              fill="currentColor"
            />
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Cart };
export default Cart;
