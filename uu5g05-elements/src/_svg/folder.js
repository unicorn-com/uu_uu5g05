//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Folder = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Folder",
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
    const uu5Tag = Folder.uu5Tag;
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
            d="m203.475 102.894872h-59.65l-2.375-4.7706001c-2.776-5.5859-8.479-9.1204-14.724-9.1242719h-38.5568c-6.2667-.0284281-12.0015 3.5128719-14.7755 9.1242719l-1.6447 3.2846001c-1.1484 2.29-1.7473 4.816-1.749 7.377v85.713c.0144 9.107 7.4042 16.487 16.5245 16.501h116.9505c9.121-.014 16.511-7.394 16.525-16.501v-75.077c0-9.117-7.394-16.513-16.525-16.527z"
          />
          <path
            id={uu5Tag + "-b"}
            d="m111.6183 122h117.916c8.837 0 16 7.164 16 16 0 2.261-.479 4.497-1.406 6.559l-25.618 57c-2.582 5.745-8.295 9.441-14.594 9.441h-117.9163c-8.8365 0-16-7.163-16-16 0-2.261.4793-4.497 1.4062-6.559l25.6181-57c2.582-5.745 8.295-9.441 14.594-9.441z"
          />
          <filter id={uu5Tag + "-c"} height="152.8%" width="126.8%" x="-13.4%" y="-24.2%">
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
          <path
            d="m143.7316 102.894872-2.375-4.7706001c-2.776-5.5859-8.479-9.1204-14.724-9.1241h-38.5568c-6.2667-.0286-12.0015 3.5127-14.7755 9.1241-.7874 1.5725-1.6693 3.1256001-2.3003 4.7706001z"
            fill="currentColor"
          />
          <use fill="#000" filter={"url(#" + uu5Tag + "-c)"} xlinkHref={"#" + uu5Tag + "-b"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-b"} />
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Folder };
export default Folder;
