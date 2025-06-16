import { DeviceProvider, useState } from "uu5g05";
import { ModalBus, Modal } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

let Component = () => {
  let [modal2Open, setModal2Open] = useState(true);
  let [modal3Open, setModal3Open] = useState(true);
  let [modal4Open, setModal4Open] = useState(true);

  return (
    <ModalBus lsi={{ modalList: { en: "List" } }}>
      <Modal open testId="modal-1">
        test 1
      </Modal>
      <Modal open={modal2Open} testId="modal-2" onClose={() => setModal2Open(false)}>
        test 2
      </Modal>
      <Modal open={modal3Open} testId="modal-3" onClose={() => setModal3Open(false)}>
        test 3
      </Modal>
      <Modal open={modal4Open} testId="modal-4" onClose={() => setModal4Open(false)}>
        test 4
      </Modal>
    </ModalBus>
  );
};

async function setup(props = {}, opts) {
  return VisualComponent.setup(
    ({ testId, ...props }) => {
      return (
        <div data-testid={testId}>
          <Component {...props} />
        </div>
      );
    },
    { ...getDefaultProps(), ...props },
    opts,
  );
}

describe("Uu5Elements.ModalBus", () => {
  it("checks skipModalBus property properly works", async () => {
    await setup({ skipModalBus: true });

    const modal1 = Test.screen.getByTestId("modal-1");
    const modal2 = Test.screen.getByTestId("modal-2");

    expect(modal1 === modal2).toBe(false);
  });

  it("checks modals are stacked properly", async () => {
    await setup();

    const modal1 = Test.screen.getByTestId("modal-1");
    const modal2 = Test.screen.getByTestId("modal-2");
    const modal3 = Test.screen.getByTestId("modal-3");
    const modal4 = Test.screen.getByTestId("modal-4");

    expect(modal4).toHaveAttribute("aria-modal", "true");
    expect(modal3).toHaveAttribute("aria-modal", "false");
    expect(modal2).toHaveAttribute("aria-modal", "false");
    expect(modal1).toHaveAttribute("aria-modal", "false");
  });

  it("checks onClose is properly called", async () => {
    const { element } = await setup();

    const modal3 = Test.screen.getByTestId("modal-3");
    const modal4 = Test.screen.queryByTestId("modal-4");

    expect(Test.screen.getByTestId("modal-4")).toBeInTheDocument();
    expect(modal3).toHaveAttribute("aria-modal", "false");

    Test.fireEvent.keyDown(element, { key: "Escape", code: "Escape" });

    expect(modal4).not.toBeInTheDocument();
    expect(modal3).toBeInTheDocument();
    expect(modal3).toHaveAttribute("aria-modal", "true");
  });

  it("checks bottomSheet is properly shown", async () => {
    const Wrapper = ({ children }) => (
      <DeviceProvider platform="ios" isMobileOrTablet>
        {children}
      </DeviceProvider>
    );
    await setup({ Wrapper });
    const modal2 = Test.screen.getByTestId("modal-2");
    const elementStyle = window.getComputedStyle(modal2.parentElement);

    expect(elementStyle.getPropertyValue("position")).toBe("fixed");
    expect(elementStyle.getPropertyValue("margin")).toBe("0px");
  });

  it("checks lsi property properly overrides default content", async () => {
    await setup();

    expect(Test.screen.getAllByTitle("List")[3]).toBeVisible();
  });
});
