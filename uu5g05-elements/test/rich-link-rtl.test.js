import { RichLink } from "uu5g05-elements";
import { Test, VisualComponent, Utils } from "uu5g05-test";

const MOCK_DATA = {
  url: "https://unicorn.com",
  title: "Unicorn",
  description: "Unicorn je renomovaná evropská společnost poskytující ty největší informační systémy.",
  image: "https://unicorn.com/public/assets/image.png",
  favicon: "https://unicorn.com/public/assets/favicon.ico",
};

const MOCK_ERROR_RESPONSE = {
  uuAppErrorMap: { errorCode: { type: "error", paramMap: { url: MOCK_DATA.url } } },
};

function getDefaultProps() {
  return {
    href: MOCK_DATA.url,
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(RichLink, { ...getDefaultProps(), ...props }, opts);
}

let origFetch;
beforeEach(() => {
  origFetch = window.fetch;
  window.fetch = jest.fn(async (uri, opts) => {
    let url = new URL(uri, document.baseURI);
    if (url.pathname.endsWith("/website/metadata/load") && url.searchParams.get("url") === MOCK_DATA.url) {
      return { ok: true, status: 200, json: async () => MOCK_DATA };
    }
    return { ok: false, status: 500, json: async () => MOCK_ERROR_RESPONSE };
  });
});
afterEach(() => {
  window.fetch = origFetch;
});

let origOpen;
beforeEach(() => {
  origOpen = window.open;
  window.open = jest.fn();
});
afterEach(() => {
  window.open = origOpen;
});

describe("Uu5Elements.RichLink", () => {
  VisualComponent.testProperties(setup);

  it("checks href is properly used", async () => {
    const props = { href: MOCK_DATA.url };
    await setup(props);

    expect(
      Test.screen.getByRole("button", { name: (content) => content.indexOf(MOCK_DATA.title) !== -1 }),
    ).toBeInTheDocument();
    expect(Test.screen.getByText(MOCK_DATA.title)).toBeInTheDocument();
    expect(Test.screen.getByText(new URL(props.href).hostname)).toBeInTheDocument();
    expect(Test.screen.queryByText(MOCK_DATA.description)).not.toBeInTheDocument();
  });

  it("checks href is properly used (load failure)", async () => {
    const props = { href: "https://failure.com" };
    Utils.omitConsoleLogs("Fetch failed");
    await setup(props);

    expect(
      Test.screen.getByRole("button", { name: (content) => content.indexOf(new URL(props.href).hostname) !== -1 }),
    ).toBeInTheDocument();
    expect(Test.screen.queryByText(MOCK_DATA.title)).not.toBeInTheDocument();
    expect(Test.screen.getByText(new URL(props.href).hostname)).toBeInTheDocument();
    expect(Test.screen.queryByText(MOCK_DATA.description)).not.toBeInTheDocument();
  });

  it.each(["_blank", "_self"])("checks target = %s is properly used", async (target) => {
    const props = { target };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: (content) => content.indexOf(MOCK_DATA.title) !== -1 }));

    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenLastCalledWith(MOCK_DATA.url, target, expect.any(String));
  });

  it.each(["xs", "s", "m", "l"])(
    "checks size = %s with aspectRatio = 4x3 is properly set to root element",
    async (size) => {
      const props = { size, aspectRatio: "4x3" };
      const { element } = await setup(props);

      expect(element).toHaveGdsSize(["box", "4x3", size]);
    },
  );

  it.each(["2x3", "4x3", "3x2", "16x9", "3x4", "1x1"])(
    "checks aspectRatio = %s is properly set to root element",
    async (aspectRatio) => {
      const props = { aspectRatio, size: "m" };
      const { element } = await setup(props);

      expect(element).toHaveGdsSize(["box", aspectRatio, "m"]);
      let [w, h] = aspectRatio.split("x");
      if (Number(w) <= Number(h)) {
        expect(Test.screen.getByText(MOCK_DATA.description)).toBeInTheDocument();
      } else {
        expect(Test.screen.queryByText(MOCK_DATA.description)).not.toBeInTheDocument();
      }
    },
  );

  it.each(["2x3", "4x3", "3x2", "16x9", "3x4", "1x1"])(
    "checks aspectRatio = %s with size = xs or s is always shown without description",
    async (aspectRatio) => {
      const props = { aspectRatio, size: "xs" };
      const { view } = await setup(props);
      expect(Test.screen.queryByText(MOCK_DATA.description)).not.toBeInTheDocument();
      view.unmount();

      const props2 = { aspectRatio, size: "s" };
      await setup(props2);
      expect(Test.screen.queryByText(MOCK_DATA.description)).not.toBeInTheDocument();
    },
  );
});
