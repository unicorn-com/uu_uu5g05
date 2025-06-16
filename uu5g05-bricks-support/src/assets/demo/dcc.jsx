import { useState, Content } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import UuDcc from "uu_dynamiccomponentcontentg02";

function UuDccSection({ uu5String }) {
  const [editable, setEditable] = useState(true);
  const [data, setData] = useState(uu5String);

  return (
    <>
      <div style={{ textAlign: "right" }}>
        <Uu5Elements.Button
          colorScheme={editable ? "positive" : undefined}
          onClick={() => setEditable(!editable)}
        >
          {editable ? "Stop editing" : "Edit"}
        </Uu5Elements.Button>
      </div>
      {editable ? (
        <UuDcc.Bricks.SectionInput
          style={{ fontSize: "inherit" }} // because UuDcc uses uu5-form-input-m class which changes font-size
          value={data}
          onChange={({ value }) => setData(value)}
        />
      ) : (
        <Content>{data}</Content>
      )}
    </>
  );
}

export { UuDccSection };
