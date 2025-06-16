import { useLanguage, Utils } from "uu5g05";
import FormatInput from "../abstract/format-input";
import TimeValue from "./time-value";

const Input = Utils.Component.forwardRef(
  ({ date, timeZone, format, hideSummerPrefix, hideWinterPrefix, ...props }, ref) => {
    if (!format) {
      format = !new Intl.DateTimeFormat([], { hour: "numeric" }).format(0).match(/\s/) ? "HH:mm" : "h:mm aa";
      if (props.step < 60) format = format.replace("mm", "mm:ss");
    }

    const [language] = useLanguage();

    return (
      <FormatInput
        {...props}
        format={format}
        ref={ref}
        FormatValue={TimeValue}
        clipboardKey="time"
        lang={language}
        valueProps={{ date, timeZone }}
        formatValueProps={{ hideSummerPrefix, hideWinterPrefix }}
      />
    );
  },
);

export { Input };
export default Input;
