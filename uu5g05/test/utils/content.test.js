import { Utils, Environment, createVisualComponent } from "uu5g05";

const TestComponent = createVisualComponent({
  uu5Tag: "Test.Component",
  render: (props) => null,
});
const ParentComponent = createVisualComponent({
  uu5Tag: "Test.ParentComponent",
  nestingLevel: ["box", "inline"],
  render: (props) => null, // (props) => build(props.children, props, ParentComponent)
});

describe("[uu5g05] Utils.Content", () => {
  it("build(children, { parent, nestingLevel }, statics); should pass parent and correct nestingLevel props", async () => {
    let parent = 111;
    let nestingLevel = "box";
    let expectedChildNestingLevel = "spotCollection";
    let bothProps = { parent, nestingLevel };
    let expectedBothProps = { parent, nestingLevel: expectedChildNestingLevel };
    let noProps = {};
    let expectedNoProps = { parent: undefined, nestingLevel: expectedChildNestingLevel };
    let expectedNotAppliedProps = { parent: undefined, nestingLevel: undefined };

    function expectProps(jsxEl, expectedProps) {
      expect(jsxEl).toBeTruthy();
      for (let prop in expectedProps) {
        if (prop === "children") {
          expectPropsArray(Utils.Content.toArray(jsxEl.props?.children), expectedProps[prop]);
        } else {
          expect(jsxEl.props?.[prop]).toEqual(expectedProps[prop]);
        }
      }
    }
    function expectPropsArray(jsxElArray, expectedPropsArray) {
      expect(Array.isArray(jsxElArray)).toBe(true);
      for (let i = 0; i < jsxElArray.length; i++) expectProps(jsxElArray[i], expectedPropsArray[i]);
    }

    // element
    expectProps(Utils.Content.build(<div />, bothProps, ParentComponent), expectedNotAppliedProps);
    expectProps(Utils.Content.build(<div />, noProps, ParentComponent), expectedNotAppliedProps);

    // single component
    expectProps(Utils.Content.build(<TestComponent />, bothProps, ParentComponent), expectedBothProps);
    expectProps(Utils.Content.build(<TestComponent />, noProps, ParentComponent), expectedNoProps);
    expectProps(Utils.Content.build(<TestComponent parent={222} />, bothProps, ParentComponent), {
      ...expectedBothProps,
      parent: 222,
    });
    expectProps(Utils.Content.build(<TestComponent parent={222} nestingLevel="box" />, bothProps, ParentComponent), {
      ...expectedBothProps,
      parent: 222,
      nestingLevel: "box",
    });
    expectProps(Utils.Content.build(<TestComponent parent={222} />, noProps, ParentComponent), {
      ...expectedNoProps,
      parent: 222,
    });

    // array
    expectPropsArray(
      Utils.Content.build(
        [
          <TestComponent key="1" />,
          <div key="2" />,
          <TestComponent key="1" parent={222} />,
          <TestComponent key="1" parent={222} nestingLevel="box" />,
          <div key="5">
            <TestComponent />
          </div>,
        ],
        bothProps,
        ParentComponent,
      ),
      [
        expectedBothProps,
        expectedNotAppliedProps,
        { ...expectedBothProps, parent: 222 },
        { ...expectedBothProps, parent: 222, nestingLevel: "box" },
        { ...expectedNotAppliedProps, children: [expectedBothProps] }, // nestingLevel / ... should traverse deeply through HTML elements
      ],
    );
    expectPropsArray(
      Utils.Content.build(
        [
          <TestComponent key="1" parent={222} />,
          <div key="2" />,
          <div key="3">
            <TestComponent />
          </div>,
        ],
        noProps,
        ParentComponent,
      ),
      [
        { ...expectedNoProps, parent: 222 },
        expectedNotAppliedProps,
        { ...expectedNotAppliedProps, children: [expectedNoProps] }, // nestingLevel / ... should traverse deeply through HTML elements
      ],
    );

    // uu5string
    Utils.LibraryRegistry.registerComponent(TestComponent);
    expectPropsArray(
      Utils.Content.build(
        "<uu5string/><Test.Component/><div/><Test.Component parent=222/><Test.Component parent=222 nestingLevel='box'/><div><Test.Component /></div>",
        bothProps,
        ParentComponent,
      ),
      [
        expectedBothProps,
        expectedNotAppliedProps,
        { ...expectedBothProps, parent: 222 },
        { ...expectedBothProps, parent: 222, nestingLevel: "box" },
        { ...expectedNotAppliedProps, children: [expectedBothProps] }, // nestingLevel / ... should traverse deeply through HTML elements
      ],
    );
    expectPropsArray(
      Utils.Content.build(
        "<uu5string/><Test.Component/><div/><Test.Component parent=222/><Test.Component parent=222 nestingLevel='box'/><div><Test.Component /></div>",
        noProps,
        ParentComponent,
      ),
      [
        expectedNoProps,
        expectedNotAppliedProps,
        { ...expectedBothProps, parent: 222 },
        { ...expectedBothProps, parent: 222, nestingLevel: "box" },
        { ...expectedNotAppliedProps, children: [expectedNoProps] },
      ],
    );
    expectPropsArray(
      Utils.Content.build(
        "<uu5string/><Unknown.Component/><Unknown.Component parent=222 nestingLevel='box'/>",
        bothProps,
        ParentComponent,
      ),
      [expectedBothProps, { ...expectedBothProps, parent: 222, nestingLevel: "box" }],
    );

    // uu5json
    expectPropsArray(
      Utils.Content.build(
        `<uu5json/>"<uu5string/><Test.Component/><div/><Test.Component parent=222/><Test.Component parent=222 nestingLevel='box'/>"`,
        bothProps,
        ParentComponent,
      ),
      [
        expectedBothProps,
        expectedNotAppliedProps,
        { ...expectedBothProps, parent: 222 },
        { ...expectedBothProps, parent: 222, nestingLevel: "box" },
      ],
    );

    // uu5data
    Environment.uu5DataMap["testKey"] =
      "<uu5string/><Test.Component/><div/><Test.Component parent=222/><Test.Component parent=222 nestingLevel='box'/>";
    expectPropsArray(Utils.Content.build("<uu5data/>testKey", bothProps, ParentComponent), [
      expectedBothProps,
      expectedNotAppliedProps,
      { ...expectedBothProps, parent: 222 },
      { ...expectedBothProps, parent: 222, nestingLevel: "box" },
    ]);

    // function
    let mockFn = jest.fn();
    Utils.Content.build(mockFn, bothProps, ParentComponent);
    expect(mockFn).toBeCalledTimes(1);
    expect(mockFn).lastCalledWith(expectedBothProps);
    mockFn.mockClear();
    Utils.Content.build(mockFn, noProps, ParentComponent);
    expect(mockFn).toBeCalledTimes(1);
    expect(mockFn).lastCalledWith(expectedNoProps);
    mockFn.mockClear();

    // object - { tag, props }
    expectProps(Utils.Content.build({ tag: TestComponent }, bothProps, ParentComponent), expectedBothProps);
    expectProps(Utils.Content.build({ tag: TestComponent }, noProps, ParentComponent), expectedNoProps);
    expectProps(Utils.Content.build({ tag: TestComponent, props: { parent: 222 } }, bothProps, ParentComponent), {
      ...expectedBothProps,
      parent: 222,
    });
    expectProps(
      Utils.Content.build(
        { tag: TestComponent, props: { parent: 222, nestingLevel: "box" } },
        bothProps,
        ParentComponent,
      ),
      { ...expectedBothProps, parent: 222, nestingLevel: "box" },
    );
    expectProps(Utils.Content.build({ tag: TestComponent, props: { parent: 222 } }, noProps, ParentComponent), {
      ...expectedNoProps,
      parent: 222,
    });

    // object - { tag, propsArray }
    expectPropsArray(Utils.Content.build({ tag: TestComponent, propsArray: [{}] }, bothProps, ParentComponent), [
      expectedBothProps,
    ]);
    expectPropsArray(Utils.Content.build({ tag: TestComponent, propsArray: [{}] }, noProps, ParentComponent), [
      expectedNoProps,
    ]);
    expectPropsArray(
      Utils.Content.build({ tag: TestComponent, propsArray: [{ parent: 222 }] }, bothProps, ParentComponent),
      [{ ...expectedBothProps, parent: 222 }],
    );
    expectPropsArray(
      Utils.Content.build(
        { tag: TestComponent, propsArray: [{ parent: 222, nestingLevel: "box" }] },
        bothProps,
        ParentComponent,
      ),
      [{ ...expectedBothProps, parent: 222, nestingLevel: "box" }],
    );
    expectPropsArray(
      Utils.Content.build({ tag: TestComponent, propsArray: [{ parent: 222 }] }, noProps, ParentComponent),
      [{ ...expectedNoProps, parent: 222 }],
    );
  });
});
