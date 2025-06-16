//@@viewOn:imports
import { useToolbarContext } from "../contexts/toolbar-context.js";
//@@viewOff:imports

const constValues = {
  providerless: true,
  toolbarless: true,
  setLeftElement: () => {},
  setRightElement: () => {},
  renderLeft: () => {},
  renderRight: () => {},
};

function useToolbar() {
  const contextValue = useToolbarContext();

  return contextValue || constValues;
}

export { useToolbar };
export default useToolbar;
