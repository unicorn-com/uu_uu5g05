import { useDevice, DeviceProvider } from "uu5g05";
import { Test } from "uu5g05-test";
import { createRerenderableComponent } from "./internal/tools.js";

describe("[uu5g05] useDevice", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => useDevice());
    expect(result.current).toMatchObject({
      browserName: expect.any(String),
      platform: expect.any(String),
      hasTouch: expect.any(Boolean),
      hasPointer: expect.any(Boolean),
      orientation: expect.any(String),
      // isWebView: expect.any(Boolean), // TODO Uncomment
      isHeadless: expect.any(Boolean),
      isMobileOrTablet: expect.any(Boolean),
    });
  });

  it("should detect common browsers", async () => {
    let checkUserAgent = (userAgent, expectedValues) => {
      Object.defineProperty(navigator, "userAgent", {
        get() {
          return userAgent;
        },
        configurable: true,
      });
      Object.defineProperty(navigator, "platform", {
        get() {
          return userAgent.split(/[()]/)[1];
        },
        configurable: true,
      });
      let { result } = Test.renderHook(() => useDevice());
      expect(result.current).toMatchObject(expectedValues);
    };
    checkUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36",
      { browserName: "chrome", platform: "windows" },
    );
    checkUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36",
      { browserName: "chrome", platform: "mac" },
    );
    checkUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36",
      { browserName: "chrome", platform: "linux" },
    );
    checkUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 13_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/81.0.4044.124 Mobile/15E148 Safari/604.1",
      { browserName: "safari", platform: "ios" }, // everything on iOS is Safari
    );
    checkUserAgent(
      "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.117 Mobile Safari/537.36",
      { browserName: "chrome", platform: "android" },
    );

    checkUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0", {
      browserName: "firefox",
      platform: "windows",
    });
    checkUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9",
      { browserName: "safari", platform: "mac" },
    );
    checkUserAgent("Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko", {
      browserName: "ie",
      platform: "windows",
    });
    checkUserAgent(
      "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10136",
      { browserName: "edge", platform: "windows" },
    );
  });

  it("should use DeviceProvider", async () => {
    const PROPS1 = {
      browserName: "a",
      platform: "b",
      hasTouch: true,
      hasPointer: true,
      orientation: "landscape-secondary",
      isWebView: true,
      isHeadless: true,
      isMobileOrTablet: true,
    };
    const PROPS2 = {
      browserName: "aa",
      platform: "bb",
      hasTouch: false,
      hasPointer: false,
      orientation: "portrait-primary",
      isWebView: false,
      isHeadless: false,
      isMobileOrTablet: false,
    };

    let { rerender, Component } = createRerenderableComponent(
      (props) => <DeviceProvider {...props}>{props.children}</DeviceProvider>,
      PROPS1,
    );
    let { result } = Test.renderHook(() => useDevice(), { wrapper: Component });
    expect(result.current).toMatchObject(PROPS1);

    rerender(PROPS2);
    expect(result.current).toMatchObject(PROPS2);
  });
});
