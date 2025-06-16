//@@viewOn:imports
import {
  createComponent,
  Lsi,
  PropTypes,
  useState,
  useCallback,
  useMemo,
  useContentSizeValue,
  useElementSize,
  Utils,
  useLayoutEffect,
  useRef,
} from "uu5g05";
import { Modal, MenuList, GridTemplate, Dialog, HighlightedBox, UuGds, Tabs, useSpacing } from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import ContentHelpers from "./content-helpers.js";
import TabHelpers from "./tab-helpers.js";
import ItemPositionModal from "./item-position-modal.js";
import ModalFooter from "./modal-footer.js";
import EditModalViewContent from "./edit-modal-view-content.js";
import { SYSTEM_PROP_MAP } from "./edit-modal-config.js";
import Tools from "../tools.js";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

const EDITATION_COMPONENT_PROPS = PropTypes.shape({
  component: PropTypes.elementType,
  props: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
});

const Css = {
  content() {
    return Config.Css.css({
      display: "flex",
      flexDirection: "column",
      gap: UuGds.getValue(["SpacingPalette", "fixed", "e"]),
    });
  },
  activeTabContainer: ({ style }) =>
    Config.Css.css({
      ...style,
    }),
  tabChildren: () =>
    Config.Css.css({
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      wordBreak: "break-word",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),
};

//@@viewOn:helpers
function getTabComponent({ children: Component }) {
  return <Component />;
}

function modifyChildrenOfMenuList(itemList) {
  return itemList.map((item) => ({
    ...item,
    children: <span className={Css.tabChildren()}>{item.children}</span>,
  }));
}
//@@viewOff:helpers

let EditModalView = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "EditModalView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    header: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
    open: PropTypes.bool,
    onSave: PropTypes.func.isRequired,
    onBeforeSave: PropTypes.func,
    onClose: PropTypes.func.isRequired,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    menuWidth: PropTypes.number,
    uu5Tag: PropTypes.isRequiredIf(PropTypes.string, (props) => !props.componentType),
    props: PropTypes.object.isRequired,
    defaultProps: PropTypes.object,
    nestingLevelList: PropTypes.array,
    componentType: PropTypes.elementType,
    propInputMap: EDITATION_COMPONENT_PROPS,
    tabList: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.string, // for template(s)
          PropTypes.shape({
            template: PropTypes.string,
            layout: PropTypes.sizeOf(PropTypes.string),
            columns: PropTypes.sizeOf(PropTypes.string),
            label: PropTypes.oneOfType([PropTypes.func, PropTypes.node, PropTypes.lsi]),
            icon: PropTypes.icon,
            info: PropTypes.node,
            propInputMap: EDITATION_COMPONENT_PROPS,
            hiddenInputList: PropTypes.arrayOf(PropTypes.string),
          }),
        ]),
      ),
    ]),
    itemPropName: PropTypes.string,
    itemUu5Tag: PropTypes.string,
    itemDefaultProps: PropTypes.object,
    itemTab: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({
        label: PropTypes.oneOfType([PropTypes.func, PropTypes.node, PropTypes.lsi]),
        layout: PropTypes.sizeOf(PropTypes.string),
        columns: PropTypes.sizeOf(PropTypes.string),
        propInputMap: EDITATION_COMPONENT_PROPS,
      }),
    ]),
    itemCreateButtonLabel: PropTypes.object,
    content: PropTypes.func,
    _menuType: PropTypes.oneOf(["list", "tabs"]),
    _preview: EditModalViewContent.propTypes.preview,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    header: undefined,
    open: false,
    width: 900,
    menuWidth: 250,
    defaultProps: {},
    componentType: undefined,
    tabList: [],
    itemPropName: undefined,
    itemUu5Tag: undefined,
    itemDefaultProps: {},
    itemTab: undefined,
    content: undefined,
    _menuType: "list",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      onClose,
      onSave,
      tabList,
      propInputMap,
      props: componentProps,
      defaultProps,
      itemUu5Tag,
      itemDefaultProps,
      itemPropName,
      itemTab,
      itemCreateButtonLabel,
      header,
      uu5Tag: uu5TagProps,
      content,
      componentType,
      nestingLevelList,
      // internal from EditModal
      formState,
      categoryList,
      itemList,
      manageItem,
      menuWidth,
      initialLeftOpen,
      _menuType,
      _preview,
      ...propsToPass
    } = props;

    let uu5Tag = uu5TagProps ? uu5TagProps : componentType?.uu5Tag;

    const { ref: modalRef, width: modalWidth } = useElementSize();
    const countSize = Utils.ScreenSize.countSize(modalWidth);

    const { validateStep, itemMap: formItemMap, setItemState, setItemValue } = formState;
    const [positionModalOpen, setPositionModalOpen] = useState(false);
    const [removalDialogOpen, setRemovalDialogOpen] = useState(false);
    const [leftOpen, setLeftOpen] = useState(initialLeftOpen);
    const [tempTabKey, setTempTabKey] = useState(null);
    const spacing = useSpacing();

    useLayoutEffect(() => {
      setLeftOpen(initialLeftOpen == null ? ["xs", "s"].indexOf(countSize) === -1 : initialLeftOpen);
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, []);

    const [activeTabKey, setActiveTabKey] = useState(() =>
      categoryList.length > 0 ? categoryList[0].key : itemList[0]?.key,
    );
    const activeTab =
      categoryList.find((it) => it.key === activeTabKey) || itemList.find((it) => it.key === activeTabKey);

    const activateTab = useCallback(
      async (newKey, validatePrevious = true) => {
        if (newKey === activeTabKey) return;
        setActiveTabKey(newKey);
        if (validatePrevious) await validateStep(); // let the validation finish on background
      },
      [activeTabKey, validateStep],
    );

    const aggregatedPropMap = useMemo(() => TabHelpers.mergePropMaps(SYSTEM_PROP_MAP, propInputMap), [propInputMap]);

    const currentProps = useMemo(() => {
      if (!formItemMap) return componentProps;
      let propList = {};
      for (let item in formItemMap) {
        propList[item] = formItemMap[item].value;
      }

      let { valueMapWithoutItemList, itemListValueMapList } = TabHelpers.splitFormValue(propList, itemList, true);

      let { newCompProps, newItemPropsMap } = TabHelpers.getNewPropsByPropMap(
        aggregatedPropMap,
        valueMapWithoutItemList,
        false,
        itemListValueMapList,
        itemList,
        typeof tabList === "function" ? tabList({ componentProps, componentType, defaultProps }) : tabList,
      );
      valueMapWithoutItemList = newCompProps;
      itemListValueMapList = newItemPropsMap;

      return { ...valueMapWithoutItemList, itemList: itemListValueMapList };
    }, [formItemMap, componentProps, itemList, aggregatedPropMap, tabList, componentType, defaultProps]);

    const setLeftChangeRef = useRef();
    setLeftChangeRef.current = () => {
      if (["xs", "s"].indexOf(countSize) !== -1) setLeftOpen(false);
    };

    const menuCategoryList = useMemo(
      () =>
        TabHelpers.getMenuList(
          true,
          categoryList,
          activeTabKey,
          activateTab,
          setLeftChangeRef.current,
          currentProps,
          formItemMap,
          setItemState,
          setItemValue,
          undefined,
          undefined,
          _menuType,
        ),
      [categoryList, activeTabKey, activateTab, currentProps, formItemMap, setItemState, setItemValue, _menuType],
    );

    const menuItemList = useMemo(
      () =>
        TabHelpers.getMenuList(
          false,
          itemList,
          activeTabKey,
          activateTab,
          setLeftChangeRef.current,
          currentProps,
          formItemMap,
          setItemState,
          setItemValue,
          formItemMap,
          {
            manageItem,
            openPositionModal: (e) => {
              setPositionModalOpen(true);
              setTempTabKey(e.data.tabKey);
            },
            openRemovalDialog: (e) => {
              setRemovalDialogOpen(true);
              setTempTabKey(e.data.tabKey);
            },
          },
        ),
      [itemList, activeTabKey, activateTab, currentProps, formItemMap, setItemState, setItemValue, manageItem],
    );

    const aggregatedMenuList = useMemo(() => {
      let itemList = [];
      if (itemTab) {
        const addItemButton = {
          children: itemCreateButtonLabel ? (
            Tools.getLabel(itemCreateButtonLabel)
          ) : (
            <Lsi import={importLsi} path={["EditModal", "addItemButton"]} />
          ),
          icon: "uugds-plus-circle",
          onClick: () => manageItem.add({ atTabKey: null, activateTab, setItemValue }),
        };
        itemList = [...menuItemList, addItemButton];
        if (menuCategoryList.length) itemList.unshift({ divider: true });
      }
      return [...menuCategoryList, ...itemList];
    }, [activateTab, itemCreateButtonLabel, itemTab, manageItem, menuCategoryList, menuItemList, setItemValue]);

    const templateAreas = activeTab?.layout;
    const templateColumns = activeTab?.columns ?? "xs: 100%";

    const templateByContentSize = useContentSizeValue(templateAreas);
    const firstItemFromTemplate = templateByContentSize?.replace(",", " ").split(" ")[0];

    const contentMap = useMemo(() => {
      if (activeTab === undefined) return;
      const activeTabItemListIndex = itemList.indexOf(activeTab);
      const isCategory = activeTabItemListIndex === -1;
      const itemParamsToPass = {
        componentProps: currentProps,
        componentType,
        defaultProps,
        nestingLevelList,
        addItem: (itemParams) => manageItem.add({ atTabKey: null, setItemValue, itemParams }),
      };
      if (!isCategory) {
        Object.assign(itemParamsToPass, {
          itemIndex: activeTabItemListIndex,
          itemProps: TabHelpers.getTabProps(activeTab, formItemMap),
          itemDefaultProps,
        });
      }

      return ContentHelpers.getContentMap(activeTab, { itemParamsToPass, firstItemFromTemplate });
    }, [
      activeTab,
      itemList,
      currentProps,
      componentType,
      defaultProps,
      nestingLevelList,
      manageItem,
      setItemValue,
      formItemMap,
      itemDefaultProps,
      firstItemFromTemplate,
    ]);

    const _onItemPositionModalSave = (newIndex) => {
      manageItem.move(tempTabKey, newIndex);
      setPositionModalOpen(false);
      setTempTabKey(null);
    };

    const _onItemRemovalDialogSave = () => {
      manageItem.remove(tempTabKey || activeTabKey, activateTab, categoryList, setItemState, formItemMap);
      _onItemCloseRemovalDialog();
    };

    function _onItemCloseRemovalDialog() {
      setRemovalDialogOpen(false);
      setTempTabKey(null);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    function getTabList() {
      if (_menuType === "tabs" && aggregatedMenuList.length > 1) {
        return (
          <Tabs
            itemList={aggregatedMenuList.map(({ children, icon, onClick }) => {
              return { label: children, icon, onClick };
            })}
            type="line"
          />
        );
      }
    }

    function getActiveTab() {
      return (
        <Uu5Forms.Form.View>
          {activeTab !== undefined ? (
            <div className={Css.content()}>
              {activeTab.info && <HighlightedBox colorScheme="dim">{activeTab.info}</HighlightedBox>}
              {activeTab.children ? (
                getTabComponent(activeTab)
              ) : (
                <GridTemplate
                  key={`tab${activeTab.key}-content`}
                  templateAreas={templateAreas}
                  templateColumns={templateColumns}
                  contentMap={contentMap}
                  columnGap={spacing.d}
                  rowGap={spacing.d}
                />
              )}
            </div>
          ) : null}
        </Uu5Forms.Form.View>
      );
    }

    return (
      <>
        <Modal
          {...propsToPass}
          elementRef={Utils.Component.combineRefs(propsToPass.elementRef, modalRef)}
          leftWidth={menuWidth}
          header={
            header ? (
              Tools.getLabel(header)
            ) : (
              <Lsi import={importLsi} path={["EditModal", "header"]} params={{ name: uu5Tag }} />
            )
          }
          left={
            _menuType === "list" && aggregatedMenuList.length > 1 ? (
              <MenuList
                colorScheme="primary"
                itemBorderRadius="moderate"
                itemList={modifyChildrenOfMenuList(aggregatedMenuList)}
              />
            ) : undefined
          }
          footer={<ModalFooter onCancel={onClose} lsiRoot="EditModal" />}
          onClose={onClose}
          leftOpen={leftOpen}
          onLeftChange={(e) => setLeftOpen(e.data.open)}
        >
          {({ style }) => (
            <EditModalViewContent
              activeTabKey={activeTabKey}
              tabList={getTabList()}
              tabContent={getActiveTab()}
              preview={_preview}
              style={style}
            />
          )}
        </Modal>
        <ItemPositionModal
          itemPosition={itemList.findIndex((item) => item.key === tempTabKey)}
          itemCount={itemList.length}
          open={positionModalOpen}
          onClose={() => {
            setPositionModalOpen(false);
            setTempTabKey(null);
          }}
          onSave={_onItemPositionModalSave}
        />
        <Dialog
          open={removalDialogOpen}
          onClose={_onItemCloseRemovalDialog}
          header={<Lsi import={importLsi} path={["ItemRemovalDialog", "header"]} />}
          width="24em"
          info={<Lsi import={importLsi} path={["ItemRemovalDialog", "info"]} />}
          actionList={[
            { children: <Lsi import={importLsi} path={["ItemRemovalDialog", "cancel"]} /> },
            {
              children: <Lsi import={importLsi} path={["ItemRemovalDialog", "confirm"]} />,
              colorScheme: "negative",
              significance: "highlighted",
              onClick: _onItemRemovalDialogSave,
            },
          ]}
          actionDirection="horizontal"
        />
      </>
    );
    //@@viewOff:render
  },
});

export { EditModalView };
export default EditModalView;
