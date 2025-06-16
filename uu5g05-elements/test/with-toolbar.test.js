import { Utils as Uu5Utils, ToolbarProvider, createVisualComponent, useToolbar } from "uu5g05";
import { Toolbar, withToolbar } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

const TestComponent = withToolbar(
  createVisualComponent({
    uu5Tag: "TestComponent",
    render(props) {
      const { renderLeft, renderRight } = useToolbar();
      return (
        <div {...Uu5Utils.VisualComponent.getAttrs(props)}>
          {renderLeft("left")}
          {renderRight("right")}
          aabbcc
        </div>
      );
    },
  }),
);

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(TestComponent, { ...getDefaultProps(), ...props }, opts);
}

describe(`Uu5Elements.withToolbar`, () => {
  it(`should render own Toolbar.Content if there is no ToolbarProvider`, async () => {
    await setup();
    expect(Test.screen.getByText("left")).toBeInTheDocument();
    expect(Test.screen.getByText("right")).toBeInTheDocument();
  });

  it(`should render own Toolbar.Content if there is no Toolbar`, async () => {
    await setup();
    expect(Test.screen.getByText("left")).toBeInTheDocument();
    expect(Test.screen.getByText("right")).toBeInTheDocument();
  });

  it(`should use existing Toolbar`, async () => {
    const toolbarRef = Uu5Utils.Component.createRef();
    await setup(undefined, {
      Wrapper: ({ children }) => (
        <ToolbarProvider>
          <Toolbar elementRef={toolbarRef} />
          {children}
        </ToolbarProvider>
      ),
    });
    expect(Test.within(toolbarRef.current).getByText("left")).toBeInTheDocument();
    expect(Test.within(toolbarRef.current).getByText("right")).toBeInTheDocument();
  });
});
