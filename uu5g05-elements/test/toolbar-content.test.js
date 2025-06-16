import { Test, VisualComponent } from "uu5g05-test";
import { ToolbarProvider, useState, useToolbar } from "uu5g05";
import Uu5Elements from "uu5g05-elements";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(
    Uu5Elements.Toolbar,
    { ...getDefaultProps(), ...props },
    {
      Wrapper: ({ children }) => (
        <ToolbarProvider>
          {children}
          <ToolbarLeftContent>Left content</ToolbarLeftContent>
          <ToolbarRightContent>Right content</ToolbarRightContent>
        </ToolbarProvider>
      ),
      ...opts,
    },
  );
}

const ToolbarLeftContent = (props) => {
  let { renderLeft } = useToolbar();
  return props.children !== null ? renderLeft(<div>{props.children}</div>) : null;
};
const ToolbarRightContent = (props) => {
  let { renderRight } = useToolbar();
  return props.children !== null ? renderRight(<div>{props.children}</div>) : null;
};

describe(`Uu5Elements.Toolbar.Content`, () => {
  VisualComponent.testProperties(setup);

  it("is integrated with Uu5.ToolbarProvider", async () => {
    await setup();

    expect(Test.screen.getByText("Left content")).toBeVisible();
    expect(Test.screen.getByText("Right content")).toBeVisible();
  });

  it("onVisibilityChange", async () => {
    let setLeftContent;
    const Left = (props) => {
      let [content, setContent] = useState(props.children);
      setLeftContent = setContent;
      return <ToolbarLeftContent>{content}</ToolbarLeftContent>;
    };
    let setRightContent;
    const Right = (props) => {
      let [content, setContent] = useState(props.children);
      setRightContent = setContent;
      return <ToolbarRightContent>{content}</ToolbarRightContent>;
    };

    let onVisibilityChange = jest.fn();
    await setup(
      { onVisibilityChange },
      {
        Wrapper: ({ children }) => (
          <ToolbarProvider>
            {children}
            <Left>Left content</Left>
            <Right>Right content</Right>
          </ToolbarProvider>
        ),
      },
    );

    expect(onVisibilityChange).lastCalledWith(expect.objectContaining({ data: { visible: true } }));
    onVisibilityChange.mockClear();

    Test.act(() => {
      setLeftContent("different content");
    });
    expect(onVisibilityChange).toHaveBeenCalledTimes(0); // no change
    onVisibilityChange.mockClear();

    Test.act(() => {
      setLeftContent(null);
    });
    expect(onVisibilityChange).toHaveBeenCalledTimes(0); // no change
    onVisibilityChange.mockClear();

    Test.act(() => {
      setRightContent(null);
    });
    expect(onVisibilityChange).toHaveBeenCalledTimes(1);
    expect(onVisibilityChange).lastCalledWith(expect.objectContaining({ data: { visible: false } }));
    onVisibilityChange.mockClear();

    Test.act(() => {
      setLeftContent("another content");
    });
    expect(onVisibilityChange).toHaveBeenCalledTimes(1);
    expect(onVisibilityChange).lastCalledWith(expect.objectContaining({ data: { visible: true } }));
    onVisibilityChange.mockClear();
  });
});
