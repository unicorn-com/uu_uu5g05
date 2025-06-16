//@@viewOn:imports
import {
  createVisualComponent,
  PropTypes,
  useState,
  useEffect,
  Utils,
  Lsi,
  useLsi,
  useRef,
  useUpdateEffect,
} from "uu5g05";
import Uu5Elements, { UuGds } from "uu5g05-elements";
import Config from "../config/config.js";
import Text from "../text.js";
import TextSelectInput from "../inputs/text-select-input";
import { iconLibraryMap } from "../uu5-environment";
import { getInputComponentColorScheme } from "./tools.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:helpers
const ALL_ICONS = "all";

const STENCIL_URI_MAP = {
  uugds: iconLibraryMap.uugdsstencil.replace(/\/[^/]+$/, "/assets/stencil-map.json"),
  uubml: iconLibraryMap.uubmlstencil.replace(/\/[^/]+$/, "/assets/stencil-map.json"),
};

const stencilKeys = Object.keys(STENCIL_URI_MAP);

const Css = {
  main: () =>
    Config.Css.css({
      display: "flex",
      flexDirection: "column",
      width: "100%",
    }),
  inputWrapper: () =>
    Config.Css.css({
      padding: UuGds.SpacingPalette.getValue(["fixed", "c"]),
      display: "flex",
      gap: UuGds.getValue(["SpacingPalette", "fixed", "d"]),
    }),
  clearButtonStyle: () =>
    Config.Css.css({
      margin: UuGds.SpacingPalette.getValue(["fixed", "c"]),
      flex: "none",
    }),
  input: () => Config.Css.css({ whiteSpace: "nowrap", flex: "auto!important" }),
  palette: () =>
    Config.Css.css({
      padding: `${UuGds.SpacingPalette.getValue(["fixed", "b"])}px ${UuGds.SpacingPalette.getValue(["fixed", "c"])}px`,
    }),
};

async function loadText(uri) {
  const res = await fetch(uri);
  return await res.text();
}

async function loadJson(uri) {
  const res = await fetch(uri);
  return await res.json();
}

const cache = {};

async function loadDataFromCache(uri, loadFn) {
  let data = cache[uri];
  if (data === undefined) {
    cache[uri] = loadFn(uri);
    data = await cache[uri];
  } else if (data instanceof Promise) {
    cache[uri] = data = await cache[uri];
  }
  return data;
}

function parseRules(rules, library) {
  let icons = [];

  if (rules) {
    for (let i = 0; i < rules.length; i++) {
      let rule = rules[i];
      if (rule.selectorText && rule.style.content) {
        let selectors = rule.selectorText.split(",");
        let ruleIcons = selectors.map((selector) => {
          let result = false;
          if (
            selector.startsWith("." + library + "-") &&
            (selector.endsWith(":before") || selector.endsWith(":after"))
          ) {
            result = selector.substr(1).replace(/[^a-zA-Z0-9\-_].*/, "");
          } else {
            let match = selector.match(/^\[\s*class\s*\*=\s*['"]?([a-zA-Z0-9_-]*).*:(before|after)$/);
            if (match) {
              result = match[1];
            }
          }

          if (result && !result.endsWith("-")) {
            return result;
          } else {
            return null;
          }
        });
        ruleIcons[0] && icons.push(ruleIcons[0]);
      }
    }
  }

  return icons;
}

async function loadIconsFromCss(name) {
  return loadDataFromCache(iconLibraryMap[name], async (uri) => {
    const css = await loadText(uri);

    let styleSheet = document.createElement("style");
    styleSheet.textContent = css.replace(/@font-face\{[^}]*\}/g, "");
    document.head.appendChild(styleSheet);

    let rules = (styleSheet.sheet || {}).cssRules;
    return parseRules(rules, name);
  });
}

async function loadStencilMap(uri) {
  return loadDataFromCache(uri, async (uri) => {
    let stencilMap = await loadJson(uri);
    if (uri === STENCIL_URI_MAP.uugds) {
      stencilMap = { ...stencilMap };
      delete stencilMap.badge;
    }
    return stencilMap;
  });
}

function useDebounce(fn, timeout = 100) {
  const debounceRef = useRef();
  const handlerRef = useRef();
  handlerRef.current = fn;
  // Make sure that debounce function is created only once
  if (debounceRef.current === undefined) {
    debounceRef.current = Utils.Function.debounce((event) => handlerRef.current(event), timeout);
  }
  return debounceRef.current;
}

function addIconBySearch(targetMap, { value, iconList: sourceList }, search) {
  const isUu5 = value.startsWith("uu");
  const searchNoSpace = search.replace(/\s/, "");
  sourceList.forEach((icon) => {
    if (!targetMap[icon.value]) {
      let order = 0;
      if (icon.value.includes(searchNoSpace)) {
        order = 1;
      } else if (icon.name && icon.name.replace(/\s/, "").toLowerCase().includes(searchNoSpace)) {
        order = 2;
      } else if ((icon.keywordList ?? [])?.join("").toLowerCase().includes(searchNoSpace)) {
        order = 3;
      }

      if (order) targetMap[icon.value] = { ...icon, order: isUu5 ? order : order * 11 };
    }
  });
}

/*
 * Add "all" possibility if there is more than 1 category and "all" is not included.
 */
function prepareAllCategories(categoryList) {
  if (
    !categoryList.includes(ALL_ICONS) &&
    (categoryList.length > 1 || categoryList.find((v) => stencilKeys.includes(v)))
  ) {
    categoryList = [ALL_ICONS, ...categoryList];
  }
  return categoryList;
}

function getInitialCategory(categoryList, initialCategory) {
  if (new RegExp(`^(${stencilKeys.join("|")})`).test(initialCategory)) {
    return initialCategory;
  } else {
    let foundCategory =
      categoryList.find((category) => (category?.name || category) === initialCategory) || categoryList[0];
    return typeof foundCategory === "object" ? foundCategory.name : foundCategory;
  }
}

function parseStringToIcon(value) {
  return {
    value: value,
    keywordList: value.split("-"),
  };
}

/**
 * arrayOf(shape({
 *   value: String.isRequired,
 *   name: String.isRequired,
 *   iconList: arrayOf(shape({
 *     value: String.isRequired,
 *     name: String,
 *     keywordList: arrayOf(String),
 *     component: ElementType,
 *     componentProps: Object,
 *   })),
 *   itemList: dataListType
 * }))
 */
function getDataList(categoryList, lsi) {
  const result = [];
  categoryList.forEach((category) => {
    if (typeof category === "object") {
      result.push({
        name: category.label,
        value: category.name,
        iconList: category.itemList.map((item) => {
          // eg. "mdi-check"
          if (typeof item === "string") {
            return parseStringToIcon(item);
          } else {
            // e.g. { value: "final", component: Uu5Elements.Badge, componentProps: { icon: "uugds-check", colorScheme: "blue" } }
            return { keywordList: item.value.split("-"), ...item };
          }
        }),
      });
    } else {
      const valueSplitter = category.split("-");
      if (valueSplitter.length > 1) {
        // category is stencil => add only whole icons name: eg. "uugds-arrow" => add only "uugds" to be loaded all stencils
        const mainKey = valueSplitter[0];
        if (stencilKeys.includes(mainKey) && !result.find(({ value }) => value === mainKey)) {
          result.push({
            name: lsi[mainKey],
            value: mainKey,
            _lsiSync: true,
          });
        }
      } else {
        result.push({
          name: lsi[category],
          value: category,
          _lsiSync: true,
        });
      }
    }
  });
  return result;
}

function useDataList(allCategoryList, categoryList, category) {
  const lsi = useLsi(importLsi, ["Icon"]);

  const [dataList, setDataList] = useState(() => getDataList(allCategoryList, lsi));

  // lsi can get loaded later => synchronize loaded lsi labels to categories
  useUpdateEffect(() => {
    if (lsi) {
      setDataList((list) => list.map((it) => (it._lsiSync ? { ...it, name: lsi[it.code] ?? lsi[it.value] } : it)));
    }
  }, [lsi]);

  function updateCategory(cat, callback) {
    return (...args) => {
      setDataList(([...dataList]) => {
        let itemIndex = dataList.findIndex(({ code }) => code === cat);
        if (itemIndex === -1) itemIndex = dataList.findIndex(({ value }) => value === cat);
        const { ...item } = dataList[itemIndex] ?? {};

        const newItem = callback(item, ...args);

        // if newItem is returned, it should replace the item
        dataList.splice(itemIndex, 1, newItem || item);
        return dataList;
      });
    };
  }

  function loadData(cat) {
    if (typeof cat === "string") {
      const { iconList, itemList } = dataList.find(({ value }) => value === cat) ?? {};

      if (!iconList && !itemList) {
        if (STENCIL_URI_MAP[cat]) {
          let currStencilKeys;
          if (!allCategoryList.includes(cat)) {
            // if categoryList contains just a few stencils of some category, eg. categoryList=["uugds-arrow", "uugds-weather"]
            // so inner stencils should be only those two
            currStencilKeys = allCategoryList
              .filter((c) => c.startsWith(cat + "-"))
              .map((c) => c.replace(new RegExp(`^${cat}-`), ""));
          }
          loadStencilMap(STENCIL_URI_MAP[cat]).then(
            updateCategory(cat, (category, stencilMap) => {
              const commonIconList = [];
              category.itemList = (currStencilKeys || Object.keys(stencilMap)).map((stencilCode) => {
                const stencil = stencilMap[stencilCode];

                return {
                  name: Utils.Lsi.getMessage(stencil.name),
                  value: [cat, stencilCode].join("-"),
                  iconList: Object.keys(stencil.iconMap).map((iconCode) => {
                    const { name, isCommon, keywordList = [] } = stencil.iconMap[iconCode];
                    const item = {
                      name: Utils.Lsi.getMessage(name),
                      value: [cat + (isCommon ? "" : "stencil-" + stencilCode), iconCode].join("-"),
                      keywordList: keywordList ? Object.values(keywordList).flat() : [],
                    };

                    if (isCommon) commonIconList.push(item);

                    return item;
                  }),
                };
              });

              // add common stencil if there are common icons
              if (
                commonIconList.length &&
                (allCategoryList.includes(cat) || allCategoryList.includes(cat + "-common"))
              ) {
                category.itemList.unshift({
                  name: "Common", // TODO lsi?
                  value: cat,
                  iconList: commonIconList,
                });
                category.code ??= category.value;
                category.value = category.code + "-parent";
              }

              // if there is only one stencil, this stencil will not be wrapped inside
              if (category.itemList.length === 1) return category.itemList[0];
            }),
          );
        } else if (cat === ALL_ICONS) {
          updateCategory(cat, (category) => {
            // true because Toolbar is pending if somewhere is not set iconList, but "all" category does not have iconList
            category.iconList = true;
          })();
        } else {
          loadIconsFromCss(cat).then(
            updateCategory(cat, (category, iconList) => {
              category.iconList = iconList.map(parseStringToIcon);
            }),
          );
        }
      }
    }
  }

  useEffect(() => {
    category && loadData(category.split("-")[0]);
  }, []);

  useEffect(() => {
    allCategoryList.forEach((cat) => {
      if (typeof cat === "string") {
        const valueSplitter = cat.split("-");
        if (valueSplitter.length > 1 && stencilKeys.includes(valueSplitter[0])) cat = valueSplitter[0];
      }
      loadData(cat);
    });
  }, [categoryList]);

  return dataList;
}

function searchIcons(stencilList, search, iconMap = {}) {
  stencilList.forEach((stencil) => {
    if (Array.isArray(stencil.iconList)) {
      addIconBySearch(iconMap, stencil, search);
    } else if (stencil.itemList) {
      searchIcons(stencil.itemList, search, iconMap);
    }
  });
  return iconMap;
}

function getIconList(dataList, category, search) {
  let iconList;
  if (search) {
    const iconMap = searchIcons(dataList, search);
    iconList = Object.values(iconMap).sort(({ order: a, order: b }) => a - b);
  } else if (category === ALL_ICONS) {
    iconList = [];
    dataList.forEach((stencil) => {
      if (Array.isArray(stencil.iconList)) iconList.push(...stencil.iconList);
      else if (stencil.itemList) {
        stencil.itemList.forEach((st) => {
          if (!stencilKeys.includes(st.value)) iconList.push(...st.iconList);
        });
      }
    });
    if (!iconList.length) iconList = null; // for display pending during loading of icons
  } else {
    let iconItem;
    const iconItemDirect = dataList.find(({ value, itemList }) => {
      let result = value === category;
      if (!result) {
        result = itemList?.find(({ value }) => value === category);
        if (result) iconItem = result;
      }
      return result;
    });
    iconList = (iconItem || iconItemDirect)?.iconList;
  }

  return iconList
    ? iconList.map(({ value, name, keywordList, ...item }) => ({
        value,
        component: Uu5Elements.Icon,
        componentProps: { icon: value, tooltip: Utils.String.format(name ? `${name} (%s)` : "%s", value) },
        ...item,
      }))
    : Array(77)
        .fill(null)
        .map(() => ({
          value: undefined,
          component: Uu5Elements.Skeleton,
          componentProps: { aspectRatio: "1x1", width: 24, borderRadius: "moderate" },
        }));
}
//@@viewOff:helpers

const Toolbar = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "IconPicker.Toolbar",
  //@@viewOff:statics

  render(props) {
    const { category, dataList, onSelect, onSearch, colorScheme, ...restProps } = props;

    const [search, setSearch] = useState();
    const handleSearch = useDebounce(onSearch, 800);

    let isPending = false;
    let allIndex = -1;
    let optionList = dataList.map(({ name, value, iconList, itemList }, i) => {
      if (!iconList && !itemList) isPending = true;
      if (value === ALL_ICONS) allIndex = i;

      return {
        value,
        children: name,
        itemList: itemList?.map(({ name, value }) => ({ value, children: name })),
      };
    });

    if (optionList.length === 1 && optionList[0].itemList) {
      optionList = optionList[0].itemList;
    } else if (optionList.length === 2 && allIndex > -1) {
      const itemIndex = 1 - allIndex;
      if (optionList[itemIndex].itemList) optionList.splice(itemIndex, 1, ...optionList[itemIndex].itemList);
    }

    const attrs = Utils.VisualComponent.getAttrs(restProps, Css.inputWrapper());

    return (
      <div {...attrs}>
        <Text
          placeholder={{ import: importLsi, path: ["Icon", "search"] }}
          value={search}
          onChange={(e) => {
            setSearch(e.data.value);
            handleSearch(e.data.value?.toLowerCase());
          }}
          iconRight="uugds-search"
          significance="distinct"
          className={Css.input()}
          colorScheme={colorScheme}
        />
        {optionList.length > 1 && (
          <TextSelectInput
            value={category}
            itemList={optionList}
            onChange={(e) => onSelect(e.data.value)}
            significance="distinct"
            className={Css.input()}
            width="unset"
            disableOptionReorder
            required
            pending={isPending}
            disabled={!!search}
            colorScheme={colorScheme}
          />
        )}
      </div>
    );
  },
});

const IconPicker = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "IconPicker",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onSelect: PropTypes.func,
    value: PropTypes.string,
    initialCategory: PropTypes.string,
    categoryList: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          name: PropTypes.string,
          label: PropTypes.oneOfType([PropTypes.node, PropTypes.object]),
          itemList: PropTypes.arrayOf(
            PropTypes.oneOfType([
              PropTypes.string,
              PropTypes.shape({
                value: PropTypes.string,
                component: PropTypes.func,
                componentProps: PropTypes.object,
              }),
            ]),
          ),
        }),
      ]),
    ),
    colorScheme: PropTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    categoryList: ["uugds"],
    onSelect: undefined,
    value: undefined,
    initialCategory: undefined, // default is "all" if "all" is set
    colorScheme: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onSelect, initialCategory, categoryList, value, required, colorScheme } = props;

    const allCategoryList = prepareAllCategories(categoryList);

    const [category, setCategory] = useState(() => getInitialCategory(allCategoryList, initialCategory));

    const dataList = useDataList(allCategoryList, categoryList, category);

    const [search, setSearch] = useState();

    function selectIcon(e) {
      if (typeof onSelect === "function") {
        // e.data can be undefined in case of click on clear button
        onSelect(new Utils.Event({ value: e.data?.value }), e);
      }
    }

    const iconList = getIconList(dataList, category, search);
    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main());

    return (
      <div {...attrs}>
        <Toolbar
          category={category}
          dataList={dataList}
          onSelect={setCategory}
          onSearch={(v) => {
            setSearch(v);
            setCategory(ALL_ICONS);
          }}
          colorScheme={colorScheme}
        />
        <Uu5Elements._IconPalette
          itemList={iconList}
          value={value || "-"} // dash for loading to not select all items, because items have value undefined
          onSelect={selectIcon}
          className={Css.palette()}
          scrollElementRef={props.scrollElementRef}
          height="auto"
          maxHeight={props.maxHeight}
          colorScheme={getInputComponentColorScheme(colorScheme)}
        />
        {!required ? (
          <Uu5Elements.Button onClick={selectIcon} className={Css.clearButtonStyle()}>
            <Lsi import={importLsi} path={["Icon", "clear"]} />
          </Uu5Elements.Button>
        ) : null}
      </div>
    );
    //@@viewOff:render
  },
});

export default IconPicker;
