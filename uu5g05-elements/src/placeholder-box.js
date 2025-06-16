//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, Lsi } from "uu5g05";
import Config from "./config/config.js";
import UuGds from "./_internal/gds.js";
import Box from "./box.js";
import Text from "./text.js";
import Button from "./button.js";
import Link from "./link.js";
import Icon from "./icon.js";
import InfoItem from "./info-item.js";
import Svg from "./svg.js";
import importLsi from "./lsi/import-lsi.js";
//@@viewOff:imports

function lsi(lsiCode) {
  return { import: importLsi, path: ["PlaceholderBox", lsiCode] };
}

const CODE_MAP = {
  items: { icon: "uugds-copy", header: lsi("items") },
  document: { icon: "uugdsstencil-media-document", header: lsi("document") },
  documents: { icon: "uugdsstencil-media-document-multi", header: lsi("documents") },
  folder: { icon: "uugds-folder-open", header: lsi("folder") },
  users: { icon: "uugds-account-multi", header: lsi("users") },
  search: { icon: "uugds-search", header: lsi("search") },
  permission: { icon: "uugds-lock-closed", header: lsi("permission") },
  account: { icon: "uugds-account-badge", header: lsi("account") }, // account-badge-outline (renamed in mdi 5.0.45)
  forbidden: { icon: "uugds-close-octagon", header: lsi("forbidden") },
  cart: { icon: "uugds-cart", header: lsi("cart") },
  basket: { icon: "uugds-basket", header: lsi("basket") },
  product: { icon: "uugds-package", header: lsi("product") },
  message: { icon: "uugds-email", header: lsi("message") },
  ticket: { icon: "uugds-ticket", header: lsi("ticket") },
  sprint: { icon: "uugds-sprint", header: lsi("sprint") },
  request: { icon: "uugdsstencil-media-file-move-outline", header: lsi("request") },
  activities: { icon: "uugds-activity", header: lsi("activities") },
  images: { icon: "uugds-image-multi", header: lsi("images") }, // image-filter (renamed in mdi 5.0.45)
  error: { icon: "uugds-alert", header: lsi("error") },
  offline: { icon: "uugds-wifi-off", header: lsi("offline") },
  delete: { icon: "uugds-delete", header: lsi("delete") },
  timer: { icon: "uugds-timer", header: lsi("timer") },
  role: { icon: "uugdsstencil-user-account", header: lsi("role") },
  security: { icon: "uugds-shield", header: lsi("security") },
  "document-check": { icon: "uugds-file-check", header: lsi("document-check") },
  kid: { icon: "uugds-kid", header: lsi("kid") },
  user: { icon: "uugds-account", header: lsi("user") },
  sync: { icon: "uugds-sync", header: lsi("sync") },
  favorites: { icon: "uugds-favorites", header: lsi("favorites") },
  notification: { icon: "uugds-bell", header: lsi("notification") },
  "payment-card": { icon: "uugds-credit-card", header: lsi("payment-card") },
  audio: { icon: "uugdsstencil-communication-headphones" },
  book: { icon: "uugdsstencil-education-book" },
  calendar: { icon: "uugds-calendar" },
  course: { icon: "uugdsstencil-education-badge-award" },
  "drag-and-drop": { icon: "uugdsstencil-uiaction-hand-point" },
  exit: { icon: "uugdsstencil-home-exit" },
  "female-user": { icon: "uugdsstencil-user-account" },
  gift: { icon: "uugdsstencil-commerce-basket" },
  "graduation-hat": { icon: "uugdsstencil-education-student-hat" },
  headphones: { icon: "uugdsstencil-communication-headphones" },
  money: { icon: "uugdsstencil-commerce-bank-notes" },
  "sand-clock": { icon: "uugdsstencil-time-sand-clock" },
  "save-template": { icon: "uugdsstencil-media-clipboard-plus" },
  "smile-happy": { icon: "uugdsstencil-edit-emoji-smile" },
  "smile-sad": { icon: "uugdsstencil-edit-emoji-sad" },
  chart: { icon: "uugdsstencil-chart-bar-line-chart" },
  "study-materials": { icon: "uugdsstencil-education-book-index" },
  tag: { icon: "uugdsstencil-commerce-tag" },
  upload: { icon: "uugdsstencil-uiaction-upload" },
  video: { icon: "uugdsstencil-media-play-circle" },
  disclaimer: { icon: "uugdsstencil-home-lightbulb-glow" },
  table: { icon: "uugdsstencil-media-table" },
  registration: { icon: "uugdsstencil-user-account-plus" },
  "component-error": { icon: "uugdsstencil-edit-emoji-sad" },
  "file-error": { icon: "uugdsstencil-edit-emoji-sad" },
  "image-error": { icon: "uugdsstencil-edit-emoji-sad" },
  file: { icon: "uugdsstencil-media-file" },
  stop: { icon: "uugdsstencil-uiaction-stop" },
  "video-error": { icon: "uugdsstencil-edit-emoji-sad" },
};

const SVG_MAP = {
  permission: "lock",
};

const BUTTON_SIZE = {
  s: 176,
  m: 280,
  l: 392,
};

function getStyles({ size, borderRadius, header, significance, color, actionDirection }) {
  const fixedSpacingC = UuGds.getValue(["SpacingPalette", "fixed", "c"]);
  const fixedSpacingG = UuGds.getValue(["SpacingPalette", "fixed", "g"]);
  const fixedSpacingH = UuGds.getValue(["SpacingPalette", "fixed", "h"]);
  const [r, g, b] = Utils.Color.toRgba(color);

  const Css = {
    main: () =>
      Config.Css.css({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }),
    box: () =>
      Config.Css.css({
        "&&": {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          borderRadius: borderRadius === "full" ? "50%" : undefined,
          backgroundColor: significance === "common" ? `rgba(${[r, g, b].join(",")}, .12)` : undefined,
          overflow: "hidden",
          marginBottom: fixedSpacingG,
        },
      }),
    info: () =>
      Config.Css.css({
        marginTop: header ? fixedSpacingC : undefined,
      }),
    buttons: () =>
      Config.Css.css({
        display: "flex",
        flexDirection: actionDirection === "vertical" ? "column" : "row",
        gap: fixedSpacingC,
        marginTop: fixedSpacingH,
      }),
    button: () =>
      Config.Css.css({
        "&&": { minWidth: BUTTON_SIZE[size] },
      }),
    children: () =>
      Config.Css.css({
        marginTop: fixedSpacingH,
      }),
    link: () =>
      Config.Css.css({
        fontWeight: "normal",
      }),
  };

  return Css;
}

function getVisualProps(props) {
  const result = {};
  for (const k in createVisualComponent.defaultProps) result[k] = props[k];
  return result;
}

function renderContent(prop) {
  return typeof prop === "object" && prop && !Utils.Element.isValid(prop) ? <Lsi lsi={prop} /> : prop;
}

const { onClick, height, width, aspectRatio, ...propTypes } = Box.propTypes;
const {
  onClick: _onClick,
  height: _height,
  width: _width,
  aspectRatio: _aspectRatio,
  ...defaultProps
} = Box.defaultProps;

function buildTextWithDot(text, isDot) {
  if (isDot && typeof text === "string" && !/\.$/.test(text.trim())) {
    text = text.trim() + ".";
  }
  return text;
}

function buildHeader(header, isDot) {
  let result = header;

  if (typeof header === "string") {
    result = buildTextWithDot(header, isDot);
  } else if (header && typeof header === "object" && !Utils.Element.isValid(header)) {
    result = <Lsi lsi={header}>{({ value }) => buildTextWithDot(value, isDot)}</Lsi>;
  }

  return result;
}

const PlaceholderBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PlaceholderBox",
  nestingLevel: ["area", "box", "spot", "inline"],
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    significance: PropTypes.oneOf(["common", "subdued"]),
    code: PropTypes.oneOf(Object.keys(CODE_MAP)).isRequired,
    header: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
    info: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
    actionList: PropTypes.arrayOf(PropTypes.shape(Button.propTypes)),
    actionDirection: PropTypes.oneOf(["vertical", "horizontal"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    significance: "common",
    borderRadius: "moderate",
    colorScheme: "steel",
    size: "s",
    code: undefined,
    header: undefined,
    info: undefined,
    actionList: [],
    actionDirection: "vertical",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { code, children, colorScheme, info, header, actionList } = props;

    const colorPalette = UuGds.getValue(["ColorPalette"]);
    const colors = Object.values(colorPalette).reduce((result, curr) => ({ ...curr, ...result }), {});
    const color = (colors[colorScheme] || colorPalette[colorScheme]).mainLightest;

    let Css = getStyles({ ...props, color });

    let buttons;
    if (actionList.length > 0) {
      buttons = actionList.map((it, i) => (
        <Button key={i} {...it} className={Utils.Css.joinClassName(Css.button(), it.className)} />
      ));
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const primaryAction = actionList
      ? actionList.find((it) => it.colorScheme === "primary" && it.significance === "highlighted") ||
        actionList.find((it) => it.colorScheme === "primary") ||
        actionList[0]
      : null;
    const item = CODE_MAP[code];
    const icon = item?.icon;

    const [attrs, boxProps] = Utils.VisualComponent.splitProps(props, Css.main());
    const currentNestingLevel =
      props.nestingLevel === undefined ? "box" : Utils.NestingLevel.getNestingLevel(props, PlaceholderBox);

    const usedHeader = buildHeader(
      code && header === undefined ? item?.header : header,
      currentNestingLevel === "inline" && primaryAction,
    );

    let result;

    switch (currentNestingLevel) {
      case "area":
      case "box":
        code = SVG_MAP[code] || code;
        result = (
          <div {...attrs}>
            <Box testId="box" {...boxProps} significance="subdued" className={Css.box()} aspectRatio="1x1">
              <Svg code={`uugdssvg-svg-${code}`} colorScheme={colorScheme} testId="svg" />
            </Box>
            {usedHeader != null && (
              <Text
                category="interface"
                segment="title"
                type={currentNestingLevel === "area" ? "major" : "micro"}
                significance={currentNestingLevel === "area" ? "common" : "subdued"}
                colorScheme="building"
              >
                {usedHeader}
              </Text>
            )}
            {info && (
              <Text
                className={Css.info()}
                category="interface"
                segment="content"
                type="medium"
                significance="subdued"
                colorScheme="building"
              >
                {renderContent(info)}
              </Text>
            )}
            {buttons && (
              <div data-testid="buttons" className={Css.buttons()}>
                {buttons}
              </div>
            )}
            {children != null && <div className={Css.children()}>{children}</div>}
          </div>
        );
        break;

      case "spot":
        code = SVG_MAP[code] || code;
        result = (
          <InfoItem
            {...getVisualProps(props)}
            icon={`uugdssvg-svg-${code}`}
            direction="vertical-reverse"
            subtitle={usedHeader}
            title={
              primaryAction ? (
                <Link onClick={primaryAction.onClick} className={Css.link()}>
                  {primaryAction.children}
                </Link>
              ) : undefined
            }
            size="xl"
            colorScheme={colorScheme}
          />
        );
        break;

      default:
        result = (
          <Text {...getVisualProps(props)} colorScheme="building" significance="subdued">
            {icon ? <Icon icon={icon} /> : null}
            {icon && usedHeader != null ? " " : null}
            {usedHeader}
            {primaryAction ? (
              <>
                {" "}
                <Link
                  onClick={(e) => {
                    e.stopPropagation();
                    primaryAction.onClick(e);
                  }}
                >
                  {primaryAction.children}
                </Link>
              </>
            ) : null}
          </Text>
        );
    }

    return result;
    //@@viewOff:render
  },
});

PlaceholderBox.CODE_MAP = CODE_MAP;

export { PlaceholderBox };
export default PlaceholderBox;
