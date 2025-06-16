//@@viewOn:imports
import { createVisualComponent, useState, useEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";

//@@viewOff:imports

function isSame(aArr, bArr) {
  for (let i = 0; i < aArr.length; i++) {
    if (JSON.stringify(aArr[i]) !== JSON.stringify(bArr[i])) return false;
  }
  return true;
}

const Console = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Console",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const [list, setList] = useState([]);

    useEffect(() => {
      const origMap = {};
      const propsMap = {
        log: { colorScheme: "dim" },
        debug: { colorScheme: "dim", icon: "uugdsstencil-it-bug" },
        info: { colorScheme: "important", icon: "uugds-info-circle-solid" },
        warn: { colorScheme: "warning", icon: "uugds-alert-solid" },
        error: { colorScheme: "negative", icon: "uugds-alert-circle-solid" },
        table: { colorScheme: "building", icon: "uugdsstencil-media-table" },
      };
      const fnList = Object.keys(propsMap);
      fnList.forEach((fn) => {
        origMap[fn] = console[fn];
        console[fn] = (...args) => {
          if (
            fn === "error" &&
            typeof args[0] === "string" &&
            args[0].match(
              /Support for defaultProps will be removed from (function|memo) components in a future major release/,
            )
          ) {
            return;
          }

          origMap[fn](...args);
          // timeout because it cannot be rendered when another component is rendering
          setTimeout(
            () =>
              setList((curr) => {
                const lastItem = curr[curr.length - 1];
                if (
                  lastItem != null &&
                  lastItem.type === fn &&
                  lastItem.data.length === args.length &&
                  isSame(lastItem.data, args)
                ) {
                  const newList = [...curr];
                  newList[newList.length - 1] = {
                    ...newList[newList.length - 1],
                    count: (newList[newList.length - 1].count ?? 1) + 1,
                  };
                  return newList;
                } else {
                  return [...curr, { ...propsMap[fn], type: fn, data: args }];
                }
              }),
            0,
          );
        };
      });

      return () => {
        fnList.forEach((fn) => {
          console[fn] = origMap[fn];
        });
      };
    }, []);

    //@@viewOn:render
    return (
      <Uu5Elements.Block
        header="Console"
        headerType="heading"
        {...props}
        actionList={[
          ...(props.actionList || []),
          {
            icon: "uugds-delete",
            colorScheme: "negative",
            onClick: () => setList([]),
          },
        ]}
      >
        {({ style }) => (
          <div className={Config.Css.css({ ...style, display: "flex", flexDirection: "column", gap: 4 })}>
            {list.map(({ colorScheme, icon, count, data }, i) => (
              <Uu5Elements.Box
                key={i}
                shape="background"
                colorScheme={colorScheme}
                significance="distinct"
                borderRadius="moderate"
                className={Config.Css.css({ ...style, padding: 8, display: "flex", gap: 8 })}
              >
                {count ? (
                  <Uu5Elements.Badge colorScheme={colorScheme} size="s" borderRadius="full">
                    {count}x
                  </Uu5Elements.Badge>
                ) : (
                  <Uu5Elements.Icon colorScheme={colorScheme} icon={icon ?? "empty"} />
                )}
                {data.map((v, i) => (
                  <Uu5Elements.Text key={i} category="story" segment="special" type="code">
                    {typeof v === "string" ? v : JSON.stringify(v)}
                  </Uu5Elements.Text>
                ))}
              </Uu5Elements.Box>
            ))}
          </div>
        )}
      </Uu5Elements.Block>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Console };
export default Console;
//@@viewOff:exports
