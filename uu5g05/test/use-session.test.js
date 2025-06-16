import { useSession, SessionProvider } from "uu5g05";
import { Test, Session } from "uu5g05-test";
import { AuthenticationService } from "uu_appg01_oidc";
import { createRerenderableComponent } from "./internal/tools.js";

function renderHookWithProvider(providerProps, ...initialHookParams) {
  let { rerender, Component } = createRerenderableComponent((props) => <SessionProvider {...props} />, providerProps);
  let result = Test.renderHook((props) => useSession(...props), {
    initialProps: initialHookParams,
    wrapper: Component,
  });
  return {
    ...result,
    setProviderProps: (newProps) => rerender(newProps),
  };
}

describe("[uu5g05] useSession", () => {
  it("should return expected result API", () => {
    let { result } = renderHookWithProvider({ authenticationService: AuthenticationService });
    expect(result.current).toEqual({
      state: expect.any(String),
      identity: expect.any(Object),
      isExpiring: expect.any(Boolean),
      isUntrusted: expect.any(Boolean),
      untrustedData: null,
      resetUntrustedData: undefined,
      session: expect.any(Object),
      login: expect.any(Function),
      logout: expect.any(Function),
    });
  });

  it("should be 'notAuthenticated' if there is no SessionProvider", () => {
    let { result } = Test.renderHook(() => useSession({ authenticationService: AuthenticationService }));
    expect(result.current).toEqual(
      expect.objectContaining({
        state: "notAuthenticated",
        identity: null,
        isExpiring: false,
        session: null,
      }),
    );
  });

  it("should react to session changes", async () => {
    await Session.setPending();

    let { result } = renderHookWithProvider({ authenticationService: AuthenticationService });
    expect(result.current).toMatchObject({
      state: "pending",
      identity: undefined,
      isExpiring: false,
      login: expect.any(Function),
      session: AuthenticationService.getCurrentSession(),
    });

    await Session.setIdentity(Session.TEST_IDENTITY); // NOTE This also marks session initialization as finished.
    expect(result.current).toMatchObject({
      state: "authenticated",
      identity: Session.TEST_IDENTITY,
      isExpiring: false,
    });

    await Session.setExpiring(true);
    expect(result.current).toMatchObject({
      state: "authenticated",
      identity: Session.TEST_IDENTITY,
      isExpiring: true,
    });

    await Session.setExpiring(false);
    expect(result.current).toMatchObject({
      state: "authenticated",
      identity: Session.TEST_IDENTITY,
      isExpiring: false,
    });

    await Session.setExpiring(true);
    await Session.setIdentity(null);
    expect(result.current).toMatchObject({
      state: "notAuthenticated",
      identity: null,
      isExpiring: false,
    });
  });
});
