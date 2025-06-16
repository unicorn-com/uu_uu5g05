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

// devkit-pure-exports

// NOTE 1st export with the same name wins (./hooks/use-language.js exports useLanguage, ..., too).
// NOTE Cannot use `export * from "./exports-with-g04-support.js";` because babel in Jest tests
// will start complaining that there's 2nd export with the same name (but it doesn't complain when
// exports are named explicitly, not via "*") :-/.
export {
  useLanguage,
  useLevel,
  useScreenSize,
  useTimeZone,
  useSession,
  useUserPreferences,
  useRouteLeave,
  useRoute,
  useDynamicLibraryComponent,
  _react,
  _reactDom,
} from "./exports-with-g04-support.js";

export * from "./create-component/create-component.js";
export * from "./create-component/create-component-with-ref.js";
export * from "./create-component/create-hoc.js";
export * from "./create-component/create-visual-component.js";
export * from "./create-component/create-visual-component-with-ref.js";

export { Suspense } from "react";
export * from "./components/auto-load.js";
export * from "./components/content.js";
export * from "./components/dynamic-library-component.js";
export * from "./components/error-boundary.js";
export * from "./components/lsi.js";
export * from "./components/render-counter.js";

export * from "./environment.js";
export * from "./fragment.js";

export * from "./hocs/with-lazy.js";
export * from "./hocs/with-lsi.js";
export * from "./hocs/with-viewport-sticky-bottom.js";
export * from "./hocs/with-route-params-provider.js";
export * from "./hocs/with-sticky-top.js";

export * from "./hooks/react-hooks.js";
export * from "./hooks/use-animation-layer.js";
export * from "./hooks/use-app-background.js";
export * from "./hooks/use-background.js";
export * from "./hooks/use-call.js";
export * from "./hooks/use-component-visibility.js";
export * from "./hooks/use-content-size-value";
export * from "./hooks/use-content-size";
export * from "./hooks/use-data-controller.js";
export * from "./hooks/use-data-filter.js";
export * from "./hooks/use-data-list.js";
export { useDataObject } from "./hooks/use-data-object.js";
export * from "./hooks/use-data-selection.js";
export * from "./hooks/use-data-sorter.js";
export * from "./hooks/use-data-store.js";
export * from "./hooks/use-device.js";
// export { useDynamicLibraryComponent } from "./hooks/use-dynamic-library-component.js";
export * from "./hooks/use-toolbar.js";
export * from "./hooks/use-element-size.js";
export * from "./hooks/use-event.js";
// export * from "./hooks/use-language.js";
export * from "./hooks/use-language-list.js";
// export * from "./hooks/use-level.js";
export * from "./hooks/use-lsi.js";
export * from "./hooks/use-lsi-values.js";
export * from "./hooks/use-memo-object.js";
export * from "./hooks/use-previous-value.js";
export * from "./hooks/use-print.js";
export * from "./hooks/use-print-blocker.js";
// export * from "./hooks/use-route.js";
export * from "./hooks/use-route-back.js";
// export * from "./hooks/use-route-leave.js";
export * from "./hooks/use-route-params.js";
export * from "./hooks/use-router.js";
// export * from "./hooks/use-screen-size.js";
export * from "./hooks/use-scroll-direction.js";
export * from "./hooks/use-selection.js";
// export * from "./hooks/use-session.js";
export * from "./hooks/use-session-untrusted-data.js";
export * from "./hooks/use-slide.js";
export * from "./hooks/use-speech-to-text.js";
export * from "./hooks/use-speech-voices.js";
export * from "./hooks/use-sticky-top.js";
export * from "./hooks/use-text-to-speech.js";
// export * from "./hooks/use-time-zone.js";
export * from "./hooks/use-trace-update.js";
export * from "./hooks/use-unmounted-ref.js";
export * from "./hooks/use-update-effect.js";
export * from "./hooks/use-update-layout-effect.js";
// export * from "./hooks/use-user-preferences.js";
export { useUserPreferencesCustomData as _useUserPreferencesCustomData } from "./hooks/use-user-preferences-custom-data.js"; // for uu_plus4u5g02 only
export * from "./hooks/use-uve-visibility.js";
export * from "./hooks/use-value-change.js";
export * from "./hooks/use-viewport-visibility.js";
export * from "./hooks/use-will-mount.js";
export * from "./hooks/use-worker.js";

export * from "./providers/animation-layer-provider.js";
export { AppBackgroundProvider } from "./providers/app-background-provider.js";
export { BackgroundProvider } from "./providers/background-provider.js";
export { ContentSizeProvider } from "./providers/content-size-provider.js";
export { DataControllerProvider } from "./providers/data-controller-provider.js";
export { DataStoreProvider } from "./providers/data-store-provider.js";
export { DeviceProvider } from "./providers/device-provider.js";
export { ToolbarProvider } from "./providers/toolbar-provider.js";
export { LanguageListProvider } from "./providers/language-list-provider.js";
export { LanguageProvider } from "./providers/language-provider.js";
export { LevelProvider } from "./providers/level-provider.js";
export { PortalElementProvider } from "./providers/portal-element-provider.js";
export { RouteProvider } from "./providers/route-provider.js";
export { ScreenSizeProvider } from "./providers/screen-size-provider.js";
export { SelectionProvider } from "./providers/selection-provider.js";
export { SessionProvider } from "./providers/session-provider.js";
export { TimeZoneProvider } from "./providers/time-zone-provider.js";
export { UserPreferencesProvider } from "./providers/user-preferences-provider.js";

// TODO Uncomment when devkit is ready (this needs webpack 5.x) and remove extra-exports.js then.
// export * as PropTypes from "./prop-types.js";
// export * as Utils from "./utils.js";
export * from "./extra-exports.js";

// for uu5richtextg01 2.x and uuEcc so that clicking on Toolbar (e.g. by uuEcc) doesn't cause onBlur in RichText
export * from "./hooks/use-active-subscriber.js";
export { useActivePublisher as _useActivePublisher } from "./_internal/use-active-publisher.js";
export { useActive as _useActive } from "./_internal/use-active.js";
export { useRenderLeftToolbarContext as _useRenderLeftToolbarContext } from "./_internal/render-left-toolbar-context.js";

// for uu5g05-* libraries only
export { usePortalElement as _usePortalElement } from "./hooks/use-portal-element.js";
export { CollapseAnimationProvider as _CollapseAnimationProvider } from "./providers/collapse-animation-provider.js";
export { ModalBusContext as _ModalBusContext } from "./contexts/modal-bus-context.js";
export { Tools as _Tools } from "./_internal/tools.js";

// equivalent of React's jsx-runtime (see ./jsx/jsx-runtime.js)
export * as _jsx from "./jsx/index.js";
export * as _jsxJsxRuntime from "./jsx/jsx-runtime.js";
