import { useRef } from "./react-hooks.js";

function useWillMount(func) {
  const willMount = useRef(true);
  if (willMount.current) func();
  willMount.current = false;
}

export { useWillMount };
export default useWillMount;
