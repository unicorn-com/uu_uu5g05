import { Fragment, Utils } from "uu5g05";
import { useComponentPaste } from "uu5g05-elements";
import { Test } from "uu5g05-test";

const HORIZONTAL_BORDER = 4;
const VERTICAL_BORDER = 8;

function renderHookInElement(width = 100, height = 200, ...initialHookParams) {
  let defineSizes = (el) => {
    if (el) {
      Object.defineProperties(el, {
        clientWidth: { get: () => width - HORIZONTAL_BORDER, configurable: true },
        clientHeight: { get: () => height - VERTICAL_BORDER, configurable: true },
        getBoundingClientRect: {
          get: () => () => ({ width, height, left: 0, top: 0, right: width, bottom: height }),
          configurable: true,
        },
      });
    }
  };
  let allResults = [];
  let { HookComponent, ...renderResult } = Test.createHookComponent((props) => useComponentPaste(...props), {
    initialProps: initialHookParams,
  });
  let { rerender } = Test.render(<div ref={defineSizes} />);
  rerender(
    <div ref={defineSizes}>
      <HookComponent>
        {(hookResult) => {
          allResults.push(hookResult);
          return (
            <>
              <div data-testid="copy">test</div>
              <div onPaste={hookResult.handlePaste} contentEditable data-testid="paste"></div>
              {hookResult.dialog}
            </>
          );
        }}
      </HookComponent>
    </div>,
  );
  return { ...renderResult, allResults: () => [...allResults], renderCount: () => allResults.length };
}
async function paste(toPaste) {
  const pasteElement = Test.screen.getByTestId("paste");
  const copyElement = Test.screen.getByTestId("copy");
  getSelection().selectAllChildren(copyElement);
  let clipboardData = await Test.userEvent.copy();
  let copyEvent = new CustomEvent("copy");
  copyEvent.clipboardData = clipboardData;

  Utils.Clipboard.write(toPaste, copyEvent);

  await Test.userEvent.click(pasteElement);
  await Test.userEvent.paste(clipboardData);
}

describe("Uu5Elements.useComponentPaste", () => {
  it("should return expected result API", async () => {
    const dataToPaste = {
      html: "https://unicorn.com/en/",
      json: { testOne: 1, testTwo: 2 },
      text: "abc",
      uu5String: "<b>bold</b>",
    };
    let { result } = renderHookInElement();

    await paste(dataToPaste);

    expect(result.current?.data).toEqual(dataToPaste);
  });

  it("should return expected result API", async () => {
    const dataToPaste = {
      uu5Component: [
        {
          name: "Standard copy",
          desc: "Standard copy of the Component.",
          data: {
            uu5Tag: "Uu5Demo.Component",
            props: { id: "1" },
          },
        },
        {
          name: "New component",
          desc: "New instance of the Component.",
          data: {
            uu5Tag: "Uu5Demo.Component",
            props: { id: "2" },
          },
        },
        {
          name: "Link",
          desc: "Link to the Component.",
          data: {
            uu5Tag: "Uu5Demo.Component",
            props: { id: "3", nestingLevel: "inline" },
            children: ["Inline component ", "<i>cursive</i>"],
          },
        },
      ],
    };
    let { result } = renderHookInElement();

    await paste(dataToPaste);
    expect(Test.screen.getByRole("button", { name: "Standard copy" })).toBeInTheDocument();
    expect(Test.screen.getByRole("button", { name: "New component" })).toBeInTheDocument();
    expect(Test.screen.getByRole("button", { name: "Link" })).toBeInTheDocument();

    await Test.userEvent.click(Test.screen.getByRole("button", { name: "Standard copy" }));

    expect(result.current?.data).toEqual({
      text: "test",
      uu5String: '<Uu5Demo.Component id="1"/>',
      uu5Component: { uu5Tag: "Uu5Demo.Component", props: expect.any(Object) },
    });

    await paste(dataToPaste);
    await Test.userEvent.click(Test.screen.getByRole("button", { name: "New component" }));

    expect(result.current?.data).toEqual({
      text: "test",
      uu5String: '<Uu5Demo.Component id="2"/>',
      uu5Component: { uu5Tag: "Uu5Demo.Component", props: expect.any(Object) },
    });

    await paste(dataToPaste);
    await Test.userEvent.click(Test.screen.getByRole("button", { name: "Link" }));

    expect(result.current?.data).toEqual({
      text: "test",
      uu5String: '<Uu5Demo.Component id="3" nestingLevel="inline">Inline component <i>cursive</i></Uu5Demo.Component>',
      uu5Component: { uu5Tag: "Uu5Demo.Component", props: expect.any(Object), children: expect.any(Array) },
    });
  });
});
