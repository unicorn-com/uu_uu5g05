import { Utils } from "uu5g05";
import { Utils as TestUtils } from "uu5g05-test";

const { Uu5String } = Utils;
const Uu5StringObject = Uu5String.Object;

// NOTE Copied & slightly adjusted from uu5stringg01/test/uu5-string.test.js. These tests ensure that all
// standard functionality of Uu5String works even after our adjustments in Utils.Uu5String.

let codePreviewOutput = `<uu5string/>
<UU5BricksButton
  name="newCMPname"
  count=69
  tagName="UU5BricksButton"
  id="uu5-id-component"
  className="uu5-my-className-cmp"
  tooltip="Hy, I am tooltip."
  selected
  style="fontSize: 20px; color: red"
  disabled=false
  elementAttrs='<uu5json/>{
    "style": {
      "fontSize": "20px",
      "color": "red"
    }
  }'
/>`;

let basicUu5StringTemplate =
  '<uu5string /><UU5BricksSection content="First section" /><UU5BricksSection content="Second section" />';
let invalidTemplateUu5String =
  '<uu5string /><UU5BricksSection content="First section"><UU5BricksSection content="Second section" />';
let sliderUu5String =
  '<uu5string /><UU5BricksSlider id="root" key="parKey"><UU5BricksSlider.Item value=5 id="child" key="childrenID"/></UU5BricksSlider>';
let formsTextUu5String =
  '<uu5string /><UU5FormsText id="myId" key="parKer" value="John Doe" password="false" patterMessage="Toto není co jsem čekal." pattern="[A-Za-z]{3}"/>';
let newsliderUu5String =
  '<uu5string /><UU5BricksSlider id="root2" key="parKey2"><UU5BricksSlider.Item value=10 min="0" max="10" step="5" id="child" key="childrenID"/></UU5BricksSlider>';
let filterContent =
  '<uu5string /><UU5BricksParagraph content="Lorem ipsum ..." /><UU5BricksParagraph /><UU5BricksParagraph>Lorem ipsum ...</UU5BricksParagraph>';

const mockData = {
  now: "21.05.2018",
  userName: "Jest",
  userEmail: "jest@facebook.com",
  idHex32: "32-moje-id",
};

function findBuilt(node, comparatorFn) {
  if (node == null) return;
  if (Array.isArray(node)) {
    let result;
    node.some((node) => {
      result = findBuilt(node, comparatorFn);
      return result != null;
    });
    return result;
  }
  if (comparatorFn(node)) return node;
  return findBuilt((node.props || {}).content || node.children || (node.props || {}).children, comparatorFn);
}
function findBuiltById(node, id) {
  return findBuilt(node, (node) => node.props && node.props.id === id);
}
function findBuiltByTag(node, uu5Tag) {
  return findBuilt(node, (node) => (node.uu5Tag || node.type) === uu5Tag);
}
function findBuiltText(node) {
  let buffer = [];
  findBuilt(node, (node) => {
    if (typeof node === "string") buffer.push(node);
    return false;
  });
  return buffer.join("");
}

function cleanupInstanceForSnapshot(instance) {
  for (let k in instance) if (k.startsWith("_")) delete instance[k];
}

const DATE1 = 1595233742000; // 2020-07-20T08:29:02.000Z
let origDateNow;
beforeEach(() => {
  origDateNow = Date.now;
  Date.now = () => DATE1;
});
afterEach(() => {
  Date.now = origDateNow;
});

describe("Uu5String - test of interface instance", () => {
  it("constructor(uu5string)", () => {
    let uu5string = new Uu5String(
      '<uu5string /><UU5BricksSection content="Toto je hlavička sekce">Toto je obsah sekce</UU5BricksSection>',
    );
    expect(uu5string).toEqual(expect.any(Object));
    cleanupInstanceForSnapshot(uu5string);
    expect(uu5string).toMatchSnapshot();
  });

  it("constructor([tagPropsObj])", () => {
    let uu5string = new Uu5String([
      {
        uu5Tag: "UU5BricksSection",
        props: {
          header: "Toto je hlavička sekce",
        },
        children: ["Toto je obsah sekce"],
      },
    ]);
    expect(uu5string).toEqual(expect.any(Object));
    cleanupInstanceForSnapshot(uu5string);
    expect(uu5string).toMatchSnapshot();
  });

  it("constructor(uu5string, { templateDataMap, initFn })", () => {
    const mockFunc = jest.fn();
    let uu5string = new Uu5String(filterContent, { templateDataMap: mockData, initFn: mockFunc });
    expect(mockFunc).toHaveBeenCalledTimes(3);
    cleanupInstanceForSnapshot(uu5string);
    expect(uu5string).toMatchSnapshot();
  });

  it("constructor([tagPropsObj], { templateDataMap, initFn })", () => {
    const mockFunc = jest.fn();
    const content = [
      {
        uu5Tag: "UU5BricksParagraph",
        props: {
          content: "Lorem ipsum ...",
        },
      },
      { uu5Tag: "UU5BricksParagraph" },
      { uu5Tag: "UU5BricksParagraph", children: ["Lorem ipsum ..."] },
    ];
    let uu5string = new Uu5String(content, { templateDataMap: mockData, initFn: mockFunc });
    expect(mockFunc).toHaveBeenCalledTimes(3);
    cleanupInstanceForSnapshot(uu5string);
    expect(uu5string).toMatchSnapshot();
  });

  it("constructor(uu5string, { allowedTagsRegExp })", () => {
    let uu5string = new Uu5String(`<uu5string/><div><p>a0</p>a1</div>`, { allowedTagsRegExp: /^div$/ });
    expect(uu5string.toChildren({ buildChildFn: null })).toMatchObject([
      { uu5Tag: "div", children: [{ uu5Tag: "invalidTag", props: { uu5Tag: "p" } }, "a1"] },
    ]);

    uu5string = new Uu5String(`<uu5string/><p><div>b</div></p>`, { allowedTagsRegExp: /^div$/ });
    expect(uu5string.toChildren({ buildChildFn: null })).toMatchObject([
      { uu5Tag: "invalidTag", props: { uu5Tag: "p" } },
    ]);

    uu5string = new Uu5String(`<uu5string/><p/>`, { allowedTagsRegExp: /^div$/ });
    expect(uu5string.toChildren({ buildChildFn: null })).toMatchObject([
      { uu5Tag: "invalidTag", props: { uu5Tag: "p" } },
    ]);

    uu5string = new Uu5String(`<uu5string/><div data='<uu5string/>nested <p>a</p>'/>`, { allowedTagsRegExp: /^div$/ });
    expect(uu5string.toChildren({ buildChildFn: null })).toMatchObject([
      { uu5Tag: "div", props: { data: ["nested ", { uu5Tag: "invalidTag", props: { uu5Tag: "p" } }] } },
    ]);
  });

  it("constructor([tagPropsObj], { allowedTagsRegExp })", () => {
    const content_0 = [
      {
        uu5Tag: "div",
        children: [
          {
            uu5Tag: "p",
            children: ["a0"],
          },
          "a1",
        ],
      },
    ];
    let uu5string = new Uu5String(content_0, { allowedTagsRegExp: /^div$/ });
    expect(uu5string.toChildren({ buildChildFn: null })).toMatchObject([
      { uu5Tag: "div", children: [{ uu5Tag: "invalidTag", props: { uu5Tag: "p" } }, "a1"] },
    ]);

    const content_1 = [
      {
        uu5Tag: "p",
        children: [
          {
            uu5Tag: "div",
            children: ["b"],
          },
        ],
      },
    ];
    uu5string = new Uu5String(content_1, { allowedTagsRegExp: /^div$/ });
    expect(uu5string.toChildren({ buildChildFn: null })).toMatchObject([
      { uu5Tag: "invalidTag", props: { uu5Tag: "p" } },
    ]);

    const content_2 = [
      {
        uu5Tag: "p",
      },
    ];
    uu5string = new Uu5String(content_2, { allowedTagsRegExp: /^div$/ });
    expect(uu5string.toChildren({ buildChildFn: null })).toMatchObject([
      { uu5Tag: "invalidTag", props: { uu5Tag: "p" } },
    ]);

    const content_3 = [
      {
        uu5Tag: "div",
        props: {
          data: "<uu5string/>nested <p>a</p>",
        },
      },
    ];
    uu5string = new Uu5String(content_3, { allowedTagsRegExp: /^div$/ });
    expect(uu5string.toChildren({ buildChildFn: null })).toMatchObject([
      { uu5Tag: "div", props: { data: ["nested ", { uu5Tag: "invalidTag", props: { uu5Tag: "p" } }] } },
    ]);
  });

  it("instance.toChildren({ templateDataMap, filterFn })", () => {
    const mockFunc = jest.fn();
    let newInstance = new Uu5String(filterContent, { templateDataMap: mockData, initFn: mockFunc });
    let calls = newInstance.toChildren({ templateDataMap: mockData, filterFn: mockFunc });
    expect(mockFunc).toHaveBeenCalledTimes(6);
    expect(calls).toMatchSnapshot();
  });

  it("instance.toChildren({ templateDataMap }) with nested uu5string in templateDataMap", () => {
    let newInstance = new Uu5String("<uu5string/><UU5CommonDiv>${content}</UU5CommonDiv>");
    let calls = newInstance.toChildren({
      templateDataMap: { content: "<uu5string/><UU5BricksParagraph>lorem</UU5BricksParagraph>" },
    });
    expect(calls).toMatchSnapshot();
  });

  it("instance.toChildren({ templateDataMap }) with object in templateDataMap", () => {
    let newInstance = new Uu5String("<uu5string/><UU5CommonDiv>${content}</UU5CommonDiv>");
    let obj = { foo: 10, toString: "${FOO:10}" };
    let calls = newInstance.toChildren({
      templateDataMap: { content: obj },
    });
    expect(calls).toMatchSnapshot();

    newInstance = new Uu5String("<uu5string/><UU5CommonDiv attr='${content}' />");
    calls = newInstance.toChildren({
      templateDataMap: { content: obj },
    });
    expect(calls).toMatchSnapshot();
  });

  it("instance.toChildren({ templateDataMap }) with key path in templateDataMap", () => {
    let newInstance = new Uu5String("<uu5string/><UU5CommonDiv>${key.path}</UU5CommonDiv>");
    let calls = newInstance.toChildren({
      templateDataMap: { key: { path: "key.path (ok)" } },
    });
    expect(calls).toMatchSnapshot();

    // for backward compatibility "key.path" has priority against ["key"]["path"]
    newInstance = new Uu5String("<uu5string/><UU5CommonDiv>${key.path}</UU5CommonDiv>");
    calls = newInstance.toChildren({
      templateDataMap: { key: { path: "bad!!!" }, "key.path": "ok" },
    });
    expect(calls).toMatchSnapshot();
  });

  it("instance.toChildren()", () => {
    let newInstance = new Uu5String(sliderUu5String);
    expect(newInstance.toChildren()).not.toBeNull();
    expect(newInstance.toChildren()).toMatchSnapshot();
  });

  it("instance.toChildren({ buildChildFn })", () => {
    let newInstance = new Uu5String('<uu5string/><div a="b">A<br/></div><span/>text');
    let buildChildFn = jest.fn((uu5Tag, props, children, context) => {
      return { T: uu5Tag, P: props, C: children };
    });
    let builtChildren = newInstance.toChildren({ buildChildFn });
    expect(builtChildren).toMatchObject({
      length: 3,
      0: {
        T: "div",
        P: { a: "b" },
        C: ["A", { T: "br", P: {}, C: null }],
      },
      1: { T: "span", P: {}, C: null },
      2: "text",
    });
    // check "context" content in buildChildFn calls (build call order is <br>, <div>, <span>)
    expect(buildChildFn.mock.calls[0][3]).toEqual({ index: 1 });
    expect(buildChildFn.mock.calls[1][3]).toEqual({ index: 0 });
    expect(buildChildFn.mock.calls[2][3]).toEqual({ index: 1 });
  });

  it("instance.toString()", () => {
    let newInstance = new Uu5String(sliderUu5String);
    expect(newInstance.toString()).not.toBeNull();
    expect(newInstance.toString()).toEqual(
      expect.stringContaining(
        '<UU5BricksSlider id="root" key="parKey"><UU5BricksSlider.Item value=5 id="child" key="childrenID"/></UU5BricksSlider>',
      ),
    );
  });

  it("instance.toString({ templateDataMap, filterFn })", () => {
    const mockFunc = jest.fn();

    let newInstance = new Uu5String(filterContent, { templateDataMap: mockData, initFn: mockFunc });
    let result = newInstance.toString({ templateDataMap: mockData, filterFn: mockFunc });
    //3X calls mock func toString 3x calls mock in new
    expect(mockFunc).toHaveBeenCalledTimes(6);
    expect(result).toMatchSnapshot();

    let obj = { foo: 10, toString: () => "${FOO:10}" };
    newInstance = new Uu5String("<uu5string /><UU5BricksSection data='${obj}' />", { templateDataMap: { obj } });
    result = newInstance.toString();
    expect(result).toMatchInlineSnapshot(`"<UU5BricksSection data=\${FOO:10}/>"`);
  });

  it.each([
    [
      "copySoft",
      [
        '<Uu5Bricks.Div pd="${nonExisting:default}" p="${nonExisting}" spd="${nonExisting%:default}" sp="${nonExisting%}"/>',
        /^<Uu5Bricks.Div pd="\$\{idHex32:default\}" p="\$\{idHex32:[0-9a-f]{32}\}" spd="\$\{idHex32%:[0-9a-f]{32}\}" sp="\$\{idHex32%:[0-9a-f]{32}\}"\/>$/,
        '<Uu5Bricks.Div pd="${now:default}" p="${now}" spd="${now%:default}" sp="${now%}"/>', // does not support copySoft, i.e. same as preserve
        /^<Uu5Bricks.Div pd="\$\{custom:default\}" p="\$\{custom:abc\}" spd="\$\{custom%:abc\}" sp="\$\{custom%:abc\}"\/>$/,
      ],
    ],
    [
      "copyHard",
      [
        '<Uu5Bricks.Div pd="${nonExisting:default}" p="${nonExisting}" spd="${nonExisting%:default}" sp="${nonExisting%}"/>',
        /^<Uu5Bricks.Div pd="\$\{idHex32:[0-9a-f]{32}\}" p="\$\{idHex32:[0-9a-f]{32}\}" spd="\$\{idHex32%:[0-9a-f]{32}\}" sp="\$\{idHex32%:[0-9a-f]{32}\}"\/>$/,
        '<Uu5Bricks.Div pd="${now:default}" p="${now}" spd="${now%:default}" sp="${now%}"/>', // does not support copyHard, i.e. same as preserve
        /^<Uu5Bricks.Div pd="\$\{custom:abc\}" p="\$\{custom:abc\}" spd="\$\{custom%:abc\}" sp="\$\{custom%:abc\}"\/>$/,
      ],
    ],
    [
      "preserve",
      [
        '<Uu5Bricks.Div pd="${nonExisting:default}" p="${nonExisting}" spd="${nonExisting%:default}" sp="${nonExisting%}"/>',
        '<Uu5Bricks.Div pd="${idHex32:default}" p="${idHex32}" spd="${idHex32%:default}" sp="${idHex32%}"/>',
        '<Uu5Bricks.Div pd="${now:default}" p="${now}" spd="${now%:default}" sp="${now%}"/>',
        '<Uu5Bricks.Div pd="${custom:default}" p="${custom}" spd="${custom%:default}" sp="${custom%}"/>',
      ],
    ],
    [
      "evaluate",
      [
        '<Uu5Bricks.Div pd="default" p="${nonExisting}" spd="default" sp="${nonExisting%}"/>',
        /^<Uu5Bricks.Div pd="default" p="[0-9a-f]{32}" spd="default" sp="[0-9a-f]{32}"\/>$/, // idHex32 prefers default value to generated one
        /^<Uu5Bricks.Div pd="[0-9]{4}-[0-9]{2}[^"]*" p="[0-9]{4}-[0-9]{2}[^"]*" spd="[0-9]{4}-[0-9]{2}[^"]*" sp="[0-9]{4}-[0-9]{2}[^"]*"\/>$/, // 'now' template never returns default value
        '<Uu5Bricks.Div pd="abc" p="abc" spd="abc" sp="abc"/>',
      ],
    ],
    [
      undefined, // without templateDataMap it behaves as "preserve", otherwise as "evaluate" (last case)
      [
        '<Uu5Bricks.Div pd="${nonExisting:default}" p="${nonExisting}" spd="${nonExisting%:default}" sp="${nonExisting%}"/>',
        '<Uu5Bricks.Div pd="${idHex32:default}" p="${idHex32}" spd="${idHex32%:default}" sp="${idHex32%}"/>',
        '<Uu5Bricks.Div pd="${now:default}" p="${now}" spd="${now%:default}" sp="${now%}"/>',
        '<Uu5Bricks.Div pd="abc" p="abc" spd="abc" sp="abc"/>',
      ],
    ],
  ])("instance.toString({ templateStrategy: %s })", (templateStrategy, expectedResults) => {
    let template,
      result,
      expectedResult,
      index = 0;

    // unknown template
    template =
      '<uu5string /><Uu5Bricks.Div pd="${nonExisting:default}" p="${nonExisting}" spd="${nonExisting%:default}" sp="${nonExisting%}"/>';
    result = new Uu5String(template).toString({ templateStrategy });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toMatch"](expectedResult);

    // known default template
    template =
      '<uu5string /><Uu5Bricks.Div pd="${idHex32:default}" p="${idHex32}" spd="${idHex32%:default}" sp="${idHex32%}"/>';
    result = new Uu5String(template).toString({ templateStrategy });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toMatch"](expectedResult);

    // known default template that doesn't support 'copySoft' (i.e. behaves as 'preserve')
    template = '<uu5string /><Uu5Bricks.Div pd="${now:default}" p="${now}" spd="${now%:default}" sp="${now%}"/>';
    result = new Uu5String(template).toString({ templateStrategy });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toMatch"](expectedResult);

    // custom template
    template =
      '<uu5string /><Uu5Bricks.Div pd="${custom:default}" p="${custom}" spd="${custom%:default}" sp="${custom%}"/>';
    result = new Uu5String(template).toString({
      templateStrategy,
      templateDataMap: { custom: (defaultValue) => "abc" },
    });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toMatch"](expectedResult);
  });

  it("instance.toObject()", () => {
    const UU5STRING =
      '<Outer content="<uu5string/>${template:T}<Inner innerProp=10 data=\\"<uu5data/>key\\"/>" foo="bar">text<Inside/></Outer>';
    let uu5String = new Uu5String("<uu5string/>" + UU5STRING);
    expect(uu5String.toObject()).toEqual([
      {
        uu5Tag: "Outer",
        props: { content: '<uu5string/>${template:T}<Inner innerProp=10 data="<uu5data/>key"/>', foo: "bar" },
        children: ["text", { uu5Tag: "Inside", props: {} }],
      },
    ]);

    // uu5string string -> parse -> toObject() should be then parsable and return original uu5string (object -> parse -> toString())
    // including original template expressions, etc.
    expect(new Uu5String(uu5String.toObject()).toString()).toEqual(UU5STRING);
  });

  it("instance.toObject({ templateDataMap, filterFn })", () => {
    // templates are not evaluated by default
    const UU5STRING =
      '<Outer p="${template:T}" content="<uu5string/>${template:T}<Inner p=\\"${template:T}\\" innerProp=10 data=\\"<uu5data/>key\\"/>" foo="bar">text<Inside/></Outer>';
    let uu5String = new Uu5String("<uu5string/>" + UU5STRING);
    let result = uu5String.toObject({
      templateDataMap: { template: "notT" },
      filterFn: ({ uu5Tag, props, children }) => {
        return { uu5Tag: "Filtered" + uu5Tag, props: { ...props, extraProp: "a" } };
      },
    });
    expect(result).toEqual([
      {
        uu5Tag: "FilteredOuter",
        props: {
          content:
            '<uu5string/>${template:T}<FilteredInner p="${template:T}" innerProp=10 data="<uu5data/>key" extraProp="a"/>',
          foo: "bar",
          extraProp: "a",
          p: "${template:T}",
        },
        children: ["text", { uu5Tag: "FilteredInside", props: { extraProp: "a" } }],
      },
    ]);

    result = uu5String.toObject({
      templateDataMap: { template: "notT" },
      templateStrategy: "evaluate",
      filterFn: ({ uu5Tag, props, children }) => {
        return { uu5Tag: "Filtered" + uu5Tag, props: { ...props, extraProp: "a" } };
      },
    });
    expect(result).toEqual([
      {
        uu5Tag: "FilteredOuter",
        props: {
          content: '<uu5string/>notT<FilteredInner p="notT" innerProp=10 data="<uu5data/>key" extraProp="a"/>',
          foo: "bar",
          extraProp: "a",
          p: "notT",
        },
        children: ["text", { uu5Tag: "FilteredInside", props: { extraProp: "a" } }],
      },
    ]);
  });

  it.each(
    // prettier-ignore
    [
      [
        "copySoft",
        [
          [{"props": {"p": "${nonExisting}", "pd": "${nonExisting:default}", "sp": "${nonExisting%}", "spd": "${nonExisting%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": expect.stringMatching(/\$\{idHex32:[0-9a-f]{32}\}/), "pd": "${idHex32:default}", "sp": expect.stringMatching(/\$\{idHex32%:[0-9a-f]{32}\}/), "spd": expect.stringMatching(/\$\{idHex32%:[0-9a-f]{32}\}/)}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${now}", "pd": "${now:default}", "sp": "${now%}", "spd": "${now%:default}"}, "uu5Tag": "Uu5Bricks.Div"}], // does not support copySoft, i.e. same as preserve
          [{"props": {"p": "${custom:abc}", "pd": "${custom:default}", "sp": "${custom%:abc}", "spd": "${custom%:abc}"}, "uu5Tag": "Uu5Bricks.Div"}],
        ],
      ],
      [
        "copyHard",
        [
          [{"props": {"p": "${nonExisting}", "pd": "${nonExisting:default}", "sp": "${nonExisting%}", "spd": "${nonExisting%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": expect.stringMatching(/\$\{idHex32:[0-9a-f]{32}\}/), "pd": expect.stringMatching(/\$\{idHex32:[0-9a-f]{32}\}/), "sp": expect.stringMatching(/\$\{idHex32%:[0-9a-f]{32}\}/), "spd": expect.stringMatching(/\$\{idHex32%:[0-9a-f]{32}\}/)}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${now}", "pd": "${now:default}", "sp": "${now%}", "spd": "${now%:default}"}, "uu5Tag": "Uu5Bricks.Div"}], // does not support copyHard, i.e. same as preserve
          [{"props": {"p": "${custom:abc}", "pd": "${custom:abc}", "sp": "${custom%:abc}", "spd": "${custom%:abc}"}, "uu5Tag": "Uu5Bricks.Div"}],
        ],
      ],
      [
        "preserve",
        [
          [{"props": {"p": "${nonExisting}", "pd": "${nonExisting:default}", "sp": "${nonExisting%}", "spd": "${nonExisting%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${idHex32}", "pd": "${idHex32:default}", "sp": "${idHex32%}", "spd": "${idHex32%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${now}", "pd": "${now:default}", "sp": "${now%}", "spd": "${now%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${custom}", "pd": "${custom:default}", "sp": "${custom%}", "spd": "${custom%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
        ],
      ],
      [
        "evaluate",
        [
          [{"props": {"p": "${nonExisting}", "pd": "default", "sp": "${nonExisting%}", "spd": "default"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": expect.stringMatching(/[0-9a-f]{32}/), "pd": "default", "sp": expect.stringMatching(/[0-9a-f]{32}/), "spd": "default"}, "uu5Tag": "Uu5Bricks.Div"}], // idHex32 prefers default value to generated one
          [{"props": {"p": expect.stringMatching(/[0-9]{4}-[0-9]{2}[^"]*/), "pd": expect.stringMatching(/[0-9]{4}-[0-9]{2}[^"]*/), "sp": expect.stringMatching(/[0-9]{4}-[0-9]{2}[^"]*/), "spd": expect.stringMatching(/[0-9]{4}-[0-9]{2}[^"]*/)}, "uu5Tag": "Uu5Bricks.Div"}], // 'now' template never returns default value
          [{"props": {"p": "abc", "pd": "abc", "sp": "abc", "spd": "abc"}, "uu5Tag": "Uu5Bricks.Div"}],
        ],
      ],
      [
        undefined, // behaves as "preserve"
        [
          [{"props": {"p": "${nonExisting}", "pd": "${nonExisting:default}", "sp": "${nonExisting%}", "spd": "${nonExisting%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${idHex32}", "pd": "${idHex32:default}", "sp": "${idHex32%}", "spd": "${idHex32%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${now}", "pd": "${now:default}", "sp": "${now%}", "spd": "${now%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${custom}", "pd": "${custom:default}", "sp": "${custom%}", "spd": "${custom%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
        ],
      ],
  ],
  )("instance.toObject({ templateStrategy: %s })", (templateStrategy, expectedResults) => {
    let template,
      result,
      expectedResult,
      index = 0;

    // unknown template
    template =
      '<uu5string /><Uu5Bricks.Div pd="${nonExisting:default}" p="${nonExisting}" spd="${nonExisting%:default}" sp="${nonExisting%}"/>';
    result = new Uu5String(template).toObject({ templateStrategy });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toEqual"](expectedResult);

    // known default template
    template =
      '<uu5string /><Uu5Bricks.Div pd="${idHex32:default}" p="${idHex32}" spd="${idHex32%:default}" sp="${idHex32%}"/>';
    result = new Uu5String(template).toObject({ templateStrategy });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toEqual"](expectedResult);

    // known default template that doesn't support 'copySoft' (i.e. behaves as 'preserve')
    template = '<uu5string /><Uu5Bricks.Div pd="${now:default}" p="${now}" spd="${now%:default}" sp="${now%}"/>';
    result = new Uu5String(template).toObject({ templateStrategy });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toEqual"](expectedResult);

    // custom template
    template =
      '<uu5string /><Uu5Bricks.Div pd="${custom:default}" p="${custom}" spd="${custom%:default}" sp="${custom%}"/>';
    result = new Uu5String(template).toObject({
      templateStrategy,
      templateDataMap: { custom: (defaultValue) => "abc" },
    });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toEqual"](expectedResult);
  });

  it("array -> instance.toString()", () => {
    let newInstance = new Uu5String([
      { tag: "UU5.Bricks.Button", props: { disabled: true, content: undefined, colorSchema: null } },
    ]);
    expect(newInstance.toString()).toEqual("<UU5.Bricks.Button disabled colorSchema=null/>");
  });

  it("object -> instance.toString()", () => {
    let newInstance = new Uu5String({
      tag: "UU5.Bricks.Button",
      props: { disabled: true, content: undefined, colorSchema: null },
    });
    expect(newInstance.toString()).toEqual("<UU5.Bricks.Button disabled colorSchema=null/>");
  });

  it("uu5string -> instance.toString()", () => {
    let newInstance = new Uu5String(
      "<uu5string/><UU5.Bricks.Button disabled=true content=undefined colorSchema=null />",
    );
    expect(newInstance.toString()).toEqual("<UU5.Bricks.Button disabled colorSchema=null/>");
  });

  it("instance.clone({ templateDataMap })", () => {
    let newInstance = new Uu5String(sliderUu5String);
    let cloneIfc = newInstance.clone({ templateDataMap: newsliderUu5String });
    expect(cloneIfc).toEqual(
      expect.objectContaining({
        templateDataMap:
          '<uu5string /><UU5BricksSlider id="root2" key="parKey2"><UU5BricksSlider.Item value=10 min="0" max="10" step="5" id="child" key="childrenID"/></UU5BricksSlider>',
      }),
    );
  });

  it("instance.clone({ templateDataMap, initFn })", () => {
    const mockFunc = jest.fn();
    let newInstance = new Uu5String(filterContent, { templateDataMap: mockData, initFn: mockFunc });
    let cloneResult = newInstance.clone({ templateDataMap: newsliderUu5String, initFn: mockFunc });
    //3X calls mock func clone 3x calls mock in new
    expect(mockFunc).toHaveBeenCalledTimes(6);
    cleanupInstanceForSnapshot(cloneResult);
    expect(cloneResult).toMatchSnapshot();
  });
});

describe("Uu5String - test of interface of class", () => {
  it("isValid() should return true", () => {
    expect(Uu5String.isValid(codePreviewOutput)).toBeTruthy();
    expect(Uu5String.isValid(basicUu5StringTemplate)).toBeTruthy();
  });

  it("isValid() should return false", () => {
    expect(Uu5String.isValid(invalidTemplateUu5String)).toBeFalsy();
  });

  it("parse(uu5string) should return Uu5StringObject", () => {
    expect(Uu5String.parse("<uu5string /><UU5BricksSection />")).toMatchSnapshot();
    let codePreviewParse = Uu5String.parse(codePreviewOutput);
    expect(codePreviewParse).toMatchSnapshot();
    expect(codePreviewParse.toString()).toMatchSnapshot();

    // should allow tags with generation&version
    let parsed = Uu5String.parse(`<uu5string/><Uu5Tiles.Provider_g02v1>content</Uu5Tiles.Provider_g02v1>`);
    expect(Uu5String.contentToObject(parsed)).toMatchObject([
      { uu5Tag: "Uu5Tiles.Provider_g02v1", props: {}, children: ["content"] },
    ]);
  });

  it("parse(uu5string, { buildItemFn }) should return Uu5StringObject", () => {
    const mockFunc = jest.fn();
    const result = Uu5String.parse("<uu5string /><UU5BricksSection />", { buildItemFn: mockFunc });
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(mockFunc.mock.calls[0][0]).toMatch(/UU5BricksSection/);
    expect(result).toMatchSnapshot();
  });

  it("parse(uu5string, { allowedTagsRegExp })", () => {
    let itemList = Uu5String.parse(`<uu5string/><div><p>a0</p>a1</div>`, { allowedTagsRegExp: /^div$/ });
    expect(Uu5String.contentToChildren(itemList, { buildChildFn: null })).toMatchObject([
      { uu5Tag: "div", children: [{ uu5Tag: "invalidTag", props: { uu5Tag: "p" } }, "a1"] },
    ]);

    itemList = Uu5String.parse(`<uu5string/><p><div>b</div></p>`, { allowedTagsRegExp: /^div$/ });
    expect(Uu5String.contentToChildren(itemList, { buildChildFn: null })).toMatchObject([
      { uu5Tag: "invalidTag", props: { uu5Tag: "p" } },
    ]);

    itemList = Uu5String.parse(`<uu5string/><p/>`, { allowedTagsRegExp: /^div$/ });
    expect(Uu5String.contentToChildren(itemList, { buildChildFn: null })).toMatchObject([
      { uu5Tag: "invalidTag", props: { uu5Tag: "p" } },
    ]);

    itemList = Uu5String.parse(`<uu5string/><div data='<uu5string/>nested <p>a</p>'/>`, { allowedTagsRegExp: /^div$/ });
    expect(Uu5String.contentToChildren(itemList, { buildChildFn: null })).toMatchObject([
      { uu5Tag: "div", props: { data: ["nested ", { uu5Tag: "invalidTag", props: { uu5Tag: "p" } }] } },
    ]);
  });

  it("parse(invalidUu5String) should throw error", () => {
    expect(() => {
      Uu5String.parse(invalidTemplateUu5String);
    }).toThrow();
  });

  it("parseTagPropsArray(arrayOfObjects) should return Uu5StringObject", () => {
    let parsed = Uu5String.parseTagPropsArray([
      {
        uu5Tag: "UU5BricksSection",
        props: { foo: "bar" },
        children: [{ tag: "Content", props: { content: "<uu5string/><Nested />" } }, "text"],
      },
    ]);
    expect(parsed.length).toBe(1);
    expect(parsed[0] instanceof Uu5StringObject).toBeTruthy();
    expect(parsed[0]).toMatchSnapshot();
  });

  it("toChildren(uu5string)", () => {
    let toChildrenIfc = Uu5String.toChildren(codePreviewOutput);
    expect(toChildrenIfc).not.toBeNull();
    expect(toChildrenIfc).toMatchSnapshot();
  });

  it("toChildren(uu5string, { templateDataMap, filterFn })", () => {
    const mockFilter = jest.fn();
    let ifc = Uu5String.toChildren("<uu5string /><UU5BricksSection />", {
      templateDataMap: mockData,
      filterFn: mockFilter,
    });
    expect(mockFilter).toHaveBeenCalledTimes(1);
    expect(ifc).toMatchSnapshot();
    expect(mockFilter.mock.calls[0][0]).toEqual(
      expect.objectContaining({ uu5Tag: "UU5BricksSection", props: { children: [] } }),
    );
  });

  it("toChildren(uu5string, { buildChildFn })", () => {
    let buildChildFn = jest.fn((uu5Tag, props, children, context) => {
      return { T: uu5Tag, P: props, C: children };
    });
    let builtChildren = Uu5String.toChildren('<uu5string/><div a="b">A<br/></div><span/>text', { buildChildFn });
    expect(builtChildren).toMatchObject({
      length: 3,
      0: {
        T: "div",
        P: { a: "b" },
        C: ["A", { T: "br", P: {}, C: null }],
      },
      1: { T: "span", P: {}, C: null },
      2: "text",
    });
    // check "context" content in buildChildFn calls (build call order is <br>, <div>, <span>)
    expect(buildChildFn.mock.calls[0][3]).toEqual({ index: 1 });
    expect(buildChildFn.mock.calls[1][3]).toEqual({ index: 0 });
    expect(buildChildFn.mock.calls[2][3]).toEqual({ index: 1 });
  });

  it("toChildren(uu5string, { allowedTagsRegExp })", () => {
    let result = Uu5String.toChildren(`<uu5string/><div><p>a0</p>a1</div>`, {
      allowedTagsRegExp: /^div$/,
      buildChildFn: null,
    });
    expect(result).toMatchObject([
      { uu5Tag: "div", children: [{ uu5Tag: "invalidTag", props: { uu5Tag: "p" } }, "a1"] },
    ]);

    result = Uu5String.toChildren(`<uu5string/><p><div>b</div></p>`, {
      allowedTagsRegExp: /^div$/,
      buildChildFn: null,
    });
    expect(result).toMatchObject([{ uu5Tag: "invalidTag", props: { uu5Tag: "p" } }]);

    result = Uu5String.toChildren(`<uu5string/><p/>`, { allowedTagsRegExp: /^div$/, buildChildFn: null });
    expect(result).toMatchObject([{ uu5Tag: "invalidTag", props: { uu5Tag: "p" } }]);

    result = Uu5String.toChildren(`<uu5string/><div data='<uu5string/>nested <p>a</p>'/>`, {
      allowedTagsRegExp: /^div$/,
      buildChildFn: null,
    });
    expect(result).toMatchObject([
      { uu5Tag: "div", props: { data: ["nested ", { uu5Tag: "invalidTag", props: { uu5Tag: "p" } }] } },
    ]);
  });

  it("toString(uu5string)", () => {
    expect(Uu5String.toString(codePreviewOutput)).toMatchSnapshot();
    expect(Uu5String.toString(basicUu5StringTemplate)).toEqual(
      expect.stringContaining(
        "" + '<UU5BricksSection content="First section"/><UU5BricksSection content="Second section"/>',
      ),
    );
  });

  it("toString(uu5string, { templateDataMap, filterFn })", () => {
    const mockFilter = jest.fn();
    let ifc = Uu5String.toString("<uu5string /><UU5BricksSection />", {
      templateDataMap: mockData,
      filterFn: mockFilter,
    });
    expect(mockFilter).toHaveBeenCalledTimes(1);
    expect(ifc).toMatchSnapshot();
    expect(mockFilter.mock.calls[0][0]).toEqual(
      expect.objectContaining({ uu5Tag: "UU5BricksSection", props: { children: [] } }),
    );
  });

  it.each([
    [
      "copySoft",
      [
        '<Uu5Bricks.Div pd="${nonExisting:default}" p="${nonExisting}" spd="${nonExisting%:default}" sp="${nonExisting%}"/>',
        /^<Uu5Bricks.Div pd="\$\{idHex32:default\}" p="\$\{idHex32:[0-9a-f]{32}\}" spd="\$\{idHex32%:[0-9a-f]{32}\}" sp="\$\{idHex32%:[0-9a-f]{32}\}"\/>$/,
        '<Uu5Bricks.Div pd="${now:default}" p="${now}" spd="${now%:default}" sp="${now%}"/>', // does not support copySoft, i.e. same as preserve
        /^<Uu5Bricks.Div pd="\$\{custom:default\}" p="\$\{custom:abc\}" spd="\$\{custom%:abc\}" sp="\$\{custom%:abc\}"\/>$/,
      ],
    ],
    [
      "copyHard",
      [
        '<Uu5Bricks.Div pd="${nonExisting:default}" p="${nonExisting}" spd="${nonExisting%:default}" sp="${nonExisting%}"/>',
        /^<Uu5Bricks.Div pd="\$\{idHex32:[0-9a-f]{32}\}" p="\$\{idHex32:[0-9a-f]{32}\}" spd="\$\{idHex32%:[0-9a-f]{32}\}" sp="\$\{idHex32%:[0-9a-f]{32}\}"\/>$/,
        '<Uu5Bricks.Div pd="${now:default}" p="${now}" spd="${now%:default}" sp="${now%}"/>', // does not support copyHard, i.e. same as preserve
        /^<Uu5Bricks.Div pd="\$\{custom:abc\}" p="\$\{custom:abc\}" spd="\$\{custom%:abc\}" sp="\$\{custom%:abc\}"\/>$/,
      ],
    ],
    [
      "preserve",
      [
        '<Uu5Bricks.Div pd="${nonExisting:default}" p="${nonExisting}" spd="${nonExisting%:default}" sp="${nonExisting%}"/>',
        '<Uu5Bricks.Div pd="${idHex32:default}" p="${idHex32}" spd="${idHex32%:default}" sp="${idHex32%}"/>',
        '<Uu5Bricks.Div pd="${now:default}" p="${now}" spd="${now%:default}" sp="${now%}"/>',
        '<Uu5Bricks.Div pd="${custom:default}" p="${custom}" spd="${custom%:default}" sp="${custom%}"/>',
      ],
    ],
    [
      "evaluate",
      [
        '<Uu5Bricks.Div pd="default" p="${nonExisting}" spd="default" sp="${nonExisting%}"/>',
        /^<Uu5Bricks.Div pd="default" p="[0-9a-f]{32}" spd="default" sp="[0-9a-f]{32}"\/>$/, // idHex32 prefers default value to generated one
        /^<Uu5Bricks.Div pd="[0-9]{4}-[0-9]{2}[^"]*" p="[0-9]{4}-[0-9]{2}[^"]*" spd="[0-9]{4}-[0-9]{2}[^"]*" sp="[0-9]{4}-[0-9]{2}[^"]*"\/>$/, // 'now' template never returns default value
        '<Uu5Bricks.Div pd="abc" p="abc" spd="abc" sp="abc"/>',
      ],
    ],
    [
      undefined, // without templateDataMap it behaves as "preserve", otherwise as "evaluate" (last case)
      [
        '<Uu5Bricks.Div pd="${nonExisting:default}" p="${nonExisting}" spd="${nonExisting%:default}" sp="${nonExisting%}"/>',
        '<Uu5Bricks.Div pd="${idHex32:default}" p="${idHex32}" spd="${idHex32%:default}" sp="${idHex32%}"/>',
        '<Uu5Bricks.Div pd="${now:default}" p="${now}" spd="${now%:default}" sp="${now%}"/>',
        '<Uu5Bricks.Div pd="abc" p="abc" spd="abc" sp="abc"/>',
      ],
    ],
  ])("toString(uu5string, { templateStrategy: %s })", (templateStrategy, expectedResults) => {
    let template,
      result,
      expectedResult,
      index = 0;

    // unknown template
    template =
      '<uu5string /><Uu5Bricks.Div pd="${nonExisting:default}" p="${nonExisting}" spd="${nonExisting%:default}" sp="${nonExisting%}"/>';
    result = Uu5String.toString(template, { templateStrategy });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toMatch"](expectedResult);

    // known default template
    template =
      '<uu5string /><Uu5Bricks.Div pd="${idHex32:default}" p="${idHex32}" spd="${idHex32%:default}" sp="${idHex32%}"/>';
    result = Uu5String.toString(template, { templateStrategy });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toMatch"](expectedResult);

    // known default template that doesn't support 'copySoft' (i.e. behaves as 'preserve')
    template = '<uu5string /><Uu5Bricks.Div pd="${now:default}" p="${now}" spd="${now%:default}" sp="${now%}"/>';
    result = Uu5String.toString(template, { templateStrategy });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toMatch"](expectedResult);

    // custom template
    template =
      '<uu5string /><Uu5Bricks.Div pd="${custom:default}" p="${custom}" spd="${custom%:default}" sp="${custom%}"/>';
    result = Uu5String.toString(template, {
      templateStrategy,
      templateDataMap: { custom: (defaultValue) => "abc" },
    });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toMatch"](expectedResult);
  });

  it("toString(uu5string, { allowedTagsRegExp })", () => {
    let result = Uu5String.toString(`<uu5string/><div><p>a0</p>a1</div>`, { allowedTagsRegExp: /^div$/ });
    expect(result).toBe('<div><invalidTag uu5Tag="p" tag="p">Error: Tag <p /> is not allowed.</invalidTag>a1</div>');

    result = Uu5String.toString(`<uu5string/><p><div>b</div></p>`, { allowedTagsRegExp: /^div$/ });
    expect(result).toBe('<invalidTag uu5Tag="p" tag="p">Error: Tag <p /> is not allowed.</invalidTag>');

    result = Uu5String.toString(`<uu5string/><p/>`, { allowedTagsRegExp: /^div$/ });
    expect(result).toBe('<invalidTag uu5Tag="p" tag="p">Error: Tag <p /> is not allowed.</invalidTag>');

    result = Uu5String.toString(`<uu5string/><div data='<uu5string/>nested <p>a</p>'/>`, {
      allowedTagsRegExp: /^div$/,
    });
    expect(result).toBe(
      '<div data=\'<uu5string/>nested <invalidTag uu5Tag="p" tag="p">Error: Tag <p /> is not allowed.</invalidTag>\'/>',
    );
  });

  it("toObject(uu5string)", () => {
    expect(Uu5String.toObject(basicUu5StringTemplate)).toEqual([
      { props: { content: "First section" }, uu5Tag: "UU5BricksSection" },
      { props: { content: "Second section" }, uu5Tag: "UU5BricksSection" },
    ]);

    const UU5STRING =
      '<Outer content="<uu5string/>${template:T}<Inner innerProp=10 data=\\"<uu5data/>key\\"/>" foo="bar">text<Inside/></Outer>';
    expect(Uu5String.toObject("<uu5string/>" + UU5STRING)).toEqual([
      {
        uu5Tag: "Outer",
        props: { content: '<uu5string/>${template:T}<Inner innerProp=10 data="<uu5data/>key"/>', foo: "bar" },
        children: ["text", { uu5Tag: "Inside", props: {} }],
      },
    ]);
  });

  it("toObject(uu5string, { templateDataMap, filterFn })", () => {
    const mockFilter = jest.fn();
    let ifc = Uu5String.toObject("<uu5string /><UU5BricksSection />", {
      templateDataMap: mockData,
      filterFn: mockFilter,
    });
    expect(mockFilter).toHaveBeenCalledTimes(1);
    expect(ifc).toMatchSnapshot();
    expect(mockFilter.mock.calls[0][0]).toEqual(
      expect.objectContaining({ uu5Tag: "UU5BricksSection", props: { children: [] } }),
    );

    // templates are not evaluated by default
    const UU5STRING =
      '<Outer p="${template:T}" content="<uu5string/>${template:T}<Inner p=\\"${template:T}\\" innerProp=10 data=\\"<uu5data/>key\\"/>" foo="bar">text<Inside/></Outer>';
    let result = Uu5String.toObject("<uu5string/>" + UU5STRING, {
      templateDataMap: { template: "notT" },
      filterFn: ({ uu5Tag, props, children }) => {
        return { uu5Tag: "Filtered" + uu5Tag, props: { ...props, extraProp: "a" } };
      },
    });
    expect(result).toEqual([
      {
        uu5Tag: "FilteredOuter",
        props: {
          content:
            '<uu5string/>${template:T}<FilteredInner p="${template:T}" innerProp=10 data="<uu5data/>key" extraProp="a"/>',
          foo: "bar",
          extraProp: "a",
          p: "${template:T}",
        },
        children: ["text", { uu5Tag: "FilteredInside", props: { extraProp: "a" } }],
      },
    ]);

    result = Uu5String.toObject("<uu5string/>" + UU5STRING, {
      templateDataMap: { template: "notT" },
      templateStrategy: "evaluate",
      filterFn: ({ uu5Tag, props, children }) => {
        return { uu5Tag: "Filtered" + uu5Tag, props: { ...props, extraProp: "a" } };
      },
    });
    expect(result).toEqual([
      {
        uu5Tag: "FilteredOuter",
        props: {
          content: '<uu5string/>notT<FilteredInner p="notT" innerProp=10 data="<uu5data/>key" extraProp="a"/>',
          foo: "bar",
          extraProp: "a",
          p: "notT",
        },
        children: ["text", { uu5Tag: "FilteredInside", props: { extraProp: "a" } }],
      },
    ]);
  });

  it.each(
    // prettier-ignore
    [
      [
        "copySoft",
        [
          [{"props": {"p": "${nonExisting}", "pd": "${nonExisting:default}", "sp": "${nonExisting%}", "spd": "${nonExisting%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": expect.stringMatching(/\$\{idHex32:[0-9a-f]{32}\}/), "pd": "${idHex32:default}", "sp": expect.stringMatching(/\$\{idHex32%:[0-9a-f]{32}\}/), "spd": expect.stringMatching(/\$\{idHex32%:[0-9a-f]{32}\}/)}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${now}", "pd": "${now:default}", "sp": "${now%}", "spd": "${now%:default}"}, "uu5Tag": "Uu5Bricks.Div"}], // does not support copySoft, i.e. same as preserve
          [{"props": {"p": "${custom:abc}", "pd": "${custom:default}", "sp": "${custom%:abc}", "spd": "${custom%:abc}"}, "uu5Tag": "Uu5Bricks.Div"}],
        ],
      ],
      [
        "copyHard",
        [
          [{"props": {"p": "${nonExisting}", "pd": "${nonExisting:default}", "sp": "${nonExisting%}", "spd": "${nonExisting%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": expect.stringMatching(/\$\{idHex32:[0-9a-f]{32}\}/), "pd": expect.stringMatching(/\$\{idHex32:[0-9a-f]{32}\}/), "sp": expect.stringMatching(/\$\{idHex32%:[0-9a-f]{32}\}/), "spd": expect.stringMatching(/\$\{idHex32%:[0-9a-f]{32}\}/)}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${now}", "pd": "${now:default}", "sp": "${now%}", "spd": "${now%:default}"}, "uu5Tag": "Uu5Bricks.Div"}], // does not support copyHard, i.e. same as preserve
          [{"props": {"p": "${custom:abc}", "pd": "${custom:abc}", "sp": "${custom%:abc}", "spd": "${custom%:abc}"}, "uu5Tag": "Uu5Bricks.Div"}],
        ],
      ],
      [
        "preserve",
        [
          [{"props": {"p": "${nonExisting}", "pd": "${nonExisting:default}", "sp": "${nonExisting%}", "spd": "${nonExisting%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${idHex32}", "pd": "${idHex32:default}", "sp": "${idHex32%}", "spd": "${idHex32%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${now}", "pd": "${now:default}", "sp": "${now%}", "spd": "${now%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${custom}", "pd": "${custom:default}", "sp": "${custom%}", "spd": "${custom%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
        ],
      ],
      [
        "evaluate",
        [
          [{"props": {"p": "${nonExisting}", "pd": "default", "sp": "${nonExisting%}", "spd": "default"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": expect.stringMatching(/[0-9a-f]{32}/), "pd": "default", "sp": expect.stringMatching(/[0-9a-f]{32}/), "spd": "default"}, "uu5Tag": "Uu5Bricks.Div"}], // idHex32 prefers default value to generated one
          [{"props": {"p": expect.stringMatching(/[0-9]{4}-[0-9]{2}[^"]*/), "pd": expect.stringMatching(/[0-9]{4}-[0-9]{2}[^"]*/), "sp": expect.stringMatching(/[0-9]{4}-[0-9]{2}[^"]*/), "spd": expect.stringMatching(/[0-9]{4}-[0-9]{2}[^"]*/)}, "uu5Tag": "Uu5Bricks.Div"}], // 'now' template never returns default value
          [{"props": {"p": "abc", "pd": "abc", "sp": "abc", "spd": "abc"}, "uu5Tag": "Uu5Bricks.Div"}],
        ],
      ],
      [
        undefined, // behaves as "preserve"
        [
          [{"props": {"p": "${nonExisting}", "pd": "${nonExisting:default}", "sp": "${nonExisting%}", "spd": "${nonExisting%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${idHex32}", "pd": "${idHex32:default}", "sp": "${idHex32%}", "spd": "${idHex32%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${now}", "pd": "${now:default}", "sp": "${now%}", "spd": "${now%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
          [{"props": {"p": "${custom}", "pd": "${custom:default}", "sp": "${custom%}", "spd": "${custom%:default}"}, "uu5Tag": "Uu5Bricks.Div"}],
        ],
      ],
  ],
  )("toObject(uu5string, { templateStrategy: %s })", (templateStrategy, expectedResults) => {
    let template,
      result,
      expectedResult,
      index = 0;

    // unknown template
    template =
      '<uu5string /><Uu5Bricks.Div pd="${nonExisting:default}" p="${nonExisting}" spd="${nonExisting%:default}" sp="${nonExisting%}"/>';
    result = Uu5String.toObject(template, { templateStrategy });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toEqual"](expectedResult);

    // known default template
    template =
      '<uu5string /><Uu5Bricks.Div pd="${idHex32:default}" p="${idHex32}" spd="${idHex32%:default}" sp="${idHex32%}"/>';
    result = Uu5String.toObject(template, { templateStrategy });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toEqual"](expectedResult);

    // known default template that doesn't support 'copySoft' (i.e. behaves as 'preserve')
    template = '<uu5string /><Uu5Bricks.Div pd="${now:default}" p="${now}" spd="${now%:default}" sp="${now%}"/>';
    result = Uu5String.toObject(template, { templateStrategy });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toEqual"](expectedResult);

    // custom template
    template =
      '<uu5string /><Uu5Bricks.Div pd="${custom:default}" p="${custom}" spd="${custom%:default}" sp="${custom%}"/>';
    result = Uu5String.toObject(template, {
      templateStrategy,
      templateDataMap: { custom: (defaultValue) => "abc" },
    });
    expectedResult = expectedResults[index++];
    expect(result)[typeof expectedResult === "string" ? "toEqual" : "toEqual"](expectedResult);
  });

  it("toObject(uu5string, { allowedTagsRegExp })", () => {
    let result = Uu5String.toObject(`<uu5string/><div><p>a0</p>a1</div>`, { allowedTagsRegExp: /^div$/ });
    expect(result).toEqual([
      {
        uu5Tag: "div",
        props: {},
        children: [
          { uu5Tag: "invalidTag", props: { tag: "p", uu5Tag: "p" }, children: ["Error: Tag <p /> is not allowed."] },
          "a1",
        ],
      },
    ]);

    result = Uu5String.toObject(`<uu5string/><p><div>b</div></p>`, { allowedTagsRegExp: /^div$/ });
    expect(result).toEqual([
      { uu5Tag: "invalidTag", props: { tag: "p", uu5Tag: "p" }, children: ["Error: Tag <p /> is not allowed."] },
    ]);

    result = Uu5String.toObject(`<uu5string/><p/>`, { allowedTagsRegExp: /^div$/ });
    expect(result).toEqual([
      { uu5Tag: "invalidTag", props: { tag: "p", uu5Tag: "p" }, children: ["Error: Tag <p /> is not allowed."] },
    ]);

    result = Uu5String.toObject(`<uu5string/><div data='<uu5string/>nested <p>a</p>'/>`, {
      allowedTagsRegExp: /^div$/,
    });
    expect(result).toEqual([
      {
        uu5Tag: "div",
        props: {
          data: '<uu5string/>nested <invalidTag uu5Tag="p" tag="p">Error: Tag <p /> is not allowed.</invalidTag>',
        },
      },
    ]);
  });

  it("contentToChildren(uu5stringObjects) should not throw error I", () => {
    expect(Uu5String.contentToChildren([sliderUu5String])).toEqual([
      '<uu5string /><UU5BricksSlider id="root" key="parKey"><UU5BricksSlider.Item value=5 id="child" key="childrenID"/></UU5BricksSlider>',
    ]);
  });

  it("contentToChildren(uu5string, { templateDataMap, filterFn })", () => {
    let uu5string = new Uu5String(
      "<uu5string /><UU5BricksButton /><UU5BricksParagraph><UU5BricksIcon /></UU5BricksParagraph>",
    );
    const mockFilter = jest.fn();
    let ifc = Uu5String.contentToChildren(uu5string.content, { templateDataMap: mockData, filterFn: mockFilter });
    expect(mockFilter).toHaveBeenCalledTimes(3);
    expect(ifc).toMatchSnapshot();
  });

  it("contentToChildren(uu5string, { buildChildFn })", () => {
    let buildChildFn = jest.fn((uu5Tag, props, children, context) => {
      return { T: uu5Tag, P: props, C: children };
    });
    let builtChildren = Uu5String.contentToChildren(
      new Uu5String('<uu5string/><div a="b">A<br/></div><span/>text').content,
      { buildChildFn },
    );
    expect(builtChildren).toMatchObject({
      length: 3,
      0: {
        T: "div",
        P: { a: "b" },
        C: ["A", { T: "br", P: {}, C: null }],
      },
      1: { T: "span", P: {}, C: null },
      2: "text",
    });
    // check "context" content in buildChildFn calls (build call order is <br>, <div>, <span>)
    expect(buildChildFn.mock.calls[0][3]).toEqual({ index: 1 });
    expect(buildChildFn.mock.calls[1][3]).toEqual({ index: 0 });
    expect(buildChildFn.mock.calls[2][3]).toEqual({ index: 1 });
  });

  it("contentToChildren(uu5stringObjects) should not throw error II", () => {
    expect(Uu5String.contentToChildren([formsTextUu5String])).toEqual([
      '<uu5string /><UU5FormsText id="myId" key="parKer" value="John Doe" password="false" patterMessage="Toto není co jsem čekal." pattern="[A-Za-z]{3}"/>',
    ]);
  });

  it("contentToString(uu5stringObjects)", () => {
    expect(Uu5String.contentToString([formsTextUu5String])).toEqual(
      '<uu5string /><UU5FormsText id="myId" key="parKer" value="John Doe" password="false" patterMessage="Toto není co jsem čekal." pattern="[A-Za-z]{3}"/>',
    );
  });

  it("contentToString(uu5string, { templateDataMap, filterFn })", () => {
    let uu5string = new Uu5String(
      "<uu5string /><UU5BricksButton /><UU5BricksParagraph><UU5BricksIcon /></UU5BricksParagraph>",
    );
    const mockFilter = jest.fn();
    let ifc = Uu5String.contentToString(uu5string.content, { templateDataMap: mockData, filterFn: mockFilter });
    expect(mockFilter).toHaveBeenCalledTimes(3);
    expect(ifc).toMatchSnapshot();
  });

  it("contentToObject(uu5stringObjects)", () => {
    let uu5string = new Uu5String(
      "<uu5string /><UU5BricksButton /><UU5BricksParagraph><UU5BricksIcon /></UU5BricksParagraph>",
    );
    expect(Uu5String.contentToObject(uu5string.content)).toEqual([
      { uu5Tag: "UU5BricksButton", props: {} },
      { uu5Tag: "UU5BricksParagraph", props: {}, children: [{ uu5Tag: "UU5BricksIcon", props: {} }] },
    ]);

    const UU5STRING =
      '<Outer content="<uu5string/>${template:T}<Inner innerProp=10 data=\\"<uu5data/>key\\"/>" foo="bar">text<Inside/></Outer>';
    let uu5String = new Uu5String("<uu5string/>" + UU5STRING);
    expect(Uu5String.contentToObject(uu5String.content)).toEqual([
      {
        uu5Tag: "Outer",
        props: { content: '<uu5string/>${template:T}<Inner innerProp=10 data="<uu5data/>key"/>', foo: "bar" },
        children: ["text", { uu5Tag: "Inside", props: {} }],
      },
    ]);
  });

  it("contentToObject(uu5string, { templateDataMap, filterFn })", () => {
    let uu5string = new Uu5String(
      "<uu5string /><UU5BricksButton /><UU5BricksParagraph><UU5BricksIcon /></UU5BricksParagraph>",
    );
    const mockFilter = jest.fn();
    let ifc = Uu5String.contentToObject(uu5string.content, { templateDataMap: mockData, filterFn: mockFilter });
    expect(mockFilter).toHaveBeenCalledTimes(3);
    expect(ifc).toMatchSnapshot();

    // templates are not evaluated by default
    const UU5STRING =
      '<Outer p="${template:T}" content="<uu5string/>${template:T}<Inner p=\\"${template:T}\\" innerProp=10 data=\\"<uu5data/>key\\"/>" foo="bar">text<Inside/></Outer>';
    let uu5String = new Uu5String("<uu5string/>" + UU5STRING);
    let result = Uu5String.contentToObject(uu5String.content, {
      templateDataMap: { template: "notT" },
      filterFn: ({ uu5Tag, props, children }) => {
        return { uu5Tag: "Filtered" + uu5Tag, props: { ...props, extraProp: "a" } };
      },
    });
    expect(result).toEqual([
      {
        uu5Tag: "FilteredOuter",
        props: {
          content:
            '<uu5string/>${template:T}<FilteredInner p="${template:T}" innerProp=10 data="<uu5data/>key" extraProp="a"/>',
          foo: "bar",
          extraProp: "a",
          p: "${template:T}",
        },
        children: ["text", { uu5Tag: "FilteredInside", props: { extraProp: "a" } }],
      },
    ]);

    uu5String = new Uu5String("<uu5string/>" + UU5STRING);
    result = Uu5String.contentToObject(uu5String.content, {
      templateDataMap: { template: "notT" },
      templateStrategy: "evaluate",
      filterFn: ({ uu5Tag, props, children }) => {
        return { uu5Tag: "Filtered" + uu5Tag, props: { ...props, extraProp: "a" } };
      },
    });
    expect(result).toEqual([
      {
        uu5Tag: "FilteredOuter",
        props: {
          content: '<uu5string/>notT<FilteredInner p="notT" innerProp=10 data="<uu5data/>key" extraProp="a"/>',
          foo: "bar",
          extraProp: "a",
          p: "notT",
        },
        children: ["text", { uu5Tag: "FilteredInside", props: { extraProp: "a" } }],
      },
    ]);
  });

  it("filteringEmptyNodes", () => {
    const template =
      '<uu5string /><UU5BricksParagraph content="Lorem ipsum ..." /><UU5BricksParagraph /><UU5BricksParagraph>Lorem ipsum ...</UU5BricksParagraph>';
    const uu5string = new Uu5String(template);
    const filterFn = ({ tag, props }) => {
      return !props.content && props.children.length === 0 ? false : { tag, props };
    };

    // without filter function
    expect(uu5string.toChildren().length).toBe(3);
    // filter empty paragraph - in result array is null instead of filtered component => it is needed to filter result array of children
    expect(uu5string.toChildren({ templateDataMap: null, filterFn }).filter((item) => item !== null).length).toBe(2);
  });

  it("differentDataTypesInProps", () => {
    const template =
      '<uu5string /><UU5BricksDiv booleanTrue=true booleanFalse=false booleanTrue2 number=3 numberZero=0 numberNegative=-5 json=\'<uu5json />{"key": "value", "numberKey": 3, "booleanKey": false}\' uu5string=\'<uu5string /><UU5BricksSpan /><UU5BricksSpan /><UU5BricksSpan />\' />';
    const uu5string = new Uu5String(template);
    const toChildrenMockFn = jest.fn();
    const toStringMockFn = jest.fn();
    const props = uu5string.toChildren({ filterFn: toChildrenMockFn })[0].props;

    // test props value
    expect(props.booleanTrue).toBeTruthy();
    expect(props.booleanTrue2).toBeTruthy();
    expect(props.booleanFalse).toBeFalsy();
    expect(props.number).toBe(3);
    expect(props.numberZero).toBe(0);
    expect(props.numberNegative).toBe(-5);

    // test üu5json in props
    let json = props.json;
    expect(json).toBeInstanceOf(Object);
    expect(json).not.toBeNull();
    expect(json.key).toBe("value");
    expect(json.numberKey).toBe(3);
    expect(json.booleanKey).toBeFalsy();

    // test uu5string in props - test if inner components will be parsed into components
    uu5string.toString({ filterFn: toStringMockFn });
    expect(toStringMockFn).toHaveBeenCalledTimes(4);
    expect(toChildrenMockFn).toHaveBeenCalledTimes(4);
  });

  it("Basic uu5data evaluation", () => {
    const UU5STRING = '<uu5string /><UU5BricksDiv content="<uu5data/>dataKey" />';
    const testData = "Test data";
    const uu5DataMap = { dataKey: testData };

    let rendered = Uu5String.toChildren(UU5STRING, { uu5DataMap });
    expect(rendered[0].props.content).toBe(testData);
    rendered = new Uu5String(UU5STRING).toChildren({ uu5DataMap });
    expect(rendered[0].props.content).toBe(testData);
    rendered = new Uu5String(UU5STRING, { uu5DataMap }).toChildren();
    expect(rendered[0].props.content).toBe(testData);

    rendered = Uu5String.toPlainText(UU5STRING, { uu5DataMap });
    expect(rendered).toBe(testData);

    rendered = new Uu5String(UU5STRING).toPlainText({ uu5DataMap });
    expect(rendered).toBe(testData);

    rendered = new Uu5String(UU5STRING, { uu5DataMap }).toPlainText();
    expect(rendered).toBe(testData);

    rendered = new Uu5String(UU5STRING).toString();
    expect(rendered).toBe('<UU5BricksDiv content="<uu5data/>dataKey"/>');
  });

  it("Dynamic uu5data evaluation", () => {
    const UU5STRING = '<uu5string /><UU5BricksDiv content="<uu5data/>dataKey" />';
    const testData = "Test data";
    const uu5DataMap = { dataKey: testData };

    const itemList = Uu5String.parse(UU5STRING);
    let rendered = Uu5String.contentToChildren(itemList, { uu5DataMap });
    expect(rendered[0].props.content).toBe(testData);
    rendered = Uu5String.contentToPlainText(itemList, { uu5DataMap });
    expect(rendered).toBe(testData);
  });

  it("Dynamic uu5data evaluation #2", () => {
    const uu5string = Uu5String.parse('<uu5string /><UU5BricksDiv data="<uu5data/>nested.data.key" />');
    const testData = "Test data";
    let rendered;

    let uu5DataMap = { nested: { data: { key: testData } } };
    rendered = Uu5String.contentToChildren(uu5string, { uu5DataMap });
    expect(rendered[0].props.data).toBe(testData);

    uu5DataMap = { nested: true };
    rendered = Uu5String.contentToChildren(uu5string, { uu5DataMap });
    expect(rendered[0].props.data).toBe(undefined);

    uu5DataMap = undefined;
    rendered = Uu5String.contentToChildren(uu5string, { uu5DataMap });
    expect(rendered[0].props.data).toBe(undefined);
  });

  it("Test parsing components", () => {
    const innerComponentsTemp1 =
      "<uu5string /><UU5BricksSection><UU5BricksParagraph><UU5BricksSpan /></UU5BricksParagraph></UU5BricksSection>";
    const innerComponentsTemp2 =
      "<uu5string /><UU5BricksSection content='<uu5string /><UU5BricksParagraph><UU5BricksSpan /></UU5BricksParagraph>' />";
    const innerComponentsTemp3 =
      "<uu5string /><UU5BricksSection content='<uu5string /><UU5BricksParagraph content=\"<uu5string /><UU5BricksSpan />\" />' />";

    // check parsing all component
    let mockFn = jest.fn();
    let uu5string = new Uu5String(innerComponentsTemp1, { initFn: mockFn });
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(uu5string.toString()).toMatchSnapshot();

    mockFn = jest.fn();
    uu5string = new Uu5String(innerComponentsTemp2, { initFn: mockFn });
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(uu5string.toString()).toMatchSnapshot();

    mockFn = jest.fn();
    uu5string = new Uu5String(innerComponentsTemp3, { initFn: mockFn });
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(uu5string.toString()).toMatchSnapshot();

    let text = String.raw`text &lt;notATag0&gt; &amp;lt; ${"$"}{templateText}<UU5CommonDiv attr="quote:\"">&lt;notATag1&gt;</UU5CommonDiv>`;
    uu5string = new Uu5String("<uu5string/>" + text);
    expect(uu5string.toString()).toBe(text);

    text = String.raw`<UuApp.DesignKit.UU5ComponentProps data='<uu5json/>[
  [
    "<uu5string/>Value&lt;"
  ]
]'/>`;
    uu5string = new Uu5String("<uu5string/>" + text);
    expect(uu5string.toString()).toBe(text);

    text = String.raw`<UuApp.DesignKit.UU5ComponentProps data='<uu5json/>[
  [
    "a",
    "b",
    "c",
    "<uu5string/>&quot;&#060;&apos;Value&lt;"
  ]
]'/>`;
    uu5string = new Uu5String("<uu5string/>" + text);
    expect(uu5string.toString()).toBe(text);

    text = String.raw`<UuApp.DesignKit.UU5ComponentProps data='<uu5json/>[
  [
    "<uu5string/>\\"Val\\\\\\\\ue&lt; :-) &#060;"
  ]
]'/>&lt;&#060; :-)`;
    uu5string = new Uu5String("<uu5string/>" + text);
    expect(uu5string.toString()).toBe(text);

    // test displayed text when using toChildren()
    text = String.raw`
<UU5CommonDiv id="d1">&lt;&#060;</UU5CommonDiv>
<UU5CommonDiv id="d2" style='<uu5json/>{"content":"a\\\\b"}' content="<uu5string/>\"Value&lt;&#060;:-)"/>
<UU5CommonDiv
  id="d3"
  content="<uu5string/>
    <UU5CommonDiv id='d3-1' content='<uu5string/>nested div &quot;&amp;quot;&#060; single backslash: \\\\'/>
    <UU5CommonDiv id='d3-2' content='<uu5json/>[\"<uu5string/>:-) &gt; \\\\\\\\ &#060; text\"]' />
  "
/>
`;
    uu5string = new Uu5String("<uu5string/>" + text);
    let builtChildren = uu5string.toChildren();
    expect(findBuiltById(builtChildren, "d1")).toMatchObject({ props: { children: ["<<"] } });
    expect(findBuiltById(builtChildren, "d2")).toMatchObject({ props: { style: { content: "a\\b" } } });
    expect(findBuiltById(builtChildren, "d2")).toMatchObject({ props: { content: ['"Value<<🙂'] } });
    expect(findBuiltById(builtChildren, "d3-1")).toMatchObject({
      props: { content: ['nested div "&quot;< single backslash: \\'] },
    });
    expect(findBuiltById(builtChildren, "d3-2")).toMatchObject({
      props: { content: ["<uu5string/>:-) &gt; \\ &#060; text"] },
    });

    text = String.raw`<b>bold</b> <script>script</script> <scRipt>alert</scRipt> <b>bold</b>`;
    uu5string = new Uu5String("<uu5string/>" + text);
    builtChildren = uu5string.toChildren();
    expect(findBuiltByTag(builtChildren, "script")).toBeFalsy();
    expect(findBuiltByTag(builtChildren, "scRipt")).toBeFalsy();
    expect(findBuiltText(builtChildren)).toContain("<script>script</script> <scRipt>alert</scRipt>");
  });

  it("uu5string template", () => {
    let template = '<uu5string /><UU5BricksDiv propWithDefault="${temp:default}" prop="${temp}"/>';
    let uu5string = new Uu5String(template);

    // undefined data - used empty object as a defaultData
    let props = uu5string.toChildren()[0].props;
    expect(props.propWithDefault).toEqual("default");
    expect(props.prop).toEqual("${temp}");
    expect(uu5string.toString()).toEqual('<UU5BricksDiv propWithDefault="${temp:default}" prop="${temp}"/>');

    // null data - templates does not been evaluated at all
    props = uu5string.toChildren({ templateDataMap: null })[0].props;
    expect(props.propWithDefault).toBe("${temp:default}");
    expect(props.prop).toBe("${temp}");
    expect(uu5string.toString({ templateDataMap: null })).toEqual(
      '<UU5BricksDiv propWithDefault="${temp:default}" prop="${temp}"/>',
    );

    // empty object data
    props = uu5string.toChildren({ templateDataMap: {} })[0].props;
    expect(props.propWithDefault).toEqual("default");
    expect(props.prop).toEqual("${temp}");
    expect(uu5string.toString({ templateDataMap: {} })).toEqual(
      '<UU5BricksDiv propWithDefault="default" prop="${temp}"/>',
    );

    // data
    props = uu5string.toChildren({ templateDataMap: { temp: "value" } })[0].props;
    expect(props.propWithDefault).toEqual("value");
    expect(props.prop).toEqual("value");
    expect(uu5string.toString({ templateDataMap: { temp: "value" } })).toEqual(
      '<UU5BricksDiv propWithDefault="value" prop="value"/>',
    );

    // function in data
    let fn = jest.fn(() => "value");
    props = uu5string.toChildren({ templateDataMap: { temp: fn } })[0].props;
    expect(props.propWithDefault).toEqual("value");
    expect(props.prop).toEqual("value");
    expect(uu5string.toString({ templateDataMap: { temp: () => "value" } })).toEqual(
      '<UU5BricksDiv propWithDefault="value" prop="value"/>',
    );
    expect(fn).toHaveBeenCalledWith("default", ["temp"], expect.any(Object));

    // default value with uu5json, uu5string, ...
    template =
      "<Comp num='${x:<uu5json/>1}' bool='${x:<uu5json/>false}' null='${x:<uu5json/>null}' undefined='${x}' json='${x:<uu5json/>[]}' data='${x:<uu5string/><UU5BricksSection />}'/>";
    uu5string = new Uu5String("<uu5string/>" + template);
    props = uu5string.toChildren({ buildChildFn: null })[0].props;
    expect(props.num).toBe(1);
    expect(props.bool).toBe(false);
    expect(props.null).toBe(null);
    // expect(props.undefined).toBe(undefined); // TODO Currently contains ${x}, which seems wrong.
    expect(props.json).toEqual([]);
    expect(props.data).toMatchObject([{ uu5Tag: "UU5BricksSection" }]);
    expect(uu5string.toString()).toEqual(template);
  });

  it("uu5string template - template fn should receive context", () => {
    let templateFn = jest.fn((defaultValue, keyPath, context) => "asdf");
    let uu5String = new Uu5String("<uu5string/><UU5CommonDiv>${key.path}</UU5CommonDiv>");
    uu5String.toChildren({
      templateDataMap: { key: templateFn },
    });
    expect(templateFn).toHaveBeenCalledTimes(1);
    expect(templateFn).toHaveBeenCalledWith(undefined, ["key", "path"], {
      location: "content",
      value: "${key.path}",
      matchValue: "${key.path}",
      matchStartIndex: 0,
      matchEndIndex: 11,
    });
    templateFn.mockClear();

    uu5String = new Uu5String("<uu5string/><UU5CommonDiv>text ${key.path:def} text2</UU5CommonDiv>");
    uu5String.toChildren({
      templateDataMap: { key: { path: templateFn } },
    });
    expect(templateFn).toHaveBeenCalledTimes(1);
    expect(templateFn).toHaveBeenCalledWith("def", ["key", "path"], {
      location: "content",
      value: "text ${key.path:def} text2",
      matchValue: "${key.path:def}",
      matchStartIndex: 5,
      matchEndIndex: 20,
    });
    templateFn.mockClear();

    uu5String = new Uu5String("<uu5string/><UU5CommonDiv value='text ${key.path} text2'></UU5CommonDiv>");
    uu5String.toChildren({
      templateDataMap: { key: { path: templateFn } },
    });
    expect(templateFn).toHaveBeenCalledTimes(1);
    expect(templateFn).toHaveBeenCalledWith(undefined, ["key", "path"], {
      location: "prop",
      propName: "value",
      value: "text ${key.path} text2",
      matchValue: "${key.path}",
      matchStartIndex: 5,
      matchEndIndex: 16,
    });
    templateFn.mockClear();

    uu5String = new Uu5String("<uu5string/><UU5CommonDiv children='text ${key.path} text2'>abc</UU5CommonDiv>");
    uu5String.toChildren({
      templateDataMap: { key: { path: templateFn } },
    });
    expect(templateFn).toHaveBeenCalledTimes(1);
    expect(templateFn).toHaveBeenCalledWith(undefined, ["key", "path"], {
      location: "prop",
      propName: "children",
      value: "text ${key.path} text2",
      matchValue: "${key.path}",
      matchStartIndex: 5,
      matchEndIndex: 16,
    });
    templateFn.mockClear();
  });

  it("uu5string props in children", () => {
    const uu5string = `<uu5string />
      <UU5BricksSection>
        <uu5string propName="header">Section Header</uu5string>
      </UU5BricksSection>`;

    let builtChildren = Uu5String.toChildren(uu5string);
    expect(findBuiltByTag(builtChildren, "UU5BricksSection")).toMatchObject({ props: { header: "Section Header" } });

    const parsed = Uu5String.parse(uu5string);
    const stringified = "<uu5string />" + Uu5String.contentToString(parsed);
    expect(stringified).toBe(uu5string);
  });

  it("uu5json props in children", () => {
    const uu5string = `<uu5string />
      <UU5BricksSection>
        <uu5json propName="data">{
  "header": "Section Header"
}</uu5json>
      </UU5BricksSection>`;

    let builtChildren = Uu5String.toChildren(uu5string);
    expect(findBuiltByTag(builtChildren, "UU5BricksSection")).toMatchObject({
      props: { data: { header: "Section Header" } },
    });

    const parsed = Uu5String.parse(uu5string);
    const stringified = "<uu5string />" + Uu5String.contentToString(parsed);
    expect(stringified).toBe(uu5string);
  });

  it("toPlainText(uu5string)", () => {
    let tests = [
      {
        uu5string: '<uu5string /><div><span className="hello">Hello</span> <span className="world">World</span></div>',
        plainText: "Hello World",
      },
      {
        uu5string: '<uu5string /><div><span content="Hello" /> <span content="World" /></div>',
        plainText: "Hello World",
      },
      {
        uu5string: `<uu5string />
          <UU5BricksSection
            header="<uu5string /><UU5BricksHeader>header</UU5BricksHeader>"
            footer="<uu5string /><UU5BricksFooter>footer</UU5BricksFooter>"
            content="<uu5string /><UU5BricksP>content</UU5BricksP>">
              children
            </UU5BricksSection>`,
        plainText: "header content footer",
      },
    ];

    tests.forEach(({ uu5string, plainText }) => expect(Uu5String.toPlainText(uu5string)).toBe(plainText));
  });

  it("toPlainText(uu5string, { allowedTagsRegExp })", () => {
    let result = Uu5String.toPlainText(`<uu5string/><div><p>a0</p>a1</div>`, { allowedTagsRegExp: /^div$/ });
    expect(result).toBe("Error: Tag <p /> is not allowed. a1");

    result = Uu5String.toPlainText(`<uu5string/><p><div>b</div></p>`, { allowedTagsRegExp: /^div$/ });
    expect(result).toBe("Error: Tag <p /> is not allowed.");

    result = Uu5String.toPlainText(`<uu5string/><p/>`, { allowedTagsRegExp: /^div$/ });
    expect(result).toBe("Error: Tag <p /> is not allowed.");

    result = Uu5String.toPlainText(`<uu5string/><div content='<uu5string/>nested <p>a</p>'/>`, {
      allowedTagsRegExp: /^div$/,
    });
    expect(result).toBe("nested Error: Tag <p /> is not allowed.");
  });

  it("should process expressions - now, idHex32, idHex64", () => {
    let builtChildren = new Uu5String("<uu5string/>${now}").toChildren();
    let text = findBuiltText(builtChildren);
    expect(text).toBe(new Date(DATE1).toISOString());

    builtChildren = new Uu5String("<uu5string/>${idHex32}").toChildren();
    text = findBuiltText(builtChildren);
    expect(typeof text).toBe("string");
    expect(text.match(/^[a-f0-9]{32}$/i)).toBeTruthy();

    builtChildren = new Uu5String("<uu5string/>${idHex64}").toChildren();
    text = findBuiltText(builtChildren);
    expect(typeof text).toBe("string");
    expect(text.match(/^[a-f0-9]{64}$/i)).toBeTruthy();
  });

  it("should skip forbidden tags and unsafe constructs", () => {
    TestUtils.omitConsoleLogs("not allowed in uu5string");
    // prettier-ignore
    let list = ["applet", "base", "body", "embed", "form", "frame", "frameset", "iframe", "head", "html", "link", "meta", "noframes", "object", "script", "template"];

    // some HTML tags are disallowed
    let result = Uu5String.toChildren(`<uu5string/>${list.map((it) => `<${it} />`).join("")}`);
    expect(result).toEqual(list.map((it) => `<${it} />`));
    result = Uu5String.toChildren(list.map((it) => ({ uu5Tag: it })));
    expect(result).toEqual(list.map((it) => `<${it} />`));

    // same but uppercased
    result = Uu5String.toChildren(`<uu5string/>${list.map((it) => `<${it.toUpperCase()} />`).join("")}`);
    expect(result).toEqual(list.map((it) => `<${it.toUpperCase()} />`));
    result = Uu5String.toChildren(list.map((it) => ({ uu5Tag: it.toUpperCase() })));
    expect(result).toEqual(list.map((it) => `<${it.toUpperCase()} />`));

    // last tag segment must not start with lower case
    result = Uu5String.toChildren(`<uu5string/><Tools.getSomething />`);
    expect(result).toEqual(["<Tools.getSomething />"]);
    result = Uu5String.toChildren([{ uu5Tag: "Tools.getSomething" }]);
    expect(result).toEqual(["<Tools.getSomething />"]);

    // dangerouslySetInnerHTML should be omitted
    result = Uu5String.toChildren(`<uu5string/><div dangerouslySetInnerHTML='<uu5json/>{"__html":"abc"}'/>`, {
      buildChildFn: null,
    });
    expect(result).toEqual([{ tag: "div", uu5Tag: "div", props: {}, children: null }]);
    result = Uu5String.toChildren(
      { uu5Tag: "div", props: { dangerouslySetInnerHTML: { __html: "abc" } } },
      { buildChildFn: null },
    );
    expect(result).toEqual([{ tag: "div", uu5Tag: "div", props: {}, children: null }]);

    // dangerouslySetInnerHTML should be omitted even via <uu5json /> in content
    result = Uu5String.toChildren(
      `<uu5string/><div><uu5json propName="dangerouslySetInnerHTML">{"__html":"abc"}</uu5json></div>`,
      { buildChildFn: null },
    );
    expect(result).toEqual([{ tag: "div", uu5Tag: "div", props: {}, children: null }]);
    result = Uu5String.toChildren(
      {
        uu5Tag: "div",
        props: {},
        children: {
          uu5Tag: "uu5json",
          props: { propName: "dangerouslySetInnerHTML" },
          children: '{ "__html": "abc" }',
        },
      },
      { buildChildFn: null },
    );
    expect(result).toEqual([{ tag: "div", uu5Tag: "div", props: {}, children: null }]);

    // UU5.Bricks.Iframe srcDoc and non-http src is disallowed
    result = Uu5String.toChildren(`<uu5string/><UU5.Bricks.Iframe srcDoc="abc" src="qwer"/>`, { buildChildFn: null });
    expect(result).toEqual([{ tag: "UU5.Bricks.Iframe", uu5Tag: "UU5.Bricks.Iframe", props: {}, children: null }]);
    result = Uu5String.toChildren(`<uu5string/><UU5.Bricks.Iframe_g04v1 srcDoc="abc" src="qwer"/>`, {
      buildChildFn: null,
    });
    expect(result).toEqual([
      { tag: "UU5.Bricks.Iframe_g04v1", uu5Tag: "UU5.Bricks.Iframe_g04v1", props: {}, children: null },
    ]);
    result = Uu5String.toChildren(
      {
        uu5Tag: "UU5.Bricks.Iframe",
        props: { srcDoc: "abc", src: "qwer" },
      },
      { buildChildFn: null },
    );
    expect(result).toEqual([{ tag: "UU5.Bricks.Iframe", uu5Tag: "UU5.Bricks.Iframe", props: {}, children: null }]);
    result = Uu5String.toChildren(
      `<uu5string/><UU5.Bricks.Iframe><uu5json propName='srcDoc'>"abc"</uu5json><uu5json propName='src'>"qwer"</uu5json></UU5.Bricks.Iframe>`,
      { buildChildFn: null },
    );
    expect(result).toEqual([{ tag: "UU5.Bricks.Iframe", uu5Tag: "UU5.Bricks.Iframe", props: {}, children: null }]);
    result = Uu5String.toChildren(`<uu5string/><UU5.Bricks.Iframe src="https://example.com"/>`, { buildChildFn: null });
    expect(result).toEqual([
      {
        tag: "UU5.Bricks.Iframe",
        uu5Tag: "UU5.Bricks.Iframe",
        props: { src: "https://example.com" },
        children: null,
      },
    ]);
    result = Uu5String.toChildren(
      `<uu5string/><UU5.Bricks.Iframe><uu5json propName='src'>"https://example.com"</uu5json></UU5.Bricks.Iframe>`,
      { buildChildFn: null },
    );
    expect(result).toEqual([
      {
        tag: "UU5.Bricks.Iframe",
        uu5Tag: "UU5.Bricks.Iframe",
        props: { src: "https://example.com" },
        children: null,
      },
    ]);

    // Plus4U5.Bricks.Iframe src with "<" or leading to untrusted domain (when in browser) is disallowed
    result = Uu5String.toChildren(`<uu5string/><Plus4U5.Bricks.Iframe src="qwer<script>"/>`, { buildChildFn: null });
    expect(result).toEqual([
      {
        tag: "Plus4U5.Bricks.Iframe",
        uu5Tag: "Plus4U5.Bricks.Iframe",
        props: {},
        children: null,
      },
    ]);
    result = Uu5String.toChildren(`<uu5string/><Plus4U5.Bricks.Iframe_g01v4 src="qwer<script>"/>`, {
      buildChildFn: null,
    });
    expect(result).toEqual([
      {
        tag: "Plus4U5.Bricks.Iframe_g01v4",
        uu5Tag: "Plus4U5.Bricks.Iframe_g01v4",
        props: {},
        children: null,
      },
    ]);
    result = Uu5String.toChildren(
      {
        uu5Tag: "Plus4U5.Bricks.Iframe",
        props: { src: "qwer<script>" },
      },
      { buildChildFn: null },
    );
    expect(result).toEqual([
      {
        tag: "Plus4U5.Bricks.Iframe",
        uu5Tag: "Plus4U5.Bricks.Iframe",
        props: {},
        children: null,
      },
    ]);

    if (typeof location !== "undefined") {
      history.replaceState(null, "", "http://localhost/vnd-app/awid/uve");
      window.UU5 = {
        Environment: {
          trustedDomainRegexp:
            "^https://([a-z][a-z0-9\\-]{0,61}[a-z0-9][.]|[a-z][.])?plus4u[.]net(:[0-9]+)?(?=[/#?]|$)",
        },
      };
      result = Uu5String.toChildren(`<uu5string/><Plus4U5.Bricks.Iframe src="http://example.com/abc"/>`, {
        buildChildFn: null,
      });
      expect(result).toEqual([
        {
          tag: "Plus4U5.Bricks.Iframe",
          uu5Tag: "Plus4U5.Bricks.Iframe",
          props: {},
          children: null,
        },
      ]);
      result = Uu5String.toChildren(`<uu5string/><Plus4U5.Bricks.Iframe src="http://localhost/abc"/>`, {
        buildChildFn: null,
      });
      expect(result).toEqual([
        {
          tag: "Plus4U5.Bricks.Iframe",
          uu5Tag: "Plus4U5.Bricks.Iframe",
          props: { src: "http://localhost/abc" },
          children: null,
        },
      ]);
      result = Uu5String.toChildren(`<uu5string/><Plus4U5.Bricks.Iframe src="https://plus4u.net/abc"/>`, {
        buildChildFn: null,
      });
      expect(result).toEqual([
        {
          tag: "Plus4U5.Bricks.Iframe",
          uu5Tag: "Plus4U5.Bricks.Iframe",
          props: { src: "https://plus4u.net/abc" },
          children: null,
        },
      ]);
    } else {
      result = Uu5String.toChildren(`<uu5string/><Plus4U5.Bricks.Iframe src="https://example.com"/>`, {
        buildChildFn: null,
      });
      expect(result).toEqual([
        {
          tag: "Plus4U5.Bricks.Iframe",
          uu5Tag: "Plus4U5.Bricks.Iframe",
          props: { src: "https://example.com" },
          children: null,
        },
      ]);
    }
  });

  it("should handle prop 'children' similarly as prop 'content' but prefer saving as nested children", () => {
    let result;

    // string
    result = Uu5String.toChildren(`<uu5string/><a children="link" href="h" />`, { buildChildFn: null });
    expect(result).toEqual([{ tag: "a", uu5Tag: "a", props: { href: "h" }, children: ["link"] }]);
    result = Uu5String.toString(`<uu5string/><a children="link" href="h" />`);
    expect(result).toEqual(`<a href="h">link</a>`);
    result = Uu5String.toPlainText(`<uu5string/><a children="link" href="h" />`);
    expect(result).toEqual(`link`);

    // should handle props.children as any other prop if not using self-closing tag
    result = Uu5String.toString(`<uu5string/><a children="link" href="h">direct</a>`);
    expect(result).toEqual(`<a children="link" href="h">direct</a>`);

    // should properly escape content
    result = Uu5String.toString(`<uu5string/><a children="<b>should not be bold</b>" href="h" />`);
    expect(result).toEqual(`<a href="h">&lt;b&gt;should not be bold&lt;/b&gt;</a>`);
    result = Uu5String.toString(`<uu5string/><a children="<uu5string/><b>should be bold</b>" href="h" />`);
    expect(result).toEqual(`<a href="h"><b>should be bold</b></a>`);

    // uu5string
    result = Uu5String.toChildren(`<uu5string/><a children="<uu5string/><b>link</b>" href="h" />`, {
      buildChildFn: null,
    });
    expect(result).toEqual([
      {
        tag: "a",
        uu5Tag: "a",
        props: { href: "h" },
        children: [{ tag: "b", uu5Tag: "b", props: {}, children: ["link"] }],
      },
    ]);
    result = Uu5String.toString(`<uu5string/><a children="<uu5string/><b>link</b>" href="h" />`);
    expect(result).toEqual(`<a href="h"><b>link</b></a>`);
    result = Uu5String.toPlainText(`<uu5string/><a children="<uu5string/><b>link</b>" href="h" />`);
    expect(result).toEqual(`link`);
  });

  it("should detect basic mistake with unescaped quotes in an attribute value", () => {
    function swapQuotes(text) {
      return text.replace(/"/g, "QQ").replace(/'/g, '"').replace(/QQ/g, "'");
    }
    function expectError(uu5string, expectedUu5Tag, expectedIndex) {
      _expectError(...arguments);
      _expectError(swapQuotes(uu5string), ...[...arguments].slice(1));
    }
    function _expectError(uu5string, expectedUu5Tag, expectedIndex) {
      let error;
      try {
        new Uu5String(uu5string);
      } catch (e) {
        error = e ?? null;
      }
      if (error === undefined) throw new Error("Expected to throw for uu5string: " + uu5string);
      expect(error).toMatchObject({
        message: expect.stringContaining("Detected unescaped quote"),
        code: "uu5StringInvalid",
        context: expect.objectContaining({ uu5string, uu5Tag: expectedUu5Tag, index: expectedIndex }),
      });
    }
    function expectNoError(uu5string) {
      _expectNoError(...arguments);
      _expectNoError(swapQuotes(uu5string), ...[...arguments].slice(1));
    }
    function _expectNoError(uu5string) {
      expect(() => {
        new Uu5String(uu5string);
      }).not.toThrow();
    }

    expectError(`<uu5string/><Component activityName="Request - "Please"" />`, "Component", 47);
    expectError(`<uu5string/><Component activityName="Request - "Please"" />`, "Component", 47);
    expectError(`<uu5string/><Component activityName = "Request - "Please"" />`, "Component", 49);
    expectError(`<uu5string/><Test foo="\\"quoted\\"" activityName="Request - "Please"">child</Test>`, "Test", 59);

    expectNoError(`<uu5string/><Component foo="\\"quoted\\"" bar='"quoted2"' />`);
    expectNoError(`<uu5string/><Component prefix="" b="b" c="c" />`);
    expectNoError(`<uu5string/><Component prefix="a=" b="b" c="c" />`);
    expectNoError(`<uu5string/><Component prefix="a=" b="b" c d="d" />`);
    expectNoError(`<uu5string/><Component a="a">Quoted sentence: "Hello, world!"</Component>`);
    expectNoError(`<uu5string/><Component activityName='Request - "Please"' />`);
    expectNoError(`<uu5string/><Component content='<B activityName="Request - "Please"" />' />`); // content is plain text (no <uu5string/>) => shouldn't throw
    expectNoError(`<uu5string/><uu5string.pre><Component activityName="Request - "Please"" /></uu5string.pre>`);
  });

  // skipped as there is no possibility to adjust the constant from outside
  it.skip("should relocate long uu5string/uu5json props into children", () => {
    Constants.UU5STRING_LENGTH_LIMIT = 20;
    let uu5StringStr =
      `<uu5string/><Comp header='<uu5string/><b id="bold" normal="<uu5string/>within20" normalJson=\\'<uu5json/>"within"\\'>` +
      `Bold</b><Nested footer=\\'<uu5string/><i id="italic">Italic</i>\\' json=\\'<uu5json/>{"foo":"bar","bool":false}\\'>nested children</Nested>'>comp children</Comp>`;
    let asObject = Uu5String.toObject(uu5StringStr);
    expect(asObject).toEqual([
      {
        uu5Tag: "Comp",
        props: {},
        children: [
          {
            uu5Tag: "uu5string",
            props: { propName: "header" },
            children: [
              {
                uu5Tag: "b",
                props: { id: "bold", normal: "<uu5string/>within20", normalJson: '<uu5json/>"within"' }, // short uu5strings/uu5jsons
                children: ["Bold"],
              },
              {
                uu5Tag: "Nested",
                props: {},
                children: [
                  // long uu5strings/uu5jsons
                  {
                    uu5Tag: "uu5json",
                    props: { propName: "json" },
                    children: ['{\n  "foo": "bar",\n  "bool": false\n}'],
                  },
                  {
                    uu5Tag: "uu5string",
                    props: { propName: "footer" },
                    children: [{ uu5Tag: "i", props: { id: "italic" }, children: ["Italic"] }],
                  },
                  "nested children",
                ],
              },
            ],
          },
          "comp children",
        ],
      },
    ]);
    expect(new Uu5String(asObject).toChildren({ buildChildFn: null })).toEqual(
      new Uu5String(uu5StringStr).toChildren({ buildChildFn: null }),
    );

    let asString = Uu5String.toString(uu5StringStr);
    expect(asString).toEqual(
      '<Comp><uu5string propName="header"><b id="bold" normal="<uu5string/>within20" normalJson=\'<uu5json/>"within"\'>Bold</b><Nested><uu5string propName="footer"><i id="italic">Italic</i></uu5string><uu5json propName="json">{\n  "foo": "bar",\n  "bool": false\n}</uu5json>nested children</Nested></uu5string>comp children</Comp>',
    );
    expect(new Uu5String("<uu5string/>" + asString).toChildren({ buildChildFn: null })).toEqual(
      new Uu5String(uu5StringStr).toChildren({ buildChildFn: null }),
    );

    // json containing "</uu5json>" should not break the relocation
    uu5StringStr = `<uu5string/><Comp jsonValue='<uu5json/>{"foo":"bar with </uu5json>"}' />`;
    asObject = Uu5String.toObject(uu5StringStr);
    expect(new Uu5String(asObject).toChildren({ buildChildFn: null })).toEqual(
      new Uu5String(uu5StringStr).toChildren({ buildChildFn: null }),
    );
    expect(asObject).toEqual([
      {
        children: [
          {
            children: ['{\n  "foo": "bar with \\u003c/uu5json>"\n}'],
            props: { propName: "jsonValue" },
            uu5Tag: "uu5json",
          },
        ],
        props: {},
        uu5Tag: "Comp",
      },
    ]);

    asString = Uu5String.toString(uu5StringStr);
    expect(asString).toEqual(
      `<Comp><uu5json propName="jsonValue">{\n  "foo": "bar with \\u003c/uu5json>"\n}</uu5json></Comp>`,
    );
    expect(new Uu5String("<uu5string/>" + asString).toChildren({ buildChildFn: null })).toEqual(
      new Uu5String(uu5StringStr).toChildren({ buildChildFn: null }),
    );
  });
});
