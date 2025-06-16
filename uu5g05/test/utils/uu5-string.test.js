import { Utils, Environment, SessionProvider, createComponent } from "uu5g05";
import { Test, Session } from "uu5g05-test";
import { AuthenticationService } from "uu_appg01_oidc";

const { Uu5String } = Utils;

afterEach(() => {
  Environment.uu5DataMap = {};
});

let origValue = Environment._constants.textEntityDisabled;
afterEach(() => {
  Environment._constants.textEntityDisabled = origValue;
});

describe("[uu5g05] Utils.Uu5String", () => {
  it("toChildren(); should return JSX elements", () => {
    let jsxArray = new Uu5String("<uu5string/><div>abc</div>").toChildren();
    expect(Array.isArray(jsxArray)).toBeTruthy();
    expect(jsxArray.length).toBe(1);
    let jsx = jsxArray[0];
    expect(jsx).toMatchObject({ type: "div" });
    Test.render(jsx);
    expect(Test.screen.getByText("abc")).toBeInTheDocument();

    // same for nested uu5strings (i.e. checks that Uu5String.Object is used properly with overriden .toChildren())
    let uu5String = new Uu5String('<uu5string/><div value="<uu5string/><span>inline</span>">block</div>');
    let expectNestedJsx = (jsx) => {
      expect(jsx?.type).toBe("span");
      expect(jsx?.props.children + "").toBe("inline");
    };
    let expectOuterJsx = (jsx) => {
      expect(jsx).toMatchObject({ type: "div" });
      expect(jsx.props?.value?.length).toBe(1);
      let nestedJsx = jsx.props.value[0];
      expectNestedJsx(nestedJsx);
    };
    jsxArray = uu5String.toChildren();
    expect(Array.isArray(jsxArray)).toBeTruthy();
    expect(jsxArray.length).toBe(1);
    expectOuterJsx(jsxArray[0]);
    let uu5StringObject = uu5String.content[0];
    expectOuterJsx(uu5StringObject.toChildren());
  });

  it("should recognize extra template expressions - userName, userEmail", () => {
    let Component = () => new Uu5String("<uu5string/>${userName}").toChildren();
    let rendered = Test.render(
      <SessionProvider authenticationService={AuthenticationService}>
        <Component />
      </SessionProvider>,
    );
    expect(Test.screen.getByText(Session.TEST_IDENTITY.name)).toBeInTheDocument();
    rendered.unmount();

    Component = () => new Uu5String("<uu5string/>${userEmail}").toChildren();
    rendered = Test.render(
      <SessionProvider authenticationService={AuthenticationService}>
        <Component />
      </SessionProvider>,
    );
    expect(Test.screen.getByText(Session.TEST_IDENTITY.claims["email"])).toBeInTheDocument();
    rendered.unmount();

    // should return template as-is if using toString({ templateData: null })
    let uu5String = new Uu5String("<uu5string/>${value:12345678901234567890123456789012}");
    expect(uu5String.toString({ templateDataMap: null })).toEqual("${value:12345678901234567890123456789012}");
    expect(uu5String.toChildren({ templateDataMap: null })).toEqual(["${value:12345678901234567890123456789012}"]);
    expect(
      Uu5String.toString("<uu5string/>${value:12345678901234567890123456789012}", { templateDataMap: null }),
    ).toEqual("${value:12345678901234567890123456789012}");
    expect(
      Uu5String.toChildren("<uu5string/>${value:12345678901234567890123456789012}", { templateDataMap: null }),
    ).toEqual(["${value:12345678901234567890123456789012}"]);
    expect(uu5String.toString()).toEqual("${value:12345678901234567890123456789012}");
    expect(uu5String.toChildren()).toEqual(["12345678901234567890123456789012"]);
    expect(Uu5String.toString("<uu5string/>${value:12345678901234567890123456789012}")).toEqual(
      "${value:12345678901234567890123456789012}",
    );
    expect(Uu5String.toChildren("<uu5string/>${value:12345678901234567890123456789012}")).toEqual([
      "12345678901234567890123456789012",
    ]);

    // should recognize extra template expressions even with custom templateDataMap
    Component = () => new Uu5String("<uu5string/>${userName}${k}").toChildren({ templateDataMap: { k: "v" } });
    rendered = Test.render(
      <SessionProvider authenticationService={AuthenticationService}>
        <Component />
      </SessionProvider>,
    );
    expect(Test.screen.getByText(Session.TEST_IDENTITY.name + "v")).toBeInTheDocument();
    rendered.unmount();

    Component = () => Uu5String.toChildren("<uu5string/>${userName}${k}", { templateDataMap: { k: "v" } });
    rendered = Test.render(
      <SessionProvider authenticationService={AuthenticationService}>
        <Component />
      </SessionProvider>,
    );
    expect(Test.screen.getByText(Session.TEST_IDENTITY.name + "v")).toBeInTheDocument();
    rendered.unmount();
  });

  it("should recognize extra template expressions - parent.* and build parent as FAAC", () => {
    const TestComponent = createComponent({
      uu5Tag: "Uu5Demo.Test",
      render({ children, parent, ...restProps }) {
        return typeof children === "function"
          ? children({ a: 10, b: "B", ...restProps })
          : (children ?? JSON.stringify(restProps));
      },
    });
    Utils.LibraryRegistry.registerComponent(TestComponent);
    /* for bookkit test:
<uu5string/>
<Uu5Demo.Test>
  <Uu5Demo.Test number='${parent.a}' /><br/>
  <Uu5Demo.Test string='${parent.b}' readOnly /><br/>
  <Uu5Demo.Test full='${parent}' /><br/>
  <UU5.CodeKit.CodeViewer value='normal value'/>
  <UU5.CodeKit.CodeViewer value='${parent.b}'/>
  <UU5.CodeKit.JsonEditor value='${parent}'/>
   a: ${parent.a}
</Uu5Demo.Test>
*/
    // expression is recognized only in props
    let jsx = new Uu5String(
      `<uu5string/>
       <Uu5Demo.Test>
         <Uu5Demo.Test number="\${parent.a}" />
         <Uu5Demo.Test string="\${parent.b}" readOnly />
         <Uu5Demo.Test full="\${parent}" />
         b:\${parent.b}
       </Uu5Demo.Test>`,
    ).toChildren();
    Test.render(<div>{jsx}</div>);
    expect(
      Test.screen.getByText('{"number":10}{"string":"B","readOnly":true}{"full":{"a":10,"b":"B"}}b:${parent.b}', {
        normalizer: (text) => text.replace(/\s+/g, ""),
      }),
    ).toBeInTheDocument();

    jsx = new Uu5String(
      `<uu5string/>
       <Uu5Demo.Test>
         <Uu5Demo.Test c="\${parent.b}">
           <Uu5Demo.Test value="\${parent.c}" />
         </Uu5Demo.Test>
       </Uu5Demo.Test>`,
    ).toChildren();
    Test.render(<div>{jsx}</div>);
    expect(
      Test.screen.getByText('{"value":"B"}', { normalizer: (text) => text.replace(/\s+/g, "") }),
    ).toBeInTheDocument();

    // parent.parent.*
    jsx = new Uu5String(
      `<uu5string/>
        <Uu5Demo.Test b=100>
          <Uu5Demo.Test>
            <Uu5Demo.Test b=50>
              <Uu5Demo.Test c="ccc">
                <Uu5Demo.Test value1="\${parent.c}" />
                <Uu5Demo.Test value2="\${parent.parent.b}" value3="\${parent.parent.parent.parent.b}" />---
              </Uu5Demo.Test>
            </Uu5Demo.Test>
          </Uu5Demo.Test>
          <Uu5Demo.Test b="BB">
            <Uu5Demo.Test parentB="\${parent.b}" grandParentB="\${parent.parent.b}" />
            <Uu5Demo.Test grandParent="\${parent.parent}" />
          </Uu5Demo.Test>
        </Uu5Demo.Test>`,
    ).toChildren();
    Test.render(<div>{jsx}</div>);
    expect(
      Test.screen.getByText(
        '{"value1":"ccc"}{"value2":50,"value3":100}---{"parentB":"BB","grandParentB":100}{"grandParent":{"a":10,"b":100}}',
        { normalizer: (text) => text.replace(/\s+/g, "") },
      ),
    ).toBeInTheDocument();
  });

  it("should use Environment.uu5DataMap automatically", () => {
    let itemList = Uu5String.parse('<uu5string/><div data="<uu5data/>key" />');

    Environment.uu5DataMap = { key: "value" };
    let rendered = Uu5String.contentToChildren(itemList);
    expect(rendered).toMatchObject([{ props: { data: "value" } }]);
    rendered = Uu5String.toChildren('<uu5string/><div data="<uu5data/>key" />');
    expect(rendered).toMatchObject([{ props: { data: "value" } }]);
    rendered = new Uu5String('<uu5string/><div data="<uu5data/>key" />').toChildren();
    expect(rendered).toMatchObject([{ props: { data: "value" } }]);
  });

  it("toChildren({ allowedTagsRegExp }); should return Error component in case of forbidden tag", () => {
    let jsxArray = Uu5String.toChildren("<uu5string/><mytag />", { allowedTagsRegExp: /^(?!mytag$)/i });
    expect(jsxArray?.length).toBe(1);
    let jsx = jsxArray[0];
    expect(jsx?.type).not.toBe("mytag");
    expect(typeof jsx?.type).toBe("function");
    expect(jsx?.type.displayName).toBe("Uu5.Error");
  });

  it("should use Environment.enableUu5StringTextEntity setting", () => {
    Environment._constants.textEntityDisabled = false;
    let result = Uu5String.toChildren("<uu5string/>:-)");
    expect(result).toMatchObject(["🙂"]);

    Environment._constants.textEntityDisabled = true;
    result = Uu5String.toChildren("<uu5string/>:-)");
    expect(result).toMatchObject([":-)"]);
  });
});

describe("[uu5g05] Utils.Uu5String uu5g04 integration", () => {
  it("toChildren(); should return Error component in case of forbidden UU5.Common.Loader combination", () => {
    let jsxArray = Uu5String.toChildren("<uu5string/><UU5.Common.Loader method='post'>abc</UU5.Common.Loader>"); // UU5.Common.Loader
    expect(jsxArray?.length).toBe(1);
    let jsx = jsxArray[0];
    expect(typeof jsx?.type).toBe("function");
    expect(jsx?.type.displayName).toBe("Uu5.Error");

    // same but with simulated uu5g04's UU5.Bricks.Error being present
    window.UU5 = { ...window.UU5, Bricks: { Error: () => null } };
    jsxArray = Uu5String.toChildren("<uu5string/><UU5.Bricks.Loader method='pOst'>abc</UU5.Bricks.Loader>"); // UU5.Bricks.Loader
    expect(jsxArray?.length).toBe(1);
    jsx = jsxArray[0];
    expect(jsx?.type?.displayName).toBe("UU5.Bricks.Error");

    // not allowed even with custom buildChildFn
    jsxArray = Uu5String.toChildren("<uu5string/><UU5.Bricks.Loader method='pOst'>abc</UU5.Bricks.Loader>", {
      buildChildFn: (tag, props, children) => ({ tag, props, children }),
    });
    expect(jsxArray?.length).toBe(1);
    expect(jsxArray[0]).toMatchObject({ tag: "UU5.Bricks.Error" });

    // method="get" is allowed
    jsxArray = Uu5String.toChildren("<uu5string/><UU5.Common.Loader method='get'>abc</UU5.Common.Loader>");
    expect(jsxArray[0]?.type?.displayName).toBe("UU5.Common.Loader");
    jsxArray = Uu5String.toChildren("<uu5string/><UU5.Common.Loader>abc</UU5.Common.Loader>");
    expect(jsxArray[0]?.type?.displayName).toBe("UU5.Common.Loader");
  });
});

describe("[uu5g05] Utils.Uu5String.Object", () => {
  it("new(tag, propsString); should use Environment.uu5DataMap automatically", () => {
    Environment.uu5DataMap = { key: "value" };
    let rendered = new Uu5String.Object("div", ' data="<uu5data/>key"').toChildren();
    expect(rendered).toMatchObject({ props: { data: "value" } });
  });

  it("toChildren(); should return JSX elements", () => {
    let rendered = new Uu5String.Object("div", " p1=10", { children: ["abc"] }).toChildren();
    expect(rendered).toMatchObject({ type: "div", props: { p1: 10 } });
    Test.render(rendered);
    expect(Test.screen.getByText("abc")).toBeInTheDocument();
  });
});

describe("[uu5g05] Utils.Uu5String.Props", () => {
  it("new(propsString); should use Environment.uu5DataMap automatically", () => {
    Environment.uu5DataMap = { key: "value" };
    let rendered = new Uu5String.Props(' data="<uu5data/>key"').toChildren();
    expect(rendered).toMatchObject({ data: "value" });
  });

  it("toChildren(); should return JSX elements", () => {
    let rendered = new Uu5String.Props(" p1=10 str='<uu5string/><div>abc</div>'", {
      buildItemFn: Uu5String.Object.create,
    }).toChildren();
    expect(rendered).toEqual({ p1: 10, str: [expect.objectContaining({ type: "div" })] });
    Test.render(rendered.str[0]);
    expect(Test.screen.getByText("abc")).toBeInTheDocument();
  });
});
