//@@viewOn:imports
import { Content, createVisualComponent, Fragment, Lsi, useState, Utils, PropTypes, useContentSize } from "uu5g05";
import Config from "./config/config.js";
import UuGds from "./_internal/gds";
import Grid from "./grid";
import Label from "./label";
import Link from "./link";
import GridItem from "./grid-item";
import Icon from "./icon";
import Text from "./text";
import CollapsibleBox from "./collapsible-box";
import ActionGroup from "./action-group";
import Line from "./line";
import importLsi from "./lsi/import-lsi";
//@@viewOff:imports

//@@viewOn:constants
const smallScreen = ["xs", "s"];
const itemListPropTypes = PropTypes.arrayOf(
  PropTypes.shape({
    label: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
    info: PropTypes.lsi,
    children: PropTypes.node,
    actionList: PropTypes.array,
  }),
);
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
function LabelBox({ children, info, actionList }) {
  const contentSize = useContentSize();
  const displayActionList = actionList && smallScreen.includes(contentSize);

  return (
    <GridItem
      className={Config.Css.css({
        display: "flex",
        justifyContent: "space-between",
        gap: UuGds.SpacingPalette.getValue(["fixed", "c"]),
        alignItems: smallScreen.includes(contentSize) ? "end" : undefined,
        alignSelf: smallScreen.includes(contentSize) ? "end" : undefined,
        minHeight: smallScreen.includes(contentSize)
          ? undefined
          : UuGds.SizingPalette.getValue(["spot", "basic", "s"]).h,
        // paddingTop: 8,
      })}
    >
      <Label info={info}>
        {typeof children === "object" && !Utils.Element.isValid(children) ? <Lsi lsi={children} /> : children}
      </Label>
      {displayActionList && <ActionGroup size="xs" itemList={actionList} />}
    </GridItem>
  );
}

function Value({ children, actionList }) {
  const contentSize = useContentSize();

  const positionAfterList = [];
  const positionEndList = [];

  if (Array.isArray(actionList)) {
    actionList.forEach(({ position, ...item }) => {
      if (position === "end") {
        positionEndList.push(item);
      } else {
        positionAfterList.push(item);
      }
    });
  }

  const displayStableList = positionEndList.length > 0 && !smallScreen.includes(contentSize);
  const displayHoverList = positionAfterList.length > 0 && !smallScreen.includes(contentSize);

  const btnClassName = displayHoverList
    ? Config.Css.css({
        opacity: 0,
        transition: "opacity 0.5s ease",
        marginLeft: UuGds.SpacingPalette.getValue(["fixed", "c"]),
        pointerEvents: "none",
        alignSelf: "start",
        "&&": {
          //Note: We cannot set left alignment on ActionGroup due the scrollable feature. This change default right alignment of the ActionGroup to be left.
          textAlign: "start",
          justifyContent: "start",
          "> div": {
            justifyContent: "start",
          },
        },
      })
    : null;

  function getGridClassName() {
    if (actionList?.length && !smallScreen.includes(contentSize)) {
      return Config.Css.css({
        display: "flex",
        alignItems: "center",
        ["&:hover ." + btnClassName]: { opacity: 1, pointerEvents: "all" },
      });
    }
    if (smallScreen.includes(contentSize)) return Config.Css.css({ alignSelf: "center" });
  }

  return (
    <Text category="interface" segment="content" type="medium" colorScheme="building">
      {({ style }) => (
        <GridItem className={getGridClassName()} style={style}>
          <Content>{children}</Content>
          {displayHoverList && <ActionGroup size="s" itemList={positionAfterList} className={btnClassName} />}
          {displayStableList && <ActionGroup size="s" itemList={positionEndList} />}
        </GridItem>
      )}
    </Text>
  );
}

function Row({ label, children, info, actionList, divider }) {
  const contentSize = useContentSize();

  return divider ? (
    <Line
      significance="subdued"
      className={Config.Css.css(
        smallScreen.includes(contentSize) ? { alignSelf: "center" } : { gridColumn: "span 2", marginTop: -6 },
      )}
    />
  ) : (
    <Fragment>
      <LabelBox info={info} actionList={actionList}>
        {label}
      </LabelBox>
      <Value actionList={actionList}>{children}</Value>
    </Fragment>
  );
}
//@@viewOff:helpers

const ListLayout = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ListLayout",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: itemListPropTypes.isRequired,
    collapsibleItemList: itemListPropTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList, collapsibleItemList, ...propsToPass } = props;

    const [open, setOpen] = useState(false);
    const contentSize = useContentSize();

    const rowHeight = UuGds.SizingPalette.getValue(["spot", "basic", "s"]).h;
    const rowGap = smallScreen.includes(contentSize) ? 0 : UuGds.SpacingPalette.getValue(["fixed", "c"]);

    const gridProps = {
      templateColumns: { xs: "1fr", m: "min(20%, 200px) auto" },
      autoRows: smallScreen.includes(contentSize) ? `minmax(${rowHeight}px, auto)` : undefined,
      rowGap,
      columnGap: UuGds.SpacingPalette.getValue(["fixed", "e"]),
      alignItems: "baseline",
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Grid {...gridProps} {...propsToPass}>
        {itemList.map((item, i) => (
          <Row key={i} {...item} />
        ))}
        {collapsibleItemList && (
          <>
            <GridItem
              colSpan={smallScreen.includes(contentSize) ? undefined : 2}
              alignSelf={smallScreen.includes(contentSize) ? "start" : undefined}
            >
              <Text category="interface" segment="interactive" type="medium">
                {({ style: textStyle }) => (
                  <Link
                    colorScheme="building"
                    significance="subdued"
                    onClick={(e) => setOpen(!open)}
                    className={Config.Css.css({
                      ...textStyle,
                      textDecoration: "none!important",
                      display: "inline-block",
                      marginTop: UuGds.SpacingPalette.getValue(["fixed", "d"]),
                    })}
                  >
                    <Lsi import={importLsi} path={[open ? "showLess" : "showMore"]} />
                    <Icon
                      icon={open ? "uugds-chevron-up" : "uugds-chevron-down"}
                      className={Config.Css.css({
                        fontSize: UuGds.SizingPalette.getValue(["inline", "emphasized"]),
                        lineHeight: "0.8em",
                        marginLeft: 4,
                      })}
                    />
                  </Link>
                )}
              </Text>
              <Grid {...gridProps}>
                {({ style }) => (
                  <CollapsibleBox collapsed={!open} className={Config.Css.css({ ...style, marginTop: rowGap })}>
                    {collapsibleItemList.map((item, i) => (
                      <Row key={i} {...item} />
                    ))}
                  </CollapsibleBox>
                )}
              </Grid>
            </GridItem>
          </>
        )}
      </Grid>
    );
  },
});

//@@viewOn:exports
export { ListLayout };
export default ListLayout;
//@@viewOff:exports
