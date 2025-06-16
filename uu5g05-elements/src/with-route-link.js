import { createComponent, Environment, useRoute } from "uu5g05";
import Config from "./config/config.js";

const QUERY_OR_HASH_ONLY_REGEXP = /^[?#]/;

function getFullHref(href) {
  try {
    return href != null
      ? new URL(href, QUERY_OR_HASH_ONLY_REGEXP.test(href) ? location.href : Environment.appBaseUri).toString()
      : href;
  } catch (e) {
    return null;
  }
}

function getNormalizedHref(href) {
  // https://uuapp.plus4u.net/... is alias for https://uuapp-eu-w-1.plus4u.net/... and https://uuos9.plus4u.net/...
  // this changes the url to the alias according these rules: NET-BT:41376822387638667
  return href?.replace(/^https:\/\/(uuappg01-eu-w-1\.plus4u\.net|uuos9\.plus4u\.net)/, "https://uuapp.plus4u.net");
}

function getUrlAlias(href, aliasList) {
  return aliasList?.find((it) => href.startsWith(getNormalizedHref(it)));
}

function useRouteLink(href, alias) {
  const [curRoute, setRoute] = useRoute();
  const fullHref = getFullHref(href); // recompute full href here, not in parent component (if route changes and href is "?code=abc" then it should use new route and add the param there)
  const normalizedHref = getNormalizedHref(fullHref);

  let currentOriginHref;
  let appBaseOriginHref;

  if (alias) {
    currentOriginHref = normalizedHref;
    appBaseOriginHref = normalizedHref ? Environment.appBaseUri + normalizedHref.slice(alias.length) : href;
  } else {
    const normalizedAppBaseUri = getNormalizedHref(Environment.appBaseUri);
    currentOriginHref = normalizedHref
      ? Environment.appBaseUri + normalizedHref.slice(normalizedAppBaseUri.length)
      : href;
  }

  function onClick(e) {
    if (!e.ctrlKey && !e.metaKey && e.button !== 1 && !e.defaultPrevented) {
      let url;
      try {
        url = new URL(appBaseOriginHref || currentOriginHref);
      } catch (e) {
        // ignore
      }
      if (url) {
        let fragmentChangeOnly =
          url.hash && url.origin + url.pathname + url.search === location.origin + location.pathname + location.search;
        // to prevent click on link to redirect to target page
        e.preventDefault();
        let params = fragmentChangeOnly ? curRoute.params : Object.fromEntries(url.searchParams);
        let uu5Route = fragmentChangeOnly
          ? curRoute.uu5Route
          : (url.origin + url.pathname).replace(Environment.appBaseUri, "");
        let fragment = url.hash.slice(1) || undefined;
        setRoute(uu5Route, params, fragment);
      }
    }
  }

  return [currentOriginHref, setRoute ? onClick : undefined];
}

const RouteLink = createComponent({
  uu5Tag: Config.TAG + "RouteLink",

  render(props) {
    const { href, Component, alias, ...otherProps } = props;

    const [origHref, onClick] = useRouteLink(href, alias);

    // NOTE Passing "href" instead of "currentOriginHref" so that if page doesn't use our routing
    // but changes its URL via history.replaceState(..., newUrl), then href-s like "?code=abc"
    // should result in newUrl + "?code=abc", not in originalUrl + "?code=abc" (where originalUrl is
    // the URL that was active during our 1st render; changing to newUrl does not necessarily
    // re-render Link-s).
    return (
      <Component
        {...otherProps}
        href={onClick ? origHref : href}
        onClick={(e) => {
          otherProps.onClick?.(e);
          onClick?.(e);
        }}
      />
    );
  },
});

function withRouteLink(Component) {
  return createComponent({
    uu5Tag: `withRouteLink(${Component.uu5Tag})`,

    propTypes: Component.propTypes,
    defaultProps: Component.defaultProps,

    render(props) {
      const { target, href } = props;

      const [route] = useRoute();
      const { aliasList } = route ?? {};

      let Comp = Component;
      const privateProps = {};

      if (href) {
        const fullHref = getFullHref(href);
        const normalizedHref = getNormalizedHref(fullHref);
        const normalizedAppBaseUri = getNormalizedHref(Environment.appBaseUri);
        const alias = getUrlAlias(normalizedHref, aliasList);
        if ((!target || target === "_self") && href && (normalizedHref?.startsWith(normalizedAppBaseUri) || alias)) {
          Comp = RouteLink;
          privateProps.Component = Component;
          privateProps.alias = alias;
        } else if (fullHref && (fullHref !== normalizedHref || fullHref.startsWith("about:"))) {
          // NOTE Fragment links inside iframe with srcdoc work only if URL is "about:srcdoc#fragment", not if it is simply "#fragment".
          privateProps.href = normalizedHref;
        } else if (target === "_blank") {
          privateProps.href = fullHref;
        }
      }

      return <Comp {...props} {...privateProps} />;
    },
  });
}

export { withRouteLink };
export default withRouteLink;
