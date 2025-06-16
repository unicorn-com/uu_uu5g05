import { Utils, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";

function withControlledInput(Input) {
  const Component = (props) => {
    const { value: propsValue, onChange, onBlur, onValidationStart, onValidationEnd } = props;

    const [value, setValue] = useState(propsValue);
    const [errorList, setErrorList] = useState(null);
    const [pending, setPending] = useState();

    return (
      <div data-name="tempForDemo">
        <Input
          {...props}
          value={value}
          onChange={(e) => {
            typeof onChange === "function" && onChange(e);
            setValue(e.data.value);
          }}
          onBlur={typeof onBlur === "function" ? (e) => {
            onBlur(new Utils.Event({ ...e.data, value }, e));
          } : undefined}
          onValidationStart={(e) => {
            typeof onValidationStart === "function" && onValidationStart(e);
            setPending(true);
          }}
          onValidationEnd={(e) => {
            typeof onValidationEnd === "function" && onValidationEnd(e);
            setErrorList(e.data.errorList.length ? e.data.errorList : null);
            setPending(false);
          }}
        />
        {errorList && (
          <div>
            <Uu5Elements.Text colorScheme="negative">{errorList.map(({ code }) => code).join(" ")}</Uu5Elements.Text>
          </div>
        )}
        {pending && <div>Pending...</div>}
      </div>
    );
  };
  Utils.Component.mergeStatics(Component, Input);
  return Component;
}

function withControlledFormInput(Input) {
  const Component = (props) => {
    const {
      value: propsValue,
      onChange,
      onBlur,
      onValidationStart,
      onValidationEnd,
      feedback,
      message,
      messageParams
    } = props;

    const [value, setValue] = useState(propsValue);
    const [errorList, setErrorList] = useState(null);
    const [pending, setPending] = useState();

    return (
      <Input
        {...props}
        value={value}
        feedback={errorList?.[0].feedback || feedback}
        message={errorList?.[0].message || message}
        messageParams={errorList?.[0].messageParams || messageParams}
        pending={pending}
        onChange={(e) => {
          typeof onChange === "function" && onChange(e);
          setValue(e.data.value);
        }}
        onBlur={typeof onBlur === "function" ? (e) => {
          onBlur(new Utils.Event({ ...e.data, value }, e));
        } : undefined}
        onValidationStart={(e) => {
          typeof onValidationStart === "function" && onValidationStart(e);
          setPending(true);
        }}
        onValidationEnd={(e) => {
          typeof onValidationEnd === "function" && onValidationEnd(e);
          setErrorList(e.data.errorList.length ? e.data.errorList : null);
          setPending(false);
        }}
      />
    );
  };
  Utils.Component.mergeStatics(Component, Input);
  return Component;
}

export { withControlledInput, withControlledFormInput };
