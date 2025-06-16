//@@viewOn:imports
import {
  createComponent,
  PropTypes,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useMemoObject,
  useRef,
  useState,
  Utils,
} from "uu5g05";
import withFormItem from "./with-form-item.js";
import Form from "./form.js";
import { sortErrorList } from "./_internal/tools.js";
import useFormApi from "./use-form-api.js";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
const FormConsumerHelper = createComponent({
  uu5Tag: Config.TAG + "_FormConsumerHelper",
  render(props) {
    const { onValueChange, onItemMapErrorListChange } = props;
    const { value, itemMap } = useFormApi();
    const currentValuesRef = useRef();

    useLayoutEffect(() => {
      currentValuesRef.current = { onValueChange, onItemMapErrorListChange };
    });

    useLayoutEffect(() => {
      const { onValueChange } = currentValuesRef.current;
      onValueChange(new Utils.Event({ value }));
    }, [value]);

    const errorList = useMemoObject(getErrorList(itemMap));
    useLayoutEffect(() => {
      const { onItemMapErrorListChange } = currentValuesRef.current;
      onItemMapErrorListChange(new Utils.Event({ errorList }));
    }, [errorList]);

    return null;
  },
});

function getErrorList(itemMap) {
  if (!itemMap) return [];
  let result = [];
  for (let name in itemMap) {
    let { errorList } = itemMap[name];
    for (let errorItem of errorList) {
      result.push({ ...errorItem, code: name + "." + errorItem.code });
    }
  }
  result = sortErrorList(result);
  return result;
}
//@@viewOff:helpers

function withSubformItem(Component) {
  return withFormItem(
    createComponent({
      //@@viewOn:statics
      uu5Tag: `withSubformItem(${Component.uu5Tag})`,
      //@@viewOff:statics

      //@@viewOn:propTypes
      propTypes: {
        ...Component.propTypes,
        formatValue: PropTypes.func,
        parseValue: PropTypes.func,
      },
      //@@viewOff:propTypes

      //@@viewOn:defaultProps
      defaultProps: {
        ...Component.defaultProps,
        formatValue: undefined,
        parseValue: undefined,
      },
      //@@viewOff:defaultProps

      render(props) {
        //@@viewOn:private
        let { formatValue, parseValue, children, onValidate, _onValueChange, ...otherProps } = props;
        const { name, value, onChange } = otherProps;

        // NOTE We need to synchronize errorList upwards -> useFormApi. Synchronization is needed so that if a nested input's value changes and
        // then validation is run onBlur (and is invalid), Component's onBlur might not have run (and possibly will not run because we might
        // have blurred to another input within our Component, i.e. Component itself didn't lose focus), but we do want the outer form to know that our value
        // is invalid (so that the outer form can e.g. disabled submit button).
        // NOTE Because of the useFormApi hook, this component will re-render quite a lot (whenever there's any change in main form) so most stuff
        // below is memoized, including render result.
        const { setItemState } = useFormApi();
        const isValidatingRef = useRef(false);
        const synchronizeErrorList = useCallback(
          (itemMap, errorList) => {
            if (isValidatingRef.current) return;
            setItemState(name, { errorList: errorList ?? getErrorList(itemMap) });
          },
          [name, setItemState],
        );

        const [formValue, setFormValue] = useState();
        const formDataRef = useRef();

        // eslint-disable-next-line uu5/hooks-exhaustive-deps
        let formattedValue = useMemo(() => {
          let result = value ?? {};
          if (typeof formatValue === "function") result = formatValue(value);
          return result;
        }, [formatValue, value]);
        formattedValue = useMemoObject(formattedValue, Utils.Object.deepEqual);

        useEffect(() => {
          // clear function
          const { setItemValue, value: formValue } = formDataRef.current;
          for (let key in formValue) {
            setItemValue(key, formattedValue?.[key]);
          }
          if (typeof _onValueChange === "function") {
            _onValueChange(new Utils.Event({ value, formValue, setItemValue }));
          }
          // eslint-disable-next-line uu5/hooks-exhaustive-deps
        }, [formattedValue]);
        //@@viewOff:private

        //@@viewOn:render
        otherProps = useMemoObject(otherProps, Utils.Object.shallowEqual);
        let renderedResult = useMemo(
          () => (
            <Form.Provider initialValue={formattedValue} disableLeaveConfirmation>
              {(formData) => {
                formDataRef.current = formData;
                return (
                  <>
                    <FormConsumerHelper
                      onValueChange={(e) => {
                        let newData = e.data.value;
                        if (!Utils.Object.deepEqual(newData, formValue)) {
                          setFormValue(newData);
                          if (typeof onChange === "function") {
                            let parsedValue = newData;
                            if (typeof parseValue === "function") parsedValue = parseValue(parsedValue);

                            onChange(new Utils.Event({ value: parsedValue }));
                            synchronizeErrorList(formData.itemMap);
                          }
                        }
                      }}
                      onItemMapErrorListChange={(e) => {
                        synchronizeErrorList(formData.itemMap, e.data.errorList);
                      }}
                    />
                    <Component
                      {...otherProps}
                      onValidationStart={(...args) => {
                        isValidatingRef.current = true;
                        otherProps.onValidationStart?.(...args);
                      }}
                      onValidationEnd={(...args) => {
                        otherProps.onValidationEnd?.(...args);
                        isValidatingRef.current = false;
                      }}
                      onValidate={async (e) => {
                        let { valid: result } = e.data.type === "mount" ? true : await formData.validate();
                        if (result && typeof onValidate === "function") {
                          result = onValidate(e);
                        }
                        return result;
                      }}
                    >
                      {children}
                    </Component>
                  </>
                );
              }}
            </Form.Provider>
          ),
          [children, formValue, formattedValue, onChange, onValidate, otherProps, parseValue, synchronizeErrorList],
        );

        return renderedResult;
      },
      //@@viewOff:render
    }),
  );
}

//@@viewOn:exports
export { withSubformItem };
export default withSubformItem;
//@@viewOff:exports
