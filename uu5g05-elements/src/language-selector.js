//@@viewOn:imports
import { Utils, createVisualComponent, PropTypes, useLanguage, useEffect } from "uu5g05";
import Config from "./config/config.js";
import Dropdown from "./dropdown.js";
import Flag from "./flag";
import Text from "./text.js";
import UuGds from "./_internal/gds";
//@@viewOff:imports

const DEFAULT_LANGUAGE_CODE_LIST = [
  "en",
  "cs",
  "sk",
  "uk",
  "it",
  "ro",
  "sv",
  "de",
  "hr",
  "pl",
  "nl",
  "no",
  "fr",
  "el",
  "es",
  "ru",
  "en-gb",
  "en-us",
];

const FLAG_BASE_URI = Flag.BASE_URI;
const FLAG_MAPPING = {
  en: "gb",
  cs: "cz",
  uk: "ua",
  sv: "se",
  el: "gr",
};

function getLanguageName(code) {
  const name = new Intl.DisplayNames(code, { type: "language" }).of(code);
  return name[0].toUpperCase() + name.slice(1);
}

function getLanguageFlagUri(code) {
  const langCode = FLAG_MAPPING[code] ?? code.split("-")[1] ?? code;
  return FLAG_BASE_URI + langCode + "-square.svg";
}

const LANGUAGE_MAP = Object.fromEntries(
  DEFAULT_LANGUAGE_CODE_LIST.map((code) => [
    code,
    {
      name: getLanguageName(code),
      flagUri: getLanguageFlagUri(code),
    },
  ]),
);

const LanguageSelector = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "LanguageSelector",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Dropdown.propTypes,
    languageList: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.oneOf(DEFAULT_LANGUAGE_CODE_LIST),
        PropTypes.shape({
          code: PropTypes.string.isRequired,
          name: PropTypes.string,
          flagUri: PropTypes.string,
        }),
      ]),
    ),
    labelType: PropTypes.oneOf(["flag", "code", "name", "flag-code", "flag-name"]),
    itemType: PropTypes.oneOf(["name", "name-code", "flag-name", "flag-name-code"]),
    displayFlag: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    languageList: Object.keys(LANGUAGE_MAP)
      .map((code) => ({ code, ...LANGUAGE_MAP[code] }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    labelType: "code",
    itemType: "name-code",
    displayFlag: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { languageList, labelType, itemType, displayFlag, ...dropdownProps } = props;

    if (displayFlag) labelType = "flag";

    if (process.env.NODE_ENV !== "production") {
      useEffect(() => {
        if (displayFlag != null) {
          LanguageSelector.logger.warn(
            'Property "displayFlag" is deprecated. Set labelType="flag" for same behaviour or see documentation.',
          );
        }
      }, []);
    }

    const { colorScheme } = dropdownProps;

    let [language, setLanguage] = useLanguage();

    let activeItem =
      languageList.find((item) => item.code === language) || Utils.Language.getItem(LANGUAGE_MAP, language);
    let activeItemCode = activeItem.code || Object.keys(LANGUAGE_MAP).find((it) => LANGUAGE_MAP[it] === activeItem);
    let itemClassName = Config.Css.css({ display: "flex", gap: UuGds.SpacingPalette.getValue(["inline", "e"]) });
    let itemCodeClassName = Config.Css.css({ marginLeft: "auto" });

    const itemTypeList = itemType.split("-");

    let itemList = languageList
      .map((item) => {
        let code, name, flagUri;

        if (item?.code) {
          code = item.code;
          name = item.name ?? LANGUAGE_MAP[code]?.name ?? getLanguageName(code);
          flagUri = item.flagUri ?? LANGUAGE_MAP[code]?.flagUri ?? getLanguageFlagUri(code);
        } else if (LANGUAGE_MAP[item]) {
          let languageItem = Utils.Language.getItem(LANGUAGE_MAP, item);
          if (!languageItem) return null;

          code = Object.keys(LANGUAGE_MAP).find((it) => LANGUAGE_MAP[it] === languageItem);
          ({ name, flagUri } = languageItem);
        } else {
          LanguageSelector.logger.error(
            `Language "${item}" is not defined in language map with keys ${JSON.stringify(Object.keys(LANGUAGE_MAP))}.`,
            LANGUAGE_MAP,
          );
          return null;
        }

        return {
          className: itemClassName,
          children: (
            <>
              {itemTypeList.includes("flag") && (
                <Flag
                  src={flagUri}
                  code={FLAG_MAPPING[code] ?? code.split("-")[1] ?? code}
                  type="circle"
                  bordered
                  className={
                    code === activeItemCode
                      ? Config.Css.css({
                          ...UuGds.EffectPalette.getStyles(UuGds.EffectPalette.getValue(["outlineBasicExpressive"])),
                        })
                      : undefined
                  }
                />
              )}
              {name}
              {itemTypeList.includes("code") && (
                <Text colorScheme="building" significance="subdued" className={itemCodeClassName}>
                  {code.toUpperCase()}
                </Text>
              )}
            </>
          ),
          onClick: setLanguage.bind(this, code),
          ...(code === activeItemCode
            ? {
                significance: "distinct",
                colorScheme: colorScheme || "primary",
              }
            : undefined),
        };
      })
      .filter(Boolean);

    const labelList = [];
    const labelTypeList = labelType.split("-");

    if (labelTypeList.includes("code")) labelList.push(activeItemCode?.toUpperCase());

    if (labelTypeList.includes("name")) {
      labelList.push(activeItem.name ?? new Intl.DisplayNames(activeItemCode, { type: "language" }).of(activeItemCode));
    }

    if (labelTypeList.includes("flag")) {
      labelList.unshift(
        <Flag
          key="flag"
          src={activeItem.flagUri}
          code={FLAG_MAPPING[activeItemCode] ?? activeItemCode.split("-")[1] ?? activeItemCode}
          type="circle"
          bordered
          className={Config.Css.css(
            labelTypeList.length > 1
              ? {
                  marginLeft: -UuGds.SpacingPalette.getValue(["fixed", "c"]),
                  marginRight: UuGds.SpacingPalette.getValue(["inline", "d"]),
                }
              : { marginInline: -UuGds.SpacingPalette.getValue(["fixed", "c"]) },
          )}
        />,
      );
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return <Dropdown {...dropdownProps} itemList={itemList} label={labelList} />;
    //@@viewOff:render
  },
});

// used in Uu5Forms.Lsi
LanguageSelector._LANGUAGE_MAP = LANGUAGE_MAP;

//@@viewOn:helpers
//@@viewOff:helpers

export { LanguageSelector };
export default LanguageSelector;
