import { Test, VisualComponent } from "uu5g05-test";
import SpeechButton from "../src/speech-button.js";

function getDefaultProps() {
  return {
    children: "Test content",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(SpeechButton, { ...getDefaultProps(), ...props }, opts);
}

(SpeechButton.isEnabled ? describe : describe.skip)("Uu5Elements.SpeechButton", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    await setup();

    expect(Test.screen.getByText("Test content")).toBeInTheDocument();
  });
});
