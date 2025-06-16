import { useState } from "uu5g05";
import { AlertBus, Alert } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

let Component = () => {
  let [open, setOpen] = useState(true);

  return (
    <AlertBus>
      {open && (
        <Alert
          header="alert 1"
          onClose={(e) => {
            setOpen(false);
          }}
        />
      )}
      <Alert header="alert 2" />
    </AlertBus>
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

describe("Uu5Elements.AlertBus", () => {
  it("checks AlertBus works properly", async () => {
    const { user } = await setup();

    expect(Test.screen.getByRole("status", { name: "alert 1" })).toBeInTheDocument();
    expect(Test.screen.getByRole("status", { name: "alert 2" })).toBeInTheDocument();

    await user.click(Test.screen.getByRole("button", { name: "Close all" }));

    expect(Test.screen.queryByRole("status", { name: "alert 1" })).not.toBeInTheDocument();
    expect(Test.screen.getByRole("status", { name: "alert 2" })).toBeInTheDocument();
  });
});
