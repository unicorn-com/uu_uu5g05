import { Utils } from "uu5g05";

describe("[uu5g05] Utils.Element", () => {
  it.each([
    [
      "javascript:alert(123)",
      "  javascript:alert(123)",
      "javAscript:alert(123)",
      " \nja\nvasc\nript:ja\nvascript:alert(123)",
    ],
  ])("should not allow 'javascript:' hrefs for <a> and <link>: %p", (href) => {
    for (let tag of ["a", "link"]) {
      expect(Utils.Element.create(tag, { href })).toMatchObject({
        props: { href: expect.not.stringContaining(href) },
      });

      let jsx = Utils.Element.create(tag, { href: "https://google.com/" });
      expect(Utils.Element.clone(jsx, { href })).toMatchObject({
        props: { href: expect.not.stringContaining(href) },
      });
    }
  });
});
