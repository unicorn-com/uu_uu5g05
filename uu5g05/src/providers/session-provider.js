/**
 * Copyright (C) 2021 Unicorn a.s.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License at
 * <https://gnu.org/licenses/> for more details.
 *
 * You may obtain additional information at <https://unicorn.com> or contact Unicorn a.s. at address: V Kapslovne 2767/2,
 * Praha 3, Czech Republic or at the email: info@unicorn.com.
 */

import React from "react";
import { useState, useLayoutEffect, useMemo } from "../hooks/react-hooks.js";
import createComponent from "../create-component/create-component.js";
import { usePreviousValue } from "../hooks/use-previous-value.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import SessionContext from "../contexts/session-context.js";
import SessionUntrustedDataContext from "../contexts/session-untrusted-data-context.js";
import UtilsObject from "../utils/object.js";
import { matchesAccessPolicy } from "../_internal/use-access-policy-error-recovery.js";

const sessionHolder = { session: null }; // exported library-private field with "global" session

const registerSession = (authenticationService, setIdentity, setExpiring, setUntrustedData) => {
  if (!authenticationService) return;

  const onSessionChanged = (e) => {
    let session = e?.data;
    let newIdentity = getIdentityFromSession(session);
    setIdentity((curIdentity) =>
      newIdentity !== curIdentity &&
      (!newIdentity || !curIdentity || !UtilsObject.shallowEqual(newIdentity, curIdentity))
        ? newIdentity
        : curIdentity,
    );
  };
  const onSessionExpiring = () => setExpiring(true);
  const onSessionExtended = () => setExpiring(false);
  const onUntrustedSession = (e) => setUntrustedData(e?.data || {});

  if (authenticationService) {
    let aborted;
    if (authenticationService.initComplete) {
      authenticationService.addListener("sessionChanged", onSessionChanged);
      authenticationService.addListener("sessionExpiring", onSessionExpiring);
      authenticationService.addListener("sessionExtended", onSessionExtended);
      authenticationService.addListener("untrustedSession", onUntrustedSession);
    } else {
      // NOTE We're using initPromise because if user is logged out, we wouldn't get notification
      // about that and we would stay in "pending" state.
      authenticationService.initPromise.then(() => {
        if (aborted) return;
        onSessionChanged({ data: authenticationService.getCurrentSession() });
        setExpiring(authenticationService.isSessionExpiring());
        authenticationService.addListener("sessionChanged", onSessionChanged);
        authenticationService.addListener("sessionExpiring", onSessionExpiring);
        authenticationService.addListener("sessionExtended", onSessionExtended);
        authenticationService.addListener("untrustedSession", onUntrustedSession);
      });
    }

    return () => {
      aborted = true;
      authenticationService.removeListener("sessionChanged", onSessionChanged);
      authenticationService.removeListener("sessionExpiring", onSessionExpiring);
      authenticationService.removeListener("sessionExtended", onSessionExtended);
      authenticationService.removeListener("untrustedSession", onUntrustedSession);
    };
  }
};

function getIdentity(authenticationService) {
  if (!authenticationService) return null;
  if (!authenticationService.initComplete) return undefined;
  return getIdentityFromSession(authenticationService.getCurrentSession());
}
function getIdentityFromSession(currentSession) {
  if (!currentSession || !currentSession.isAuthenticated()) return null;
  let oidcIdentity = currentSession.getIdentity();
  let uu5Identity = {};
  uu5Identity.name = oidcIdentity.getName();
  uu5Identity.uuIdentity = oidcIdentity.getUuIdentity();
  uu5Identity.accountType = oidcIdentity.getAccountType?.();
  uu5Identity.levelOfAssurance = oidcIdentity.getLevelOfAssurance();
  uu5Identity.loginLevelOfAssurance = currentSession.getAuthenticationLevelOfAssurance();
  return uu5Identity;
}

const SessionProvider = createComponent({
  uu5Tag: Config.TAG + "SessionProvider",

  propTypes: {
    authenticationService: PropTypes.oneOfType([
      PropTypes.func, // because uu_appg01_oidc's authn service is a class
      PropTypes.shape({
        initComplete: PropTypes.bool,
        initPromise: PropTypes.object,
        addListener: PropTypes.func,
        removeListener: PropTypes.func,
        getCurrentSession: PropTypes.func,
        isSessionExpiring: PropTypes.func,
        authenticate: PropTypes.func,
      }),
    ]).isRequired,
  },

  defaultProps: {
    authenticationService: undefined,
  },

  render(props) {
    const { authenticationService, children } = props;

    // TODO Remove when uu_appg01_oidc has necessary API.
    if (authenticationService && !("initPromise" in authenticationService)) {
      authenticationService.initComplete = !!authenticationService._onPageLoadFinished;
      authenticationService.initPromise = (
        authenticationService._onPageLoad?.() || authenticationService.restoreSession()
      )
        .catch(() => null)
        .finally(() => (authenticationService.initComplete = true));
    }

    const session = authenticationService?.getCurrentSession() ?? null;
    let [identity, setIdentity] = useState(() => getIdentity(authenticationService));

    let [untrustedData, setUntrustedData] = useState(null);
    if (untrustedData && (identity === null || (identity && (matchesAccessPolicy(session, untrustedData) ?? true)))) {
      untrustedData = null;
      setUntrustedData(untrustedData);
    }

    let [isExpiring, setExpiring] = useState(() =>
      authenticationService?.initComplete ? authenticationService.isSessionExpiring() : false,
    );
    if (isExpiring && identity === null) {
      isExpiring = false;
      setExpiring(false);
    }

    let isUntrusted = authenticationService?.isSessionUntrusted?.() ?? false;

    const prevAuthenticationService = usePreviousValue(authenticationService, authenticationService);
    if (authenticationService !== prevAuthenticationService) {
      let newIdentity = getIdentity(authenticationService);
      if (!UtilsObject.shallowEqual(newIdentity, identity)) setIdentity((identity = newIdentity));
      let newExpiring = authenticationService?.initComplete ? authenticationService.isSessionExpiring() : false;
      if (newExpiring !== isExpiring) setExpiring((isExpiring = newExpiring));
    }
    useLayoutEffect(() => {
      const unregister = registerSession(authenticationService, setIdentity, setExpiring, setUntrustedData);
      return unregister;
    }, [authenticationService]);

    const value = useMemo(() => {
      let sessionState = "pending";
      if (identity) {
        sessionState = "authenticated";
      } else if (identity === null) {
        sessionState = "notAuthenticated";
      }

      // NOTE Keep value in sync with uu5g04/src/core/uu5g05-integration/use-session.js.
      return {
        state: sessionState,
        identity,
        isExpiring,
        // NOTE This flag represents that the whole session is untrusted, i.e. user might be logged in to OIDC backend
        // but application (as one of OIDC clients) is configured to only allow logins with higher level of assurance
        // to consider user logged in. So for the purposes of such application, the user is actually logged out with "isUntrusted"
        // flag (which e.g. Plus4U5App.Spa uses to show as an <Plus4U5Elements.Unauthorized mfaRequired /> error).
        isUntrusted,

        // TODO Remove these 2 fields and useMemo dependency after uu_plus4u5g02 1.33.0 gets released (no backward compatibility).
        untrustedData,
        resetUntrustedData: untrustedData ? () => setUntrustedData(null) : undefined,

        session,
        login: async (opts, ...args) => {
          let defaultOpts = {};
          if (isExpiring) defaultOpts.prompt = "login";
          if (untrustedData) {
            defaultOpts.maxAge = untrustedData.maxAuthenticationAge;
            defaultOpts.acrValues = Array.isArray(untrustedData.supportedAcrValues)
              ? untrustedData.supportedAcrValues.join(" ")
              : untrustedData.supportedAcrValues;
          }
          return await authenticationService?.authenticate?.({ ...defaultOpts, ...opts }, ...args);
        },
        logout: async () => {
          let currentSession = authenticationService?.getCurrentSession();
          return currentSession?.close?.().catch((e) => {
            // TODO error
            console.error(`User ${identity.uuIdentity} is not logged out.`, e);
          });
        },
      };
    }, [authenticationService, identity, isExpiring, isUntrusted, session, untrustedData]);

    const sessionUntrustedDataValue = useMemo(
      () => ({
        // NOTE This field serves only as an indication ("there was a request that needed higher level of assurance")
        // but it can get reset without meeting such request (e.g. by cancelling the dialog for re-login). So `undefined`
        // means either that no one tried using higher level of assurance or that they tried but user refused to login.
        // I.e. it has purpose only for our re-login dialog (Plus4U5App.SessionWatch, resp. SessionUntrustedDialog).
        // Components using useDataObject, ..., should instead use session.matches(errorData.error.paramMap) to check
        // for match with their requested level of assurance when trying to do automatic re-load on session change.
        untrustedData,
        // NOTE If we're showing "session is untrusted" dialog and user simply closes it without logging in,
        // we don't want to require high trust for next login (e.g. when expiration is nearing), i.e. cancelling
        // the dialog must reset the "session is untrusted" info. And that's why this method is here (dialog should
        // call this when closing).
        resetUntrustedData: untrustedData ? () => setUntrustedData(null) : undefined,
      }),
      [untrustedData],
    );

    // remember session as "global"
    // NOTE This assumes that there's always rendered at most 1 SessionProvider.
    // NOTE This must be set sooner than in useEffect because it must be available within
    // 1st render (when uu5string parsing might be happenning).
    sessionHolder.session = value;

    return (
      <SessionContext.Provider value={value}>
        <SessionUntrustedDataContext.Provider value={sessionUntrustedDataValue}>
          {typeof children === "function" ? children(value) : children}
        </SessionUntrustedDataContext.Provider>
      </SessionContext.Provider>
    );
  },
});

export { SessionProvider, sessionHolder };
export default SessionProvider;
