//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const Delete = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Delete",
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
    const uu5Tag = Delete.uu5Tag;
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
            d="m17.4029246 22c0-6.627417 5.372583-12 12-12h63.1941508c6.627417 0 11.9999996 5.372583 11.9999996 12v6h13.402925c2.209139 0 4 1.790861 4 4v10c0 2.209139-1.790861 4-4 4h-114c-2.209139 0-4-1.790861-4-4v-10c0-2.209139 1.790861-4 4-4h13.4029246z"
          />
          <filter id={uu5Tag + "-b"} height="230.6%" width="138.5%" x="-19.3%" y="-59.7%">
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
            d="m17.4029246 10h87.1941504v6c0 6.627417-5.3725826 12-11.9999996 12h-63.1941508c-6.627417 0-12-5.372583-12-12z"
          />
          <path
            id={uu5Tag + "-d"}
            d="m98.5507451 125.689563h102.8985099l-9.007857 99.086429c-.561905 6.18095-5.74428 10.913571-11.950719 10.913571h-60.981358c-6.206439 0-11.388814-4.732621-11.950719-10.913571z"
          />
          <filter id={uu5Tag + "-e"} height="142.7%" width="145.7%" x="-22.8%" y="-19.5%">
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
          <g transform="matrix(.99756405 .06975647 -.06975647 .99756405 91.752992 64.310437)">
            <path
              d="m49.5 0h23c2.209139 0 4 1.790861 4 4v9h-31v-9c0-2.209139 1.790861-4 4-4z"
              fill="currentColor"
              fillRule="nonzero"
            />
            <use fill="#000" filter={"url(#" + uu5Tag + "-b)"} xlinkHref={"#" + uu5Tag + "-a"} />
            <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-a"} />
            <g fillRule="nonzero" transform="matrix(1 0 0 -1 0 38)">
              <use fill="currentColor" xlinkHref={"#" + uu5Tag + "-c"} />
              <use fill="#fff" fillOpacity=".6" xlinkHref={"#" + uu5Tag + "-c"} />
            </g>
          </g>
          <use fill="#000" filter={"url(#" + uu5Tag + "-e)"} xlinkHref={"#" + uu5Tag + "-d"} />
          <use fill="#fff" fillRule="evenodd" xlinkHref={"#" + uu5Tag + "-d"} />
          <g fill="currentColor" fillRule="nonzero">
            <rect height="80" rx="5" width="10" x="145" y="140.689563" />
            <path d="m178.639043 140.689563h.360957c2.562073 0 4.639043 2.07697 4.639043 4.639043 0 .115773-.004334.231505-.012993.346954l-5.279096 70.387953c-.195678 2.609031-2.369638 4.62605-4.985997 4.62605h-.360957c-2.562073 0-4.639043-2.07697-4.639043-4.639043 0-.115773.004334-.231505.012993-.346954l5.279096-70.387953c.195678-2.609031 2.369638-4.62605 4.985997-4.62605z" />
            <path
              d="m126.639043 140.689563h.360957c2.562073 0 4.639043 2.07697 4.639043 4.639043 0 .115773-.004334.231505-.012993.346954l-5.279096 70.387953c-.195678 2.609031-2.369638 4.62605-4.985997 4.62605h-.360957c-2.562073 0-4.639043-2.07697-4.639043-4.639043 0-.115773.004334-.231505.012993-.346954l5.279096-70.387953c.195678-2.609031 2.369638-4.62605 4.985997-4.62605z"
              transform="matrix(-1 0 0 1 248 0)"
            />
          </g>
        </g>
      </svg>
    );
    //@@viewOff:render
  },
});

export { Delete };
export default Delete;
