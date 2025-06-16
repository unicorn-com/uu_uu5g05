import { useRouteContext } from "../contexts/route-context.js";

function useRoute() {
  const ctxValue = useRouteContext();
  return [ctxValue?.route, ctxValue?.setRoute];
}

export { useRoute };
export default useRoute;
