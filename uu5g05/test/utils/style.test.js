import { Utils } from "uu5g05";

describe("[uu5g05] Utils.Style", () => {
  [
    {
      params: [{ left: 4, right: 8 }, "margin"],
      returnValue: { marginLeft: 4, marginRight: 8 },
    },
    {
      params: [{ top: "10%", left: 4, right: 8, bottom: "3em" }, "padding"],
      returnValue: { paddingTop: "10%", paddingLeft: 4, paddingRight: 8, paddingBottom: "3em" },
    },
    {
      params: [8, "margin"],
      returnValue: { margin: 8 },
    },
    {
      params: ["8em 4px", "padding"],
      returnValue: { padding: "8em 4px" },
    },
  ].forEach(({ params, returnValue }) => {
    it(`parseSpace(${JSON.stringify(params[0])}, "${params[1]}")`, () => {
      expect(returnValue).toMatchObject(Utils.Style.parseSpace(...params));
    });
  });

  [
    {
      params: [{ xs: "8px 2px", s: { left: 4, right: 8 } }, "margin"],
      returnValue: {
        margin: "8px 2px",
        "@media screen and (min-width: 481px)": {
          marginLeft: 4,
          marginRight: 8,
        },
      },
    },
    {
      params: [
        {
          s: { top: "10%", left: 4, right: 8, bottom: "3em" },
          xl: { top: "1%", left: 8, right: 16, bottom: "6em" },
        },
        "padding",
      ],
      returnValue: {
        "@media screen and (min-width: 481px)": {
          paddingTop: "10%",
          paddingLeft: 4,
          paddingRight: 8,
          paddingBottom: "3em",
        },
        "@media screen and (min-width: 1361px)": {
          paddingTop: "1%",
          paddingLeft: 8,
          paddingRight: 16,
          paddingBottom: "6em",
        },
      },
    },
    {
      params: [{ xs: 8, m: "4em 8px 5% 16px" }, "padding"],
      returnValue: {
        padding: 8,
        "@media screen and (min-width: 769px)": {
          padding: "4em 8px 5% 16px",
        },
      },
    },
  ].forEach(({ params, returnValue }) => {
    it(`parseSpace(${JSON.stringify(params[0])}, "${params[1]}")`, () => {
      expect(returnValue).toMatchObject(Utils.Style.parseSpace(...params));
    });
  });
});
