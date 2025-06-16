import { useEffect } from "../hooks/react-hooks.js";
import useSession from "../hooks/use-session.js";

function matchesAccessPolicy(session, { supportedAcrValues, maxAuthenticationAge } = {}) {
  if (!session || typeof session.matches !== "function") return null; // unable to match
  return !!session.matches(
    Array.isArray(supportedAcrValues) ? supportedAcrValues.join(" ") : supportedAcrValues,
    maxAuthenticationAge,
  );
}

// NOTE Currently all useDataObject-s/useDataList-s use this. We could introduce
// ~`skipAccessPolicyErrorRecovery: true` if needed.
function useAccessPolicyErrorRecovery({ errorData, handlerMap }) {
  const { session } = useSession();

  useEffect(() => {
    if (
      errorData?.operation === "load" &&
      errorData?.error?.code === "uu-app-oidc/verifyAccessPolicy/untrustedSession" &&
      matchesAccessPolicy(session, errorData.error.paramMap)
    ) {
      handlerMap?.[errorData.operation]?.(errorData.dtoIn);
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [errorData, session]);
}

export { useAccessPolicyErrorRecovery, matchesAccessPolicy };
export default useAccessPolicyErrorRecovery;
