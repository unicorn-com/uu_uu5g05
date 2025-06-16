import { useMemo } from "../hooks/react-hooks.js";
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import LevelContext from "../contexts/level-context.js";
import useValueChange from "../hooks/use-value-change.js";

const LevelProvider = createComponent({
  uu5Tag: Config.TAG + "LevelProvider",

  propTypes: {
    level: PropTypes.number,
    onChange: PropTypes.func,
  },

  defaultProps: {
    level: undefined,
    onChange: undefined,
  },

  render(props) {
    const { children } = props;
    const onChange = typeof props.onChange === "function" ? (level) => props.onChange({ level }) : null;
    const [level, setLevel] = useValueChange(props.level, onChange);
    let value = useMemo(() => ({ level, setLevel }), [level, setLevel]);
    return (
      <LevelContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </LevelContext.Provider>
    );
  },
});

export { LevelProvider };
export default LevelProvider;
