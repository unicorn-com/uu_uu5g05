//@@viewOn:imports
import { createComponent, PropTypes, Lsi, useState, Utils, useMemoObject, useRef, useEffect } from "uu5g05";
import Uu5Elements, { UuGds } from "uu5g05-elements";
import Config from "../config/config.js";
import { maxLength, minLength, pattern, required } from "../config/validations.js";
import withExtensionInput from "../with-extension-input.js";
import withValidationMap from "../with-validation-map.js";
import { _TextInput } from "./text-input.js";
import useValidatorMap from "../use-validator-map.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const Input = withExtensionInput(_TextInput);

const { type, ...propTypes } = _TextInput.propTypes;
const { type: _, _formattedValue, ...defaultProps } = _TextInput.defaultProps;

//@@viewOn:css
const Css = {
  wrapper: () =>
    Config.Css.css({
      width: "100%",
      display: "flex",
      gap: UuGds.getValue(["SpacingPalette", "fixed", "c"]),
    }),
  languageItem: () =>
    Config.Css.css({
      minWidth: 180,
      display: "grid",
      gridTemplateColumns: "auto auto 1fr",
      alignItems: "center",
      justifyItems: "end",
      gap: UuGds.getValue(["SpacingPalette", "fixed", "c"]),
    }),
  dropdown: () =>
    Config.Css.css({
      minWidth: "max-content",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function getValidationError(invalidEntries, currentLanguage, languageList, extraMessageParams = []) {
  if (invalidEntries.length > 0) {
    let invalidLanguages = invalidEntries.map(([lang]) => lang);
    return {
      messageParams: [
        invalidLanguages.includes(currentLanguage.code)
          ? ""
          : (languageList.find((item) => item.code === invalidLanguages[0])?.name || invalidLanguages[0]) + ": ",
        ...extraMessageParams,
      ],
    };
  }
}

//@@viewOff:helpers

const _LsiInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Lsi.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    value: PropTypes.object,
    languageList: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          code: PropTypes.string.isRequired,
          name: PropTypes.string,
          required: PropTypes.bool,
        }),
      ]),
    ),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    value: undefined,
    languageList: [],
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { required: requiredProp, _forceRequiredLanguage, ...restrictProps } = props;
    const { value, onChange, onValidationEnd, pattern, minLength, maxLength, ...otherProps } = restrictProps;
    const { elementAttrs, componentProps } = Utils.VisualComponent.splitProps(otherProps, Css.wrapper());
    //Note: required is override by each language required prop.
    const required = _forceRequiredLanguage ? false : requiredProp;

    const languageList = useMemoObject(
      restrictProps.languageList.map((language) => {
        if (typeof language === "string") {
          return { code: language, ...Uu5Elements.LanguageSelector._LANGUAGE_MAP[language] };
        } else {
          return { ...Uu5Elements.LanguageSelector._LANGUAGE_MAP[language.code], ...language };
        }
      }),
    );

    let [currentLanguage, setCurrentLanguage] = useState(languageList[0]);
    if (languageList.length && !languageList.some((it) => it.code === currentLanguage?.code)) {
      currentLanguage = languageList[0];
      setCurrentLanguage(currentLanguage);
    }

    function getMatchingValues() {
      // omit extra languages if `value` contains additional keys that do not match our languageList
      const newValue = {};
      languageList.forEach((language) => {
        newValue[language.code] = value?.[language.code] || null;
      });
      return newValue;
    }

    const currentValuesRef = useRef();
    useEffect(() => {
      currentValuesRef.current = { getMatchingValues, onChange };
    });

    const validationRef = useRef();
    const onValidate = useValidatorMap(
      restrictProps,
      {
        required: {
          validator: (value) => {
            if (!required) return true;
            if (!value || typeof value !== "object") return { messageParams: [""] };
            let invalidEntries = Object.values(languageList)
              .map((langObj) => [langObj.code, value?.[langObj.code]])
              .filter(([lang, value]) => !value);
            return getValidationError(invalidEntries, currentLanguage, languageList);
          },
          // revalidate also if these changes (e.g. current language get switched - update the language prefix in the message)
          dependencies: [currentLanguage.code, languageList],
          // TODO For "required" we'd like to keep skipping this validator until user actually focuses the input
          // (or until submit happens), but we currently do not track this information. Change implementation,
          // so that following scenario works:
          // 1. User focuses and blurs LsiInput, validation message is shown.
          // 2. User switches language in LsiInput - revalidation is run (due to our extra "dependencies")
          //    and "required" validator should run too (it currently runs only thanks to the flag below).
          _skipOnValidatorsChangeTmpFlag: false,
          skipOnMount: true,
        },
        requiredLanguage: {
          validator: (value) => languageList.every((language) => !language.required || value?.[language.code]),
          dependencies: [currentLanguage.code, languageList],
          _skipOnValidatorsChangeTmpFlag: false,
          skipOnMount: true,
        },
        pattern: {
          validator: (value) => {
            if (!pattern || !value) return true;
            let invalidEntries = Object.entries(value).filter(([lang, value]) => value && !value.match(pattern));
            return getValidationError(invalidEntries, currentLanguage, languageList);
          },
          dependencies: [currentLanguage.code, languageList],
        },
        minLength: {
          validator: (value) => {
            if (minLength == null || !value) return true;
            let invalidEntries = Object.entries(value).filter(([lang, value]) => value && value.length < minLength);
            return getValidationError(invalidEntries, currentLanguage, languageList, [minLength]);
          },
          dependencies: [currentLanguage.code, languageList],
        },
        maxLength: {
          validator: (value) => {
            if (maxLength == null || !value) return true;
            let invalidEntries = Object.entries(value).filter(([lang, value]) => value && value.length > maxLength);
            return getValidationError(invalidEntries, currentLanguage, languageList, [maxLength]);
          },
          dependencies: [currentLanguage.code, languageList],
        },
        mismatch: (value) => {
          if (!value) return true;
          let languageCodes = new Set(languageList.map((it) => it.code));
          let disallowedLanguages = Object.keys(value).filter((it) => !languageCodes.has(it));
          return disallowedLanguages.length > 0
            ? {
                messageParams: [
                  disallowedLanguages.join(", "),
                  <Uu5Elements.Link
                    key="0"
                    onClick={(e) => {
                      if (typeof onChange === "function") {
                        onChange(new Utils.Event({ value: getMatchingValues() }));
                        // revalidate *after* React performs re-render
                        Promise.resolve().then(() => {
                          validationRef.current();
                        });
                      }
                    }}
                    disabled={typeof onChange !== "function"} // this onChange can become "old" but we don't have way to make it better currently
                  >
                    <Lsi import={importLsi} path={["Validation", "mismatchClickLsi"]} />
                  </Uu5Elements.Link>,
                ],
              }
            : true;
        },
      },
      {
        final: true, // do not allow adding other validators (from TextInput)
      },
    );

    const getBadge = (language) => {
      let result;
      let langValue = value?.[language.code];
      if (language.required && !langValue) {
        result = (
          <Uu5Elements.Badge colorScheme="negative" size="l">
            <Lsi import={importLsi} path={["Lsi", "requiredBadge"]} />
          </Uu5Elements.Badge>
        );
      } else if (!language.required && !langValue) {
        result = (
          <Uu5Elements.Badge colorScheme="warning" size="l">
            <Lsi import={importLsi} path={["Lsi", "notTranslatedBadge"]} />
          </Uu5Elements.Badge>
        );
      } else {
        result = (
          <Uu5Elements.Badge colorScheme="positive" size="l">
            <Lsi import={importLsi} path={["Lsi", "translatedBadge"]} />
          </Uu5Elements.Badge>
        );
      }
      return result;
    };

    const getDropdownItems = () => {
      return languageList.map((language) => {
        let isSelected = currentLanguage.code === language.code;
        return {
          onClick: () => {
            setCurrentLanguage(language);
          },
          value: language.code,
          children: (
            <div className={Css.languageItem()}>
              <Uu5Elements.Flag src={language.flagUri} code={language.code} type="circle" bordered />
              {language.name}
              {getBadge(language)}
            </div>
          ),
          colorScheme: isSelected ? "primary" : "building",
          focused: isSelected,
        };
      });
    };

    function handleChange(e) {
      const newValue = getMatchingValues();
      newValue[currentLanguage.code] = e.data.value;
      onChange(new Utils.Event({ value: newValue }, e));
    }

    function handleValidationEnd(e) {
      if (e.data.errorList.length > 1) {
        // re-order errors so that error for current language is always first (e.g. when having maxLength violation
        // for English and minLength for Czech and Czech is current, then we want to see minLength message, even if maxLength
        // validation got executed first)
        let firstErrorIndexForCurrentLanguage = e.data.errorList.findIndex(
          (it) => it.feedback === "error" && it.messageParams?.[0] === "",
        );
        if (firstErrorIndexForCurrentLanguage > 0) {
          let data = { ...e.data };
          data.errorList = [...e.data.errorList];
          data.errorList[0] = e.data.errorList[firstErrorIndexForCurrentLanguage];
          data.errorList[firstErrorIndexForCurrentLanguage] = e.data.errorList[0];
          e = new Utils.Event(data, e);
        }
      }
      onValidationEnd(e);
    }

    //@@viewOff:private

    //@@viewOn:render
    return (
      <div {...elementAttrs}>
        <Input
          {...componentProps}
          value={value?.[currentLanguage.code]}
          validationRef={Utils.Component.combineRefs(componentProps.validationRef, validationRef)}
          onChange={typeof onChange === "function" ? handleChange : undefined}
          onValidate={onValidate}
          onValidationEnd={typeof onValidationEnd === "function" ? handleValidationEnd : undefined}
        />
        <Uu5Elements.Dropdown
          disabled={restrictProps.disabled}
          className={Css.dropdown()}
          itemList={getDropdownItems()}
          size={componentProps.size}
          label={
            <Uu5Elements.Flag
              src={currentLanguage.flagUri}
              code={currentLanguage.code}
              type="circle"
              bordered
              className={Config.Css.css({ marginInline: "-0.5em" })}
            />
          }
        />
      </div>
    );
    //@@viewOff:render
  },
});

const LsiInput = withValidationMap(_LsiInput, {
  required: {
    ...required(),
    message: { import: importLsi, path: ["Validation", "requiredLsi"] },
  },
  pattern: {
    ...pattern(),
    message: { import: importLsi, path: ["Validation", "patternLsi"] },
  },
  minLength: {
    ...minLength(),
    message: { import: importLsi, path: ["Validation", "minLengthLsi"] },
  },
  maxLength: {
    ...maxLength(),
    message: { import: importLsi, path: ["Validation", "maxLengthLsi"] },
  },
  requiredLanguage: {
    ...required(),
    message: { import: importLsi, path: ["Validation", "requiredLanguageLsi"] },
  },
  mismatch: {
    message: { import: importLsi, path: ["Validation", "mismatchLsi"] },
    feedback: "error",
  },
});

export { LsiInput };
export default LsiInput;
