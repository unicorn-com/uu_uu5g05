import Context from "../utils/context.js";

const [SelectionContext, useSelectionContext] = Context.create({
  value: 1,
  count: 1,
});

export { SelectionContext, useSelectionContext };
export default SelectionContext;
