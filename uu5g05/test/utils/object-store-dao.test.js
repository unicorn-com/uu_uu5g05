/* eslint-disable no-import-assign */
import { SessionProvider, Utils } from "uu5g05";
import { omitConsoleLogs, Test, Utils as TestUtils } from "uu5g05-test";
import { AuthenticationService } from "uu_appg01_oidc";
import { dbMap as dbMapObj } from "../../src/utils/object-store-dao-in-memory.js";
import { resetMemoryFallback } from "../../src/utils/object-store-dao-with-memory-fallback.js";
import { sessionHolder } from "../../src/providers/session-provider.js";
import { resetSchemaMaxAgeCleanup } from "../../src/utils/object-store-dao.js";

// :-( no idea why Jest stores `Module` instance to dbMap when it's imported via `import { dbMap } from ".../file.js"`),
// i.e. we have to do dbMap?.dbMap
let dbMap = dbMapObj?.dbMap || dbMapObj;

omitConsoleLogs("Use Utils.Uu5ObjectStore.Dao instead");

// schema indices can be changed only by defining updateSchema({ oldVersion }) which should migrate/upgrade
// the schema/data and this all is triggerred by increasing SCHEMA_VERSION
const SCHEMA_VERSION = 1;

const JOHN = { name: "John", surname: "Doe", age: 30, address: { city: "Prague" } };
const JANE = { name: "Jane", surname: "Doe", age: 28, address: { city: "Prague" } };
const ALICE = { name: "Alice", surname: "Wonderland", age: 20, address: { city: "Prague" } };
const BOB = { name: "Bob", surname: "Doe", age: 28, address: { city: "London" } };
const JANE2 = { name: "Jane", surname: "Smith", age: 28, address: { city: "Amsterdam" } };

let testPersonDaoCtrOptions;

class TestPersonDao extends Utils.ObjectStore.Dao {
  constructor() {
    super("testPerson", { schemaVersion: SCHEMA_VERSION, ...testPersonDaoCtrOptions });
    this.createSchema = jest.fn(this.createSchema);
  }
  createSchema() {
    this.createIndex({ name: 1, surname: 1 }, { unique: true });
    this.createIndex({ age: 1 });
    this.createIndex({ "address.city": 1 });
  }
}

class TestPersonDaoV2 extends Utils.ObjectStore.Dao {
  constructor() {
    super("testPerson", { schemaVersion: SCHEMA_VERSION + 1 });
    this.createSchema = jest.fn(this.createSchema);
    this.updateSchema = jest.fn(this.updateSchema);
  }
  createSchema() {
    this.createIndex({ name: 1, age: 1 });
    this.createIndex({ age: 1 });
    this.createIndex({ "address.city": 1 });
  }
  updateSchema({ oldVersion }) {
    if (oldVersion < 2) {
      this.dropIndex({ name: 1, surname: 1 });
      this.createIndex({ name: 1, age: 1 });
    }
  }
}

class TestPersonDaoV3 extends Utils.ObjectStore.Dao {
  constructor() {
    super("testPerson", { schemaVersion: SCHEMA_VERSION + 2 });
    this.createSchema = jest.fn(this.createSchema);
    this.updateSchema = jest.fn(this.updateSchema);
  }
  createSchema() {
    this.createIndex({ surname: 1, age: 1 });
    this.createIndex({ age: 1 });
    this.createIndex({ "address.city": 1 });
  }
  updateSchema({ oldVersion }) {
    if (oldVersion < 2) {
      this.dropIndex({ name: 1, surname: 1 });
      this.createIndex({ name: 1, age: 1 });
    }
    if (oldVersion < 3) {
      this.dropIndex("name,age");
      this.createIndex({ surname: 1, age: 1 });
    }
  }
}

let daos = [];
async function setup({ daoClass = TestPersonDao, skipInsert = false } = {}) {
  let instance = new daoClass();
  let itemList = [];
  daos.push(instance);
  if (!skipInsert) {
    itemList = await instance.insertMany([JOHN, JANE, ALICE, BOB, JANE2]);
  }
  return { dao: instance, itemList };
}

async function dropDatabases() {
  let list = await indexedDB.databases();
  let dbNames = new Set(list.map((it) => it.name).filter(Boolean));
  for (let dbName of dbNames) {
    await new Promise((resolve, reject) => {
      let request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = resolve;
      request.onerror = resolve;
    });
  }
}

afterEach(async () => {
  await Promise.all(daos.map((dao) => dao.closeDB()));
  daos = [];
  resetSchemaMaxAgeCleanup();
  sessionHolder.session = undefined;

  await dropDatabases();
});

function runTests({ skipUpgrades, skipSchemaMaxAge, listDatabases } = {}) {
  listDatabases ??= () => indexedDB.databases();

  it("constructor(schemaName)", async () => {
    let { dao } = await setup({ skipInsert: true });
    // not yet initialized (as we did no operation)
    await TestUtils.wait(100);
    let dbList = await listDatabases();
    expect(dbList.map((it) => it.name)).not.toContain("#testPerson");

    // initialize by doing any operation
    await dao.getIndexes();
    dbList = await listDatabases();
    expect(dbList.map((it) => it.name)).toContain("#testPerson");
  });

  it("dropSchema()", async () => {
    let { dao } = await setup();
    await Test.waitFor(async () => {
      expect((await listDatabases()).map((it) => it.name)).toContain("#testPerson");
    });

    let result = await dao.dropSchema();
    expect(result).toBe(undefined);
    expect((await listDatabases()).map((it) => it.name)).not.toContain("#testPerson");
  });

  it("createSchema() should be called when accessing DB", async () => {
    let { dao } = await setup();
    expect(dao.createSchema).toHaveBeenCalledTimes(1);
    expect(dao.createSchema).lastCalledWith();
  });

  it("createSchema() should be called when accessing DB (even if schema version is > 1)", async () => {
    let { dao } = await setup({ daoClass: TestPersonDaoV3 });
    expect(dao.createSchema).toHaveBeenCalledTimes(1);
    expect(dao.createSchema).lastCalledWith();
    expect(dao.updateSchema).toHaveBeenCalledTimes(0);
  });

  if (!skipUpgrades) {
    it("updateSchema() (+createIndex(), dropIndex(), closeDB()) should be called when accessing DB with newer schema version (v1 -> v2 -> v3)", async () => {
      let { dao: daoV1 } = await setup();
      expect(daoV1.createSchema).toHaveBeenCalledTimes(1);
      expect(daoV1.createSchema).lastCalledWith();
      expect((await daoV1.getIndexes())?.itemList?.map((it) => it?.name)).toEqual([
        "address.city",
        "age",
        "name,surname",
      ]);
      await daoV1.closeDB();

      let { dao: daoV2 } = await setup({ daoClass: TestPersonDaoV2 });
      expect(daoV2.createSchema).toHaveBeenCalledTimes(0);
      expect(daoV2.updateSchema).toHaveBeenCalledTimes(1);
      expect(daoV2.updateSchema).lastCalledWith({ oldVersion: 1 });
      expect((await daoV2.getIndexes())?.itemList?.map((it) => it?.name)).toEqual(["address.city", "age", "name,age"]);
      await daoV2.closeDB();

      let { dao: daoV3 } = await setup({ daoClass: TestPersonDaoV3 });
      expect(daoV3.createSchema).toHaveBeenCalledTimes(0);
      expect(daoV3.updateSchema).toHaveBeenCalledTimes(1);
      expect(daoV3.updateSchema).lastCalledWith({ oldVersion: 2 });
      expect((await daoV3.getIndexes())?.itemList?.map((it) => it?.name)).toEqual([
        "address.city",
        "age",
        "surname,age",
      ]);
      await daoV3.closeDB();
    });

    it("updateSchema() should be called when accessing DB with newer schema version (v1 -> v3)", async () => {
      let { dao: daoV1 } = await setup();
      expect(daoV1.createSchema).toHaveBeenCalledTimes(1);
      expect(daoV1.createSchema).lastCalledWith();
      await daoV1.closeDB();

      // upgrade from v1 directly to v3
      let { dao: daoV3 } = await setup({ daoClass: TestPersonDaoV3 });
      expect(daoV3.createSchema).toHaveBeenCalledTimes(0);
      expect(daoV3.updateSchema).toHaveBeenCalledTimes(1);
      expect(daoV3.updateSchema).lastCalledWith({ oldVersion: 1 });
      await daoV3.closeDB();
    });

    it("closeDB() on old version DAO should be called automatically if creating same DAO with newer schema version (v1 -> v3)", async () => {
      let { dao: daoV1 } = await setup();
      expect(daoV1.createSchema).toHaveBeenCalledTimes(1);
      expect(daoV1.createSchema).lastCalledWith();

      // daoV1 must be auto-closed (must react to "versionchange" event) to not block newer schema version (daoV3)
      // (i.e. this test shouldn't time out)
      let { dao: daoV3 } = await setup({ daoClass: TestPersonDaoV3 });
      expect(daoV3.createSchema).toHaveBeenCalledTimes(0);
    });

    it("updateSchema() is allowed to be async for data migration", async () => {
      let { dao: daoV1 } = await setup();
      await daoV1.closeDB();

      // upgrade from v1 directly to v3
      class TestPersonDaoAsyncUpdate extends Utils.ObjectStore.Dao {
        constructor() {
          super("testPerson", { schemaVersion: SCHEMA_VERSION + 3 });
        }
        async createSchema() {
          this.createIndex({ age: 1 });
          this.createIndex({ name: 1 });
        }
        async updateSchema({ oldVersion }) {
          this.dropIndex({ name: 1, surname: 1 });
          let { itemList } = await this.find();
          let promises = itemList.map((item) =>
            this.findOneAndUpdate({ id: item.id }, { ...item, name: "A" + item.name }),
          );
          await Promise.all(promises);
          this.createIndex({ name: 1 });
        }
      }
      let { dao: daoV3 } = await setup({ daoClass: TestPersonDaoAsyncUpdate, skipInsert: true });
      expect(await daoV3.findOne({ name: "AJohn" })).toBeTruthy();
      await daoV3.closeDB();
    });
  }

  it("getIndexes()", async () => {
    let { dao } = await setup();
    expect(await dao.getIndexes()).toEqual({
      itemList: [
        { name: "address.city", key: { "address.city": 1 }, unique: false },
        { name: "age", key: { age: 1 }, unique: false },
        { name: "name,surname", key: { name: 1, surname: 1 }, unique: true },
      ],
    });
  });

  it("findOne()", async () => {
    let { dao } = await setup();

    let result = await dao.findOne({ surname: "Wonderland", name: "Alice" });
    expect(result).toEqual({ ...ALICE, id: expect.any(Number), sys: expect.any(Object) });

    result = await dao.findOne({ surname: "Borderland", name: "Malice" });
    expect(result).toEqual(null);

    result = await dao.findOne({ "address.city": "Prague" });
    expect(result).toEqual({ ...JOHN, id: expect.any(Number), sys: expect.any(Object) });

    // finding by using index spanning more fields than given
    result = await dao.findOne({ name: "Jane" }); // can use index { name: 1, surname: 1 }
    expect(result).toEqual({ ...JANE, id: expect.any(Number), sys: expect.any(Object) });

    // finding without suitable index is not supported
    let rejection = expect(async () => dao.findOne({ surname: "Doe" })).rejects; // unable to use index { name: 1, surname: 1 }
    await rejection.toThrow(Utils.ObjectStore.Error.InvalidCall);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"surname":1}') } }); // error contains suggested index name
  });

  it("find(query)", async () => {
    let { dao } = await setup();

    let result = await dao.find({ surname: "Wonderland", name: "Alice" });
    expect(result).toEqual({
      itemList: [{ ...ALICE, id: expect.any(Number), sys: expect.any(Object) }],
      pageInfo: { pageIndex: 0, pageSize: 1000, total: 1 },
    });

    result = await dao.find({ surname: "Borderland", name: "Malice" });
    expect(result).toEqual({ itemList: [], pageInfo: { pageIndex: 0, pageSize: 1000, total: 0 } });

    // finding by using index spanning more fields than given
    result = await dao.find({ name: "Jane" }); // can use index { name: 1, surname: 1 }
    expect(result).toEqual({
      itemList: [
        { ...JANE, id: expect.any(Number), sys: expect.any(Object) },
        { ...JANE2, id: expect.any(Number), sys: expect.any(Object) },
      ],
      pageInfo: { pageIndex: 0, pageSize: 1000, total: 2 },
    });

    result = await dao.find({ "address.city": "Prague" });
    expect(result).toEqual({
      itemList: [
        { ...JOHN, id: expect.any(Number), sys: expect.any(Object) },
        { ...JANE, id: expect.any(Number), sys: expect.any(Object) },
        { ...ALICE, id: expect.any(Number), sys: expect.any(Object) },
      ],
      pageInfo: { pageIndex: 0, pageSize: 1000, total: 3 },
    });

    // nested field must use dot notation (otherwise it should do lookup of "address" field which equals { city: "Prague" }
    // but that isn't supported either because objects are not indexable)
    let rejection = expect(async () => await dao.find({ address: { city: "Prague" } })).rejects;
    await rejection.toThrow(Utils.ObjectStore.Error.InvalidCall);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"address":1}') } }); // error contains suggested index name

    // finding without suitable index is not supported
    rejection = expect(async () => dao.find({ surname: "Doe" })).rejects; // unable to use index { name: 1, surname: 1 }
    await rejection.toThrow(Utils.ObjectStore.Error.InvalidCall);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"surname":1}') } }); // error contains suggested index name
  });

  it("find(query, pageInfo)", async () => {
    let { dao } = await setup();
    let result = await dao.find({ name: "Alice", surname: "Wonderland" }, { pageIndex: 1, pageSize: 2 });
    expect(result).toEqual({
      itemList: [],
      pageInfo: { pageIndex: 1, pageSize: 2, total: 1 },
    });

    result = await dao.find({ name: "Jane" }, { pageIndex: 1, pageSize: 1 }); // can use index { name: 1, surname: 1 }
    expect(result).toEqual({
      itemList: [{ ...JANE2, id: expect.any(Number), sys: expect.any(Object) }],
      pageInfo: { pageIndex: 1, pageSize: 1, total: 2 },
    });

    result = await dao.find({ "address.city": "Prague" }, { pageIndex: 1, pageSize: 2 });
    expect(result).toEqual({
      itemList: [{ ...ALICE, id: expect.any(Number), sys: expect.any(Object) }],
      pageInfo: { pageIndex: 1, pageSize: 2, total: 3 },
    });
  });

  it("findOneAndUpdate()", async () => {
    let {
      dao,
      itemList: [john, jane, alice, bob],
    } = await setup();
    await TestUtils.wait(2); // so that updates will have different mts than cts

    let result = await dao.findOneAndUpdate(
      { surname: "Wonderland", name: "Alice" },
      { ...alice, name: "Malice", surname: "Borderland" },
    );
    expect(result).toEqual({
      ...alice,
      name: "Malice",
      surname: "Borderland",
      id: alice.id,
      sys: { cts: alice.sys.cts, mts: expect.any(Date), rev: alice.sys.rev + 1 },
    });
    expect(result.sys.mts.getTime()).toBeGreaterThan(result.sys.cts.getTime());

    // not finding should throw
    let rejection = expect(async () => dao.findOneAndUpdate({ surname: "Worderland", name: "Alice" }, alice)).rejects;
    await rejection.toThrow(Utils.ObjectStore.Error.ObjectNotFound);
    await rejection.toMatchObject({ paramMap: { filter: { surname: "Worderland", name: "Alice" } } });

    // should really change just one item
    result = await dao.findOneAndUpdate({ "address.city": "Prague" }, { name: "Johnny", sys: { rev: 0 } });
    expect(result).toEqual({ ...JOHN, name: "Johnny", id: john.id, sys: expect.any(Object) });
    expect(await dao.findOne({ id: jane.id })).toMatchObject({ name: "Jane" }); // did not change into "Johnny"

    // should throw if missing revision
    rejection = expect(async () => dao.findOneAndUpdate({ "address.city": "Prague" }, { name: "Johnny" })).rejects;
    await rejection.toThrow(Utils.ObjectStore.Error.MissingRevision);

    // should throw if mismatched revision
    rejection = expect(async () => dao.findOneAndUpdate({ name: "Bob" }, { name: "Bobby", sys: { rev: 10 } })).rejects;
    await rejection.toThrow(Utils.ObjectStore.Error.InvalidRevision);

    // should be fine even with mismatched revision if not using REVISION strategy
    result = await dao.findOneAndUpdate({ name: "Bob" }, { name: "Bobby", sys: { rev: 10 } }, null);
    expect(result).toEqual({
      ...BOB,
      name: "Bobby",
      id: bob.id,
      sys: { cts: bob.sys.cts, mts: expect.any(Date), rev: 1 }, // final revision is based always on what was in DB, not what developer sent
    });

    // finding without suitable index is not supported
    rejection = expect(async () => dao.findOneAndUpdate({ surname: "Doe" }, john)).rejects; // unable to use index { name: 1, surname: 1 }
    await rejection.toThrow(Utils.ObjectStore.Error.InvalidCall);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"surname":1}') } }); // error contains suggested index name
  });

  it("count()", async () => {
    let { dao } = await setup();
    let result = await dao.count();
    expect(result).toEqual(5);

    result = await dao.count({ age: 28 });
    expect(result).toEqual(3);

    // finding by using index spanning more fields than given
    result = await dao.count({ name: "Jane" }); // can use index { name: 1, surname: 1 }
    expect(result).toEqual(2);

    // finding without (exact) index is not supported
    let rejection = expect(async () => dao.find({ surname: "Doe" })).rejects; // unable to use index { name: 1, surname: 1 }
    await rejection.toThrow(Utils.ObjectStore.Error.InvalidCall);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"surname":1}') } }); // error contains suggested index name
  });

  it("insertOne()", async () => {
    let { dao } = await setup({ skipInsert: true });

    let result = await dao.insertOne({ name: "Foo", surname: "Bar", age: 80 });
    let now = Date.now();
    expect(result).toEqual({
      name: "Foo",
      surname: "Bar",
      age: 80,
      id: expect.any(Number),
      sys: { cts: expect.any(Date), mts: expect.any(Date), rev: 0 },
    });
    expect(result.sys.cts).toEqual(result.sys.mts);
    expect(result.sys.cts.getTime()).toBeLessThanOrEqual(now);
    expect(result.sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);

    // "sys" field should be entirely replaced
    result = await dao.insertOne({ name: "Foo", surname: "Bar2", age: 80, sys: { foo: "bar", rev: 10, cts: 123 } });
    now = Date.now();
    expect(result?.sys).toEqual({ cts: expect.any(Date), mts: expect.any(Date), rev: 0 });
    expect(result.sys.cts).toEqual(result.sys.mts);
    expect(result.sys.cts.getTime()).toBeLessThanOrEqual(now);
    expect(result.sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);

    // inserting while already having ID should throw error
    await expect(async () => dao.insertOne({ ...result, age: 81 })).rejects.toThrow(
      Utils.ObjectStore.Error.DuplicateKey,
    );
  });

  it("insertOrUpdateOne()", async () => {
    let { dao } = await setup();

    let result = await dao.insertOrUpdateOne({ name: "Foo", surname: "Bar" }, { name: "Foo", surname: "Bar", age: 80 });
    let now = Date.now();
    expect(result).toEqual({
      name: "Foo",
      surname: "Bar",
      age: 80,
      id: expect.any(Number),
      sys: { cts: expect.any(Date), mts: expect.any(Date), rev: 0 },
    });
    expect(result.sys.cts).toEqual(result.sys.mts);
    expect(result.sys.cts.getTime()).toBeLessThanOrEqual(now);
    expect(result.sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);
    let firstItem = result;

    await TestUtils.wait(2);
    result = await dao.insertOrUpdateOne({ name: "Foo", surname: "Bar" }, { name: "Foo", surname: "Bar", age: 70 });
    now = Date.now();
    expect(result).toEqual({
      name: "Foo",
      surname: "Bar",
      age: 70,
      id: firstItem.id,
      sys: { cts: firstItem.sys.cts, mts: expect.any(Date), rev: 1 },
    });
    expect(result.sys.cts.getTime()).toBeLessThan(result.sys.mts.getTime());
    let secondItem = result;

    await TestUtils.wait(2);
    result = await dao.insertOrUpdateOne({ id: secondItem.id }, { ...secondItem, name: "Foo2", surname: "Bar2" });
    now = Date.now();
    expect(result).toEqual({
      name: "Foo2",
      surname: "Bar2",
      age: 70,
      id: secondItem.id,
      sys: { cts: secondItem.sys.cts, mts: expect.any(Date), rev: 2 },
    });
    let thirdItem = result;

    await TestUtils.wait(2);
    expect(async () =>
      dao.insertOrUpdateOne({ id: thirdItem.id }, { ...thirdItem, name: JANE.name, surname: JANE.surname }),
    ).rejects.toThrow(Utils.ObjectStore.Error.DuplicateKey);
  });

  it("insertMany()", async () => {
    let { dao } = await setup({ skipInsert: true });

    let result = await dao.insertMany([
      { name: "Foo", surname: "Bar", age: 80 },
      { name: "Foo2", surname: "Bar2", age: 70 },
    ]);
    let now = Date.now();
    expect(result).toEqual([
      {
        name: "Foo",
        surname: "Bar",
        age: 80,
        id: expect.any(Number),
        sys: { cts: expect.any(Date), mts: expect.any(Date), rev: 0 },
      },
      {
        name: "Foo2",
        surname: "Bar2",
        age: 70,
        id: expect.any(Number),
        sys: { cts: expect.any(Date), mts: expect.any(Date), rev: 0 },
      },
    ]);
    for (let i = 0; i < 2; i++) {
      expect(result[i].sys.cts).toEqual(result[i].sys.mts);
      expect(result[i].sys.cts.getTime()).toBeLessThanOrEqual(now);
      expect(result[i].sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);
    }

    // empty list
    result = await dao.insertMany([]);
    expect(result).toEqual([]);

    // "sys" field should be entirely replaced
    result = await dao.insertMany([{ name: "Foo3", surname: "Bar3", age: 80, sys: { foo: "bar", rev: 10, cts: 123 } }]);
    now = Date.now();
    expect(result?.[0]?.sys).toEqual({ cts: expect.any(Date), mts: expect.any(Date), rev: 0 });
    expect(result[0].sys.cts).toEqual(result[0].sys.mts);
    expect(result[0].sys.cts.getTime()).toBeLessThanOrEqual(now);
    expect(result[0].sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);

    // inserting while already having ID should throw error
    await expect(async () => dao.insertMany([JANE2, { ...result[0], age: 81 }])).rejects.toThrow(
      Utils.ObjectStore.Error.DuplicateKey,
    );
    expect(await dao.count()).toBe(3); // nothing should have been inserted due to failure

    // inserting while breaking a unique index should throw error
    await expect(async () => dao.insertMany([JANE2, ALICE, JANE2])).rejects.toThrow(
      Utils.ObjectStore.Error.DuplicateKey,
    );
    expect(await dao.count()).toBe(3); // nothing should have been inserted due to failure
  });

  it("deleteOne()", async () => {
    let { dao } = await setup({ skipInsert: true });

    let [john, jane, bob, jane2] = await dao.insertMany([JOHN, JANE, BOB, JANE2]);
    let result = await dao.deleteOne({ id: jane.id });
    expect(result).toBe(undefined);
    expect(await dao.findOne({ id: jane.id })).toBe(null);
    expect(await dao.count()).toBe(3);

    result = await dao.deleteOne({ age: bob.age }); // Bob & Jane2 have the same age
    expect(result).toBe(undefined);
    expect(await dao.findOne({ id: bob.id })).toBe(null);
    expect(await dao.findOne({ id: jane2.id })).toBeTruthy();
    expect(await dao.count()).toBe(2);

    // deleting non-existing item is no-op
    result = await dao.deleteOne({ name: "Foo" });
    expect(result).toBe(undefined);
    expect(await dao.count()).toBe(2);

    // delete arbitrary one (1st in index)
    result = await dao.deleteOne({});
    expect(result).toBe(undefined);
    expect(await dao.findOne({ id: john.id })).toBe(null);
  });

  it("deleteMany()", async () => {
    let { dao } = await setup({ skipInsert: true });

    let [, jane, , bob, jane2] = await dao.insertMany([
      JOHN,
      JANE,
      ALICE,
      BOB,
      JANE2,
      { ...BOB, name: "Bob2", age: 10 },
    ]);
    let result = await dao.deleteMany({ id: jane.id });
    expect(result).toBe(undefined);
    expect(await dao.findOne({ id: jane.id })).toBe(null);

    result = await dao.deleteMany({ age: bob.age }); // Bob & Jane2 have the same age
    expect(result).toBe(undefined);
    expect(await dao.findOne({ id: bob.id })).toBe(null);
    expect(await dao.findOne({ id: jane2.id })).toBe(null);

    // deleting non-existing item is no-op
    result = await dao.deleteMany({ name: "Foo" });
    expect(result).toBe(undefined);
    expect(await dao.count()).toBe(3); // john, alice, bob2

    // delete all remaining ones
    result = await dao.deleteMany({});
    expect(result).toBe(undefined);
    expect(await dao.count()).toBe(0);
  });

  it("should use separate dbs based on session uuIdentity", async () => {
    let { dao } = await setup();
    expect(await dao.count()).toEqual(5);

    Test.render(<SessionProvider authenticationService={AuthenticationService}></SessionProvider>);
    expect(await dao.count()).toEqual(0);
  });

  if (!skipSchemaMaxAge) {
    it("should cleanup schema based on schemaMaxAge", async () => {
      const MAX_AGE = 200;
      class TestDao extends Utils.ObjectStore.Dao {
        constructor() {
          super("expireDao", { schemaMaxAge: MAX_AGE });
        }
      }
      let { dao } = await setup({ daoClass: TestDao });
      expect(await dao.count()).toEqual(5);

      // try to do something with other DAO after a while (which should do cleanup check and delete the first DAO)
      await TestUtils.wait(MAX_AGE);
      resetSchemaMaxAgeCleanup();
      await setup();
      await Test.waitFor(async () => {
        let dbList = await listDatabases();
        expect(dbList.map((it) => it.name)).not.toContain("#expireDao");
      });
    });
  }
}

describe("[uu5g05] Utils.ObjectStore.Dao", () => {
  runTests();
});

describe("[uu5g05] Utils.ObjectStore.Dao, falling back to memory (indexedDB unavailable)", () => {
  let origOpen = indexedDB.open;
  beforeEach(() => {
    indexedDB.open = () => {
      throw new DOMException("Test.", "UnknownError");
    };

    resetMemoryFallback();
    for (let k in dbMap) delete dbMap[k];
    omitConsoleLogs(/Access to indexedDB storage is denied/);
  });
  afterEach(() => {
    indexedDB.open = origOpen;
  });

  runTests({
    skipUpgrades: true,
    skipSchemaMaxAge: true,
    listDatabases: () => Object.keys(dbMap).map((it) => ({ name: it })),
  });
});

describe("[uu5g05] Utils.ObjectStore.Dao, persist=false", () => {
  beforeEach(() => {
    testPersonDaoCtrOptions = { persist: false };
    resetMemoryFallback();
    for (let k in dbMap) delete dbMap[k];
  });
  afterEach(() => {
    testPersonDaoCtrOptions = undefined;
  });

  runTests({
    skipUpgrades: true,
    skipSchemaMaxAge: true,
    listDatabases: () => Object.keys(dbMap).map((it) => ({ name: it })),
  });
});
