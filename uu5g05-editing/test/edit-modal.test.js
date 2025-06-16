import Uu5Editing from "uu5g05-editing";
// import Uu5Elements from "uu5g05-elements";
import { testProperties, shallow } from "uu5g05-test";

const CONFIG = {
  props: {
    props: {
      colorScheme: "primary",
      significance: "highlighted",
      nestingLevel: "area",
      card: "full",
      borderRadius: "moderate",
    },
    defaultProps: {
      card: "none",
    },
  },
  requiredProps: {
    open: true,
    uu5Tag: "Block",
    props: {
      colorScheme: "primary",
      significance: "highlighted",
      nestingLevel: "area",
      card: "full",
      borderRadius: "moderate",
    },
    onClose: jest.fn((e) => e?.persist?.()),
    onSave: jest.fn((e) => e?.persist?.()),
  },
  opt: {},
};

describe(`Uu5Editing.EditModal`, () => {
  testProperties(Uu5Editing.EditModal, CONFIG);

  it("onClose - should call onClose function", () => {
    let onClose = jest.fn((e) => e?.persist?.());
    let onSave = jest.fn((e) => e?.persist?.());

    let wrapper = shallow(
      <Uu5Editing.EditModal
        open={true}
        uu5Tag={"Block"}
        onClose={onClose}
        onSave={onSave}
        props={{
          colorScheme: "primary",
          significance: "highlighted",
          nestingLevel: "area",
          card: "full",
          borderRadius: "moderate",
        }}
        tabList={["visual"]}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
