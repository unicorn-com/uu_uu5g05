import { useState } from "uu5g05";
import { ModalBus, Modal } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";
import RestoreButton from "../src/modal-bus-restore-button.js";

function getDefaultProps() {
  return {};
}

let Component = () => {
  let [modal2Open, setModal2Open] = useState(true);

  return (
    <ModalBus>
      <Modal id="modal1" open testId="modal-1">
        test 1
      </Modal>
      <Modal open={modal2Open} testId="modal-2" onClose={() => setModal2Open(false)}>
        <RestoreButton modalId="modal1">Click</RestoreButton>
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
  it("checks RestoreButton properly works", async () => {
    const { user } = await setup();

    const modal1 = Test.screen.getByTestId("modal-1");
    const modal2 = Test.screen.queryByTestId("modal-2");

    expect(modal1).toHaveAttribute("aria-modal", "false");
    expect(Test.screen.getByTestId("modal-2")).toBeInTheDocument();

    await user.click(Test.screen.getByRole("button", { name: "Click" }));
    await user.click(Test.screen.getByRole("button", { name: "Close Windows" }));

    expect(modal2).not.toBeInTheDocument();
    expect(modal1).toHaveAttribute("aria-modal", "true");
  });
});
