import Uu5, { Utils } from "uu5g05";
import { omitConsoleLogs } from "uu5g05-test";

const memo = Utils.Component.memo(() => {});

beforeEach(() => {
  omitConsoleLogs(`This class is deprecated. Use Utils.Uu5ObjectStore.Dao instead.`);
});

describe(`Uu5`, () => {
  it("exported API", async () => {
    let apiMap = {};
    addKeys(Uu5, apiMap);
    expect(apiMap).toMatchSnapshot();
  });
});

function addKeys(obj, result, filter = (key, obj, prefix) => true, prefix = "", addedSet = new Set()) {
  if (prefix) result[prefix] = typeof obj;
  if (!obj || (typeof obj !== "object" && typeof obj !== "function")) return;
  if (addedSet.has(obj)) return;
  addedSet.add(obj);
  for (let k of Object.getOwnPropertyNames(obj)) {
    if (/^_/.test(k)) continue;
    if (
      /^(defaultProps|displayName|isStateless|isUu5PureComponent|length|logger|name|nestingLevel|propTypes|prototype|uu5ComponentType|uu5Tag|getDerivedStateFromError|getDerivedStateFromProps)$/.test(
        k,
      )
    ) {
      continue;
    }
    if (obj.$$typeof === memo.$$typeof && k in memo) continue;
    if (!filter(k, obj, prefix)) continue;
    let childFilter;
    if (/^[a-z]/.test(k) || /^[A-Z_0-9]+$/.test(k)) childFilter = () => false;
    else if (/^[A-Z]/.test(k)) childFilter = (k, obj) => k in obj;
    else continue;
    addKeys(obj[k], result, childFilter, prefix ? prefix + "." + k : k, addedSet);
  }
}
