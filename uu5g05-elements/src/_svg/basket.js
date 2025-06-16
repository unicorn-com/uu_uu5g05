//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Basket = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Basket",
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
    const uu5Tag = Basket.uu5Tag;
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
            d="m77.0824 126.048h145.8356c12.472 0 21.35 12.118 17.592 24.01l-22.592 71.495c-2.426 7.674-9.545 12.891-17.593 12.891h-100.6498c-8.0481 0-15.1677-5.217-17.5928-12.891l-22.5928-71.495c-3.758-11.892 5.1208-24.01 17.5928-24.01zm123.2426 94.558c2.012 0 3.792-1.304 4.398-3.223l.213-.675v-7.675h-14.428v11.573zm-9.817-20.798h14.428v-14.429h-14.428zm-9.225-14.429v14.429h-14.429v-14.429zm9.225-9.225h14.428v-14.428h-14.428zm-9.225-14.428v14.428h-14.429v-14.428zm9.225-9.225v-12.615h14.428v12.615zm23.653 9.225v14.428h3.591l4.559-14.428zm11.065-9.225h-11.065v-12.615h8.757c3.118 0 5.337 3.029 4.398 6.002zm-10.39 32.878h-.675v2.136zm-33.553-32.878h-14.429v-12.615h14.429zm-23.654 0v-12.615h-14.429v12.615zm-23.654 0v-12.615h-14.428v12.615zm-14.428 9.225h14.428v14.428h-14.428zm-9.226-9.225v-12.615h-14.8221v12.615zm-14.8221 9.225h14.8221v14.428h-14.8221zm-9.2251-9.225v-12.615h-9.1914c-3.118 0-5.3377 3.029-4.3982 6.002l2.0895 6.613zm-8.5849 9.225h8.5849v14.428h-4.0254zm7.4747 23.653 1.1102 3.514v-3.514zm10.3353 0v14.429h14.8221v-14.429zm24.0481 0v14.429h14.428v-14.429zm23.653 0v14.429h14.429v-14.429zm14.429-9.225v-14.428h-14.429v14.428zm0 32.879h-14.429v11.573h14.429zm-23.654 0h-14.428v11.573h14.428zm-23.654 0h-14.8221v8.919c.751 1.603 2.3701 2.654 4.1763 2.654h10.6458zm56.533 0h14.429v11.573h-14.429z"
          />
          <filter id={uu5Tag + "-b"} height="143.4%" width="125.7%" x="-12.9%" y="-19.8%">
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
            d="m58.619 152.501c-5.3124 0-9.619-4.307-9.619-9.62v-9.619c0-5.312 4.3066-9.619 9.619-9.619h182.762c5.312 0 9.619 4.307 9.619 9.619v9.619c0 5.313-4.307 9.62-9.619 9.62z"
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
              d="m161.985 60.5961c-4.351 3.0471-5.409 9.045-2.362 13.3967l46.323 66.1562c3.047 4.352 9.045 5.409 13.397 2.362s5.409-9.045 2.362-13.396l-46.323-66.1567c-3.047-4.3517-9.045-5.4093-13.397-2.3622z"
              fill="currentColor"
            />
            <path
              d="m81.5426 142.404c-4.3517-3.047-5.4093-9.045-2.3622-13.397l46.3226-66.156c3.048-4.3517 9.045-5.4093 13.397-2.3622s5.41 9.045 2.362 13.3967l-46.3227 66.1565c-3.0471 4.351-9.045 5.409-13.3967 2.362z"
              fill="currentColor"
            />
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Basket };
export default Basket;
