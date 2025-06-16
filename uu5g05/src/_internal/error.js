//@@viewOn:imports
import createVisualComponent from "../create-component/create-visual-component.js";
import Config from "../config/config.js";
import NestingLevel from "../utils/nesting-level.js";
import VisualComponent from "../utils/visual-component.js";
//@@viewOff:imports

const CLASS_NAMES = {
  // FIXME Use colors from GDS.
  main: ({ asBox }) => Config.Css.css`
    color: #d50000;
    ${
      asBox
        ? `display: flex;
            padding: 8px;
            background-color: #FFEBEE;
            min-height: 48px;
            align-items: center;`
        : `display: inline`
    }
  `,
  icon: ({ asBox }) => Config.Css.css`
    ${
      asBox
        ? `flex: none;
            font-size: 32px;
            line-height: 32px;
            align-self: top;
            padding-right: 16px;`
        : `padding-right: 4px;`
    }
  `,
};

const STATICS = {
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Error",
  nestingLevel: NestingLevel.buildList("areaCollection", "box"),
  //@@viewOff:statics
};

export const Error = createVisualComponent({
  ...STATICS,

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const currentNestingLevel = NestingLevel.getNestingLevel(props, STATICS);
    const asBox = !!currentNestingLevel;
    const attrs = VisualComponent.getAttrs(props, CLASS_NAMES.main({ asBox }));
    const Tag = asBox ? "div" : "span";
    // NOTE Not using Utils.Content.build() because of cyclic dependencies:
    //   Content => Uu5String => DynamiComponent => Error => Content
    // If this component is published, it should use Content.build() somehow.
    // FIXME Icon loading.
    return (
      <Tag {...attrs}>
        <i className={"uugds uugds-alert-circle " + CLASS_NAMES.icon({ asBox })} />
        {children}
      </Tag>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export default Error;
