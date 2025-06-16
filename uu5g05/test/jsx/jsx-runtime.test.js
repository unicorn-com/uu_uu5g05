import { omitConsoleLogs } from "uu5g05-test";

// NOTE This test assumes that uu5devkitg01 is configured to use @babel/plugin-transform-react-jsx redirected to uu5g05/jsx/jsx-runtime.js.
describe("[uu5g05] JSX transpilation", () => {
  it("key", () => {
    const propsNoKey = { foo: "bar" };
    const propsWithKey = { ...propsNoKey, key: "b" };
    let consoleWarnings = [];
    omitConsoleLogs((type, ...args) => consoleWarnings.push(args.join(" ")));
    expect((<div key="a" {...propsNoKey} />).key).toBe("a");
    expect(consoleWarnings.join("")).toBe("");
    expect((<div key="a" {...propsWithKey} />).key).toBe("b"); // key from spread is still preferred
    expect(consoleWarnings.length).toBe(1); // there should be a warning
    expect(consoleWarnings.join("")).toMatch(/"key" prop is being spread/); // there should be a warning
    consoleWarnings = [];
    expect((<div {...propsNoKey} key="a" />).key).toBe("a");
    expect(consoleWarnings.length).toBe(0);
    expect((<div {...propsWithKey} key="a" />).key).toBe("a");
    expect(consoleWarnings.length).toBe(0);
  });
});
