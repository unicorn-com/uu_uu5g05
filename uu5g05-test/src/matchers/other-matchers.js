expect.extend({
  toBeCollapsed(element) {
    const style = window.getComputedStyle(element);
    const height = style.getPropertyValue("height");

    if (height === "0px") {
      return { message: () => `expected height not to be 0px`, pass: true };
    } else {
      return { message: () => `expected height to be 0px but received "${height}"`, pass: false };
    }
  },
});
