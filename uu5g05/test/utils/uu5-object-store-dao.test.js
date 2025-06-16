/* eslint-disable no-import-assign */
import { SessionProvider, Utils } from "uu5g05";
import { omitConsoleLogs, Test, Utils as TestUtils } from "uu5g05-test";
import { AuthenticationService } from "uu_appg01_oidc";
import { dbMap as dbMapObj } from "../../src/utils/uu5-object-store-dao-in-memory.js";
import { resetMemoryFallback } from "../../src/utils/uu5-object-store-dao-with-memory-fallback.js";
import { sessionHolder } from "../../src/providers/session-provider.js";
import { resetSchemaMaxAgeCleanup } from "../../src/utils/uu5-object-store-dao.js";

// :-( no idea why Jest stores `Module` instance to dbMap when it's imported via `import { dbMap } from ".../file.js"`),
// i.e. we have to do dbMap?.dbMap
let dbMap = dbMapObj?.dbMap || dbMapObj;

// schema indices can be changed only by defining upgradeSchema({ oldVersion }) which should migrate/upgrade
// the schema/data and this all is triggerred by increasing SCHEMA_VERSION
const SCHEMA_VERSION = 1;

const JOHN = { name: "John", surname: "Doe", age: 30, address: { city: "Prague" } };
const JANE = { name: "Jane", surname: "Doe", age: 28, address: { city: "Prague" } };
const ALICE = { name: "Alice", surname: "Wonderland", age: 20, address: { city: "Prague" } };
const BOB = { name: "Bob", surname: "Doe", age: 28, address: { city: "London" } };
const JANE2 = { name: "Jane", surname: "Smith", age: 28, address: { city: "Amsterdam" } };

let testPersonDaoCtrOptions;

class TestPersonDao extends Utils.Uu5ObjectStore.Dao {
  constructor() {
    super("testPerson", { schemaVersion: SCHEMA_VERSION, ...testPersonDaoCtrOptions });
    this.createSchema = jest.fn(this.createSchema);
  }
  createSchema() {
    this._createUniqueIndex({ name: 1, surname: 1 });
    this._createIndex({ age: 1 });
    this._createIndex({ "address.city": 1 });
  }
  customGetByOid(oid) {
    return this.get(oid);
  }
}

class TestPersonDaoV2 extends Utils.Uu5ObjectStore.Dao {
  constructor() {
    super("testPerson", { schemaVersion: SCHEMA_VERSION + 1 });
    this.createSchema = jest.fn(this.createSchema);
    this.upgradeSchema = jest.fn(this.upgradeSchema);
  }
  createSchema() {
    this._createIndex({ name: 1, age: 1 });
    this._createIndex({ age: 1 });
    this._createIndex({ "address.city": 1 });
    this._createUniqueIndex({ oid: 1 }); // should be ignored
  }
  upgradeSchema({ oldVersion }) {
    if (oldVersion < 2) {
      this._dropIndex({ name: 1, surname: 1 });
      this._createIndex({ name: 1, age: 1 });
    }
  }
}

class TestPersonDaoV3 extends Utils.Uu5ObjectStore.Dao {
  constructor() {
    super("testPerson", { schemaVersion: SCHEMA_VERSION + 2 });
    this.createSchema = jest.fn(this.createSchema);
    this.upgradeSchema = jest.fn(this.upgradeSchema);
  }
  createSchema() {
    this._createIndex({ surname: 1, age: 1 });
    this._createIndex({ age: 1 });
    this._createIndex({ "address.city": 1 });
  }
  upgradeSchema({ oldVersion }) {
    if (oldVersion < 2) {
      this._dropIndex({ name: 1, surname: 1 });
      this._createIndex({ name: 1, age: 1 });
    }
    if (oldVersion < 3) {
      this._dropIndex({ name: 1, age: 1 });
      this._createIndex({ surname: 1, age: 1 });
      this._dropIndex({ oid: 1 }); // should be ignored
    }
  }
}

let daos = [];
async function setup({ daoClass = TestPersonDao, skipInsert = false } = {}) {
  let instance = new daoClass();
  let itemList = [];
  daos.push(instance);
  if (!skipInsert) {
    itemList = await instance.createMany([JOHN, JANE, ALICE, BOB, JANE2]);
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
  await Promise.all(daos.map((dao) => dao.close()));
  daos = [];
  resetSchemaMaxAgeCleanup();
  sessionHolder.session = undefined;

  await dropDatabases();
});

function runTests({ skipUpgrades, skipSchemaMaxAge, skipCloseCheck, listDatabases, getIndexInfo } = {}) {
  listDatabases ??= () => indexedDB.databases();
  getIndexInfo ??= async (dao) => {
    let transaction = await (await dao._internalOpen()).transaction(dao.getSchemaName(), "readonly");
    /** @type {IDBObjectStore} */
    let objectStore = transaction.objectStore(dao.getSchemaName());
    let indexNames = [...objectStore.indexNames];
    return indexNames.map((name) => ({ name, unique: objectStore.index(name).unique }));
  };
  let getDb = async (dao) => {
    return await dao._internalOpen();
  };

  it("constructor()", async () => {
    let { dao } = await setup({ skipInsert: true });
    // not yet initialized (as we did no operation)
    await TestUtils.wait(100);
    let dbList = await listDatabases();
    expect(dbList.map((it) => it.name)).not.toContain("#testPerson");

    // initialize by doing any operation
    await dao.list();
    dbList = await listDatabases();
    expect(dbList.map((it) => it.name)).toContain("#testPerson");
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
    expect(dao.upgradeSchema).toHaveBeenCalledTimes(0);
  });

  if (!skipUpgrades) {
    it("upgradeSchema() (with _createIndex(), _createUniqueIndex, _dropIndex(), close()) should be called when accessing DB with newer schema version (v1 -> v2 -> v3)", async () => {
      let { dao: daoV1 } = await setup();
      expect(daoV1.createSchema).toHaveBeenCalledTimes(1);
      expect(daoV1.createSchema).lastCalledWith();
      expect(await getIndexInfo(daoV1)).toEqual([
        { name: "address.city", unique: false },
        { name: "age", unique: false },
        { name: "name,surname", unique: true },
      ]);
      await daoV1.close();

      let { dao: daoV2 } = await setup({ daoClass: TestPersonDaoV2 });
      expect(daoV2.createSchema).toHaveBeenCalledTimes(0);
      expect(daoV2.upgradeSchema).toHaveBeenCalledTimes(1);
      expect(daoV2.upgradeSchema).lastCalledWith({ oldVersion: 1 });
      expect(await getIndexInfo(daoV2)).toEqual([
        { name: "address.city", unique: false },
        { name: "age", unique: false },
        { name: "name,age", unique: false },
      ]);
      await daoV2.close();

      let { dao: daoV3 } = await setup({ daoClass: TestPersonDaoV3 });
      expect(daoV3.createSchema).toHaveBeenCalledTimes(0);
      expect(daoV3.upgradeSchema).toHaveBeenCalledTimes(1);
      expect(daoV3.upgradeSchema).lastCalledWith({ oldVersion: 2 });
      expect(await getIndexInfo(daoV3)).toEqual([
        { name: "address.city", unique: false },
        { name: "age", unique: false },
        { name: "surname,age", unique: false },
      ]);
      await daoV3.close();
    });

    it("upgradeSchema() should be called when accessing DB with newer schema version (v1 -> v3)", async () => {
      let { dao: daoV1 } = await setup();
      expect(daoV1.createSchema).toHaveBeenCalledTimes(1);
      expect(daoV1.createSchema).lastCalledWith();
      await daoV1.close();

      // upgrade from v1 directly to v3
      let { dao: daoV3 } = await setup({ daoClass: TestPersonDaoV3 });
      expect(daoV3.createSchema).toHaveBeenCalledTimes(0);
      expect(daoV3.upgradeSchema).toHaveBeenCalledTimes(1);
      expect(daoV3.upgradeSchema).lastCalledWith({ oldVersion: 1 });
      await daoV3.close();
    });

    it("upgradeSchema() should be preceded by close() on old version DAO (if it's opened) if creating same DAO with newer schema version (v1 -> v3)", async () => {
      let { dao: daoV1 } = await setup();
      expect(daoV1.createSchema).toHaveBeenCalledTimes(1);
      expect(daoV1.createSchema).lastCalledWith();

      // daoV1 must be auto-closed (must react to "versionchange" event) to not block newer schema version (daoV3)
      // (i.e. this test shouldn't time out)
      let { dao: daoV3 } = await setup({ daoClass: TestPersonDaoV3 });
      expect(daoV3.createSchema).toHaveBeenCalledTimes(0);
    });

    it("upgradeSchema() is allowed to be async for data migration", async () => {
      let { dao: daoV1 } = await setup();
      await daoV1.close();

      // upgrade from v1 directly to v3
      class TestPersonDaoAsyncUpdate extends Utils.Uu5ObjectStore.Dao {
        constructor() {
          super("testPerson", { schemaVersion: SCHEMA_VERSION + 3 });
        }
        async createSchema() {
          this._createIndex({ age: 1 });
          this._createIndex({ name: 1 });
        }
        async upgradeSchema({ oldVersion }) {
          this._dropIndex({ name: 1, surname: 1 });
          let itemList = [...(await this.list())];
          let promises = itemList.map((item) => this.update({ ...item, name: "A" + item.name }));
          await Promise.all(promises);
          this._createIndex({ name: 1 });
        }
      }
      let { dao: daoV3 } = await setup({ daoClass: TestPersonDaoAsyncUpdate, skipInsert: true });
      expect(await daoV3._findOne({ name: "AJohn" })).toBeTruthy();
      await daoV3.close();
    });
  }

  it("dropSchema()", async () => {
    let { dao } = await setup();
    await Test.waitFor(async () => {
      expect((await listDatabases()).map((it) => it.name)).toContain("#testPerson");
    });

    let result = await dao.dropSchema();
    expect(result).toBe(undefined);
    expect((await listDatabases()).map((it) => it.name)).not.toContain("#testPerson");
  });

  it("close()", async () => {
    let { dao: daoV1 } = await setup();
    expect(daoV1.createSchema).toHaveBeenCalledTimes(1);
    expect(daoV1.createSchema).lastCalledWith();
    let db = await getDb(daoV1);
    await daoV1.close();

    if (!skipCloseCheck) {
      // if db is really closed, it shouldn't trigger "versionchange" event when we try to upgrade schema using newer version (daoV3)
      // (i.e. this test shouldn't time out)
      let fail;
      let origOnVersionChange = db.onversionchange;
      db.onversionchange = function (...args) {
        fail = true;
        return origOnVersionChange.apply(this, args);
      };
      await setup({ daoClass: TestPersonDaoV3 });
      expect(fail).toBeFalsy();
    }
  });

  it("getSchemaName()", async () => {
    let { dao } = await setup();
    expect(dao.getSchemaName()).toEqual("testPerson");
  });

  it("create()", async () => {
    let { dao } = await setup({ skipInsert: true });

    let result = await dao.create({ name: "Foo", surname: "Bar", age: 80 });
    let now = Date.now();
    expect(result).toEqual({
      name: "Foo",
      surname: "Bar",
      age: 80,
      id: expect.any(Number),
      oid: expect.any(String),
      sys: { cts: expect.any(Date), mts: expect.any(Date), rev: 0 },
    });
    expect(result.sys.cts).toEqual(result.sys.mts);
    expect(result.sys.cts.getTime()).toBeLessThanOrEqual(now);
    expect(result.sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);

    // "sys" field should be entirely replaced
    result = await dao.create({ name: "Foo", surname: "Bar2", age: 80, sys: { foo: "bar", rev: 10, cts: 123 } });
    now = Date.now();
    expect(result?.sys).toEqual({ cts: expect.any(Date), mts: expect.any(Date), rev: 0 });
    expect(result.sys.cts).toEqual(result.sys.mts);
    expect(result.sys.cts.getTime()).toBeLessThanOrEqual(now);
    expect(result.sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);

    // inserting while already having ID / OID should throw error
    await expect(async () => dao.create({ ...result, age: 81 })).rejects.toThrow(
      Utils.Uu5ObjectStore.Errors.NotUniqueError,
    );
    await expect(async () => dao.create({ id: result.id, ...JOHN })).rejects.toThrow(
      Utils.Uu5ObjectStore.Errors.NotUniqueError,
    );
    await expect(async () => dao.create({ oid: result.oid, ...JOHN })).rejects.toThrow(
      Utils.Uu5ObjectStore.Errors.NotUniqueError,
    );
  });

  it("createMany()", async () => {
    let { dao } = await setup({ skipInsert: true });

    let result = await dao.createMany([
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
        oid: expect.any(String),
        sys: { cts: expect.any(Date), mts: expect.any(Date), rev: 0 },
      },
      {
        name: "Foo2",
        surname: "Bar2",
        age: 70,
        id: expect.any(Number),
        oid: expect.any(String),
        sys: { cts: expect.any(Date), mts: expect.any(Date), rev: 0 },
      },
    ]);
    for (let i = 0; i < 2; i++) {
      expect(result[i].sys.cts).toEqual(result[i].sys.mts);
      expect(result[i].sys.cts.getTime()).toBeLessThanOrEqual(now);
      expect(result[i].sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);
    }

    // empty list
    result = await dao.createMany([]);
    expect(result).toEqual([]);

    // "sys" field should be entirely replaced
    result = await dao.createMany([{ name: "Foo3", surname: "Bar3", age: 80, sys: { foo: "bar", rev: 10, cts: 123 } }]);
    now = Date.now();
    expect(result?.[0]?.sys).toEqual({ cts: expect.any(Date), mts: expect.any(Date), rev: 0 });
    expect(result[0].sys.cts).toEqual(result[0].sys.mts);
    expect(result[0].sys.cts.getTime()).toBeLessThanOrEqual(now);
    expect(result[0].sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);

    // inserting while already having ID / OID should throw error
    let rejection = expect(async () => dao.createMany([JANE2, { ...result[0], ...JOHN }])).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.CreateManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 1: expect.any(Utils.Uu5ObjectStore.Errors.NotUniqueError) },
    });
    rejection = expect(async () => dao.createMany([JANE2, { id: result[0].id, ...JOHN }])).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.CreateManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 1: expect.any(Utils.Uu5ObjectStore.Errors.NotUniqueError) },
    });
    rejection = expect(async () => dao.createMany([{ oid: result[0].oid, ...JOHN }, JANE2])).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.CreateManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 0: expect.any(Utils.Uu5ObjectStore.Errors.NotUniqueError) },
    });
    expect(await dao._count()).toBe(3); // nothing should have been inserted due to failure

    // inserting while breaking a unique index should throw error
    rejection = expect(async () => dao.createMany([JANE2, ALICE, JANE2])).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.CreateManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 2: expect.any(Utils.Uu5ObjectStore.Errors.NotUniqueError) },
    });
    expect(await dao._count()).toBe(3); // nothing should have been inserted due to failure
  });

  it("get()", async () => {
    let { dao, itemList } = await setup();

    let result = await dao.get(itemList[1].oid);
    expect(result).toEqual(itemList[1]);

    result = await dao.get("1234");
    expect(result).toEqual(null);
  });

  it("update()", async () => {
    let {
      dao,
      // eslint-disable-next-line no-unused-vars
      itemList: [john, jane, alice, bob],
    } = await setup();
    await TestUtils.wait(2); // so that updates will have different mts than cts

    let result = await dao.update({ ...alice, name: "Malice", surname: "Borderland" });
    expect(result).toEqual({
      ...alice,
      name: "Malice",
      surname: "Borderland",
      id: alice.id,
      oid: alice.oid,
      sys: { cts: alice.sys.cts, mts: expect.any(Date), rev: alice.sys.rev + 1 },
    });
    expect(result.sys.mts.getTime()).toBeGreaterThan(result.sys.cts.getTime());

    // update with partial uuObject should do merge with existing
    let alice2 = result;
    result = await dao.update({ oid: alice2.oid, name: "Malice2" });
    expect(result).toEqual({
      ...alice2,
      name: "Malice2",
      sys: { cts: alice2.sys.cts, mts: expect.any(Date), rev: alice2.sys.rev + 1 },
    });

    // not finding should throw
    let rejection = expect(async () => dao.update({ ...alice, id: 1234, oid: "1234", surname: "Worderland" })).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.ConcurrentModificationError);

    // should work even without passing revision
    result = await dao.update({ ...john, name: "Johnny", sys: { ...john.sys, rev: undefined } });
    expect(result?.name).toEqual("Johnny");
    expect(result?.sys?.rev).toEqual(john.sys.rev + 1);

    // should throw if mismatched revision
    rejection = expect(async () => dao.update({ ...bob, name: "Bobby", sys: { ...bob.sys, rev: 10 } })).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.ConcurrentModificationError);

    // should throw if missing OID
    rejection = expect(async () => dao.update({ ...bob, name: "Bobby", oid: undefined })).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.MissingAttributeError);
    await rejection.toMatchObject({ paramMap: { attribute: "oid" } });
  });

  it("updateMany()", async () => {
    let {
      dao,
      // eslint-disable-next-line no-unused-vars
      itemList: [john, jane, alice, bob],
    } = await setup();
    await TestUtils.wait(2); // so that updates will have different mts than cts

    let result = await dao.updateMany([
      { ...alice, name: "Malice", surname: "Borderland" },
      { ...john, age: 111 },
    ]);
    expect(result).toEqual([
      {
        ...alice,
        name: "Malice",
        surname: "Borderland",
        id: alice.id,
        oid: alice.oid,
        sys: { cts: alice.sys.cts, mts: expect.any(Date), rev: alice.sys.rev + 1 },
      },
      {
        ...john,
        age: 111,
        sys: { cts: john.sys.cts, mts: expect.any(Date), rev: john.sys.rev + 1 },
      },
    ]);
    expect(result[0].sys.mts.getTime()).toBeGreaterThan(result[0].sys.cts.getTime());
    expect(result[1].sys.mts.getTime()).toBeGreaterThan(result[1].sys.cts.getTime());

    // update with partial uuObject should do merge with existing
    let [alice2, john2] = result;
    result = await dao.updateMany([
      { oid: alice2.oid, name: "Malice2" },
      { oid: john2.oid, age: 112 },
    ]);
    expect(result).toEqual([
      {
        ...alice2,
        name: "Malice2",
        sys: { cts: alice2.sys.cts, mts: expect.any(Date), rev: alice2.sys.rev + 1 },
      },
      {
        ...john2,
        age: 112,
        sys: { cts: john2.sys.cts, mts: expect.any(Date), rev: john2.sys.rev + 1 },
      },
    ]);

    // not finding should throw and rollback any successful ones
    let [alice3, john3] = result;
    let rejection = expect(async () =>
      dao.updateMany([
        { ...alice3, name: "Malice3" },
        { id: 1234, oid: "1234", surname: "Worderland" },
      ]),
    ).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.UpdateManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 1: expect.any(Utils.Uu5ObjectStore.Errors.ConcurrentModificationError) },
    });
    expect(await dao.get(alice3.oid)).toMatchObject({ name: alice3.name });

    // should work even without passing revision
    result = await dao.updateMany([{ ...john3, name: "Johnny", sys: { ...john3.sys, rev: undefined } }]);
    expect(result?.[0]?.name).toEqual("Johnny");
    expect(result?.[0]?.sys?.rev).toEqual(john3.sys.rev + 1);

    // should throw if mismatched revision
    rejection = expect(async () => dao.updateMany([{ ...bob, name: "Bobby", sys: { ...bob.sys, rev: 10 } }])).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.UpdateManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 0: expect.any(Utils.Uu5ObjectStore.Errors.ConcurrentModificationError) },
    });

    // should throw if missing OID
    rejection = expect(async () => dao.updateMany([{ ...bob, name: "Bobby", oid: undefined }])).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.UpdateManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 0: expect.any(Utils.Uu5ObjectStore.Errors.MissingAttributeError) },
    });
    await rejection.toMatchObject({ errorMap: { 0: { paramMap: { attribute: "oid" } } } });
  });

  it("replace()", async () => {
    let {
      dao,
      // eslint-disable-next-line no-unused-vars
      itemList: [john, jane, alice, bob],
    } = await setup();
    await TestUtils.wait(2); // so that updates will have different mts than cts

    let result = await dao.replace({ ...alice, name: "Malice", surname: "Borderland" });
    expect(result).toEqual({
      ...alice,
      name: "Malice",
      surname: "Borderland",
      id: alice.id,
      oid: alice.oid,
      sys: { cts: alice.sys.cts, mts: expect.any(Date), rev: alice.sys.rev + 1 },
    });
    expect(result.sys.mts.getTime()).toBeGreaterThan(result.sys.cts.getTime());

    // replace with partial uuObject shouldn't do merge, i.e. only passed fields should remain in uuObject
    let alice2 = result;
    result = await dao.replace({ oid: alice2.oid, name: "Malice2" });
    expect(result).toEqual({
      id: alice2.id,
      oid: alice2.oid,
      name: "Malice2",
      sys: { cts: alice2.sys.cts, mts: expect.any(Date), rev: alice2.sys.rev + 1 },
    });

    // not finding should throw
    let rejection = expect(async () => dao.replace({ ...alice, id: 1234, oid: "1234", surname: "Worderland" })).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.ConcurrentModificationError);

    // should work even without passing revision
    result = await dao.replace({ ...john, name: "Johnny", sys: { ...john.sys, rev: undefined } });
    expect(result?.name).toEqual("Johnny");
    expect(result?.sys?.rev).toEqual(john.sys.rev + 1);

    // should throw if mismatched revision
    rejection = expect(async () => dao.replace({ ...bob, name: "Bobby", sys: { ...bob.sys, rev: 10 } })).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.ConcurrentModificationError);

    // should throw if missing OID
    rejection = expect(async () => dao.replace({ ...bob, name: "Bobby", oid: undefined })).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.MissingAttributeError);
    await rejection.toMatchObject({ paramMap: { attribute: "oid" } });
  });

  it("replaceMany()", async () => {
    let {
      dao,
      // eslint-disable-next-line no-unused-vars
      itemList: [john, jane, alice, bob],
    } = await setup();
    await TestUtils.wait(2); // so that updates will have different mts than cts

    let result = await dao.replaceMany([
      { ...alice, name: "Malice", surname: "Borderland" },
      { ...john, age: 111 },
    ]);
    expect(result).toEqual([
      {
        ...alice,
        name: "Malice",
        surname: "Borderland",
        id: alice.id,
        oid: alice.oid,
        sys: { cts: alice.sys.cts, mts: expect.any(Date), rev: alice.sys.rev + 1 },
      },
      {
        ...john,
        age: 111,
        sys: { cts: john.sys.cts, mts: expect.any(Date), rev: john.sys.rev + 1 },
      },
    ]);
    expect(result[0].sys.mts.getTime()).toBeGreaterThan(result[0].sys.cts.getTime());
    expect(result[1].sys.mts.getTime()).toBeGreaterThan(result[1].sys.cts.getTime());

    // replace with partial uuObject shouldn't do merge, i.e. only passed fields should remain in uuObject
    let [alice2, john2] = result;
    result = await dao.replaceMany([
      { oid: alice2.oid, name: "Malice2" },
      { oid: john2.oid, age: 112 },
    ]);
    expect(result).toEqual([
      {
        id: alice2.id,
        oid: alice2.oid,
        name: "Malice2",
        sys: { cts: alice2.sys.cts, mts: expect.any(Date), rev: alice2.sys.rev + 1 },
      },
      {
        id: john2.id,
        oid: john2.oid,
        age: 112,
        sys: { cts: john2.sys.cts, mts: expect.any(Date), rev: john2.sys.rev + 1 },
      },
    ]);

    // not finding should throw and rollback any successful ones
    let [alice3, john3] = result;
    let rejection = expect(async () =>
      dao.replaceMany([
        { ...alice3, name: "Malice3" },
        { id: 1234, oid: "1234", surname: "Worderland" },
      ]),
    ).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.ReplaceManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 1: expect.any(Utils.Uu5ObjectStore.Errors.ConcurrentModificationError) },
    });
    expect(await dao.get(alice3.oid)).toMatchObject({ name: alice3.name });

    // should work even without passing revision
    result = await dao.replaceMany([{ ...john3, name: "Johnny", sys: { ...john3.sys, rev: undefined } }]);
    expect(result?.[0]?.name).toEqual("Johnny");
    expect(result?.[0]?.sys?.rev).toEqual(john3.sys.rev + 1);

    // should throw if mismatched revision
    rejection = expect(async () => dao.replaceMany([{ ...bob, name: "Bobby", sys: { ...bob.sys, rev: 10 } }])).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.ReplaceManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 0: expect.any(Utils.Uu5ObjectStore.Errors.ConcurrentModificationError) },
    });

    // should throw if missing OID
    rejection = expect(async () => dao.replaceMany([{ ...bob, name: "Bobby", oid: undefined }])).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.ReplaceManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 0: expect.any(Utils.Uu5ObjectStore.Errors.MissingAttributeError) },
    });
    await rejection.toMatchObject({ errorMap: { 0: { paramMap: { attribute: "oid" } } } });
  });

  it("delete()", async () => {
    let { dao } = await setup({ skipInsert: true });

    let [john, jane, bob] = await dao.createMany([JOHN, JANE, BOB]);
    let result = await dao.delete(jane);
    expect(result).toBe(true);
    expect(await dao.get(jane.oid)).toBe(null);
    expect(await dao._count()).toBe(2);

    // deleting non-existing item is no-op
    result = await dao.delete({ oid: "1234", name: "Foo" });
    expect(result).toBe(false);
    expect(await dao._count()).toBe(2);

    // deleting an item without OID should throw
    let rejection = expect(async () => dao.delete({ ...bob, oid: undefined })).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.MissingAttributeError);
    await rejection.toMatchObject({ paramMap: { attribute: "oid" } });
  });

  it("list()", async () => {
    let { dao, itemList } = await setup();
    const [john, jane, alice, bob, jane2] = itemList;

    // expect iterator API
    let result = await dao.list();
    expect(typeof result?.hasNext).toEqual("function");
    expect(typeof result?.next).toEqual("function");
    expect(typeof result?.close).toEqual("function");
    expect(result.hasNext()).toEqual(true);
    expect(await result.next()).toEqual(john);
    expect(result.hasNext()).toEqual(true);
    expect(await result.next()).toEqual(jane);
    expect(result.hasNext()).toEqual(true);
    expect(await result.next()).toEqual(alice);
    expect(result.hasNext()).toEqual(true);
    expect(await result.next()).toEqual(bob);
    expect(result.hasNext()).toEqual(true);
    expect(await result.next()).toEqual(jane2);
    expect(result.hasNext()).toEqual(false);

    // NOTE We should actually use iterator API here in test but since we also return data as an array for frontend,
    // we'll simply use the array comparisons.
    result = await dao.list();
    expect(result).toEqual([
      { ...JOHN, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      { ...JANE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      { ...ALICE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      { ...BOB, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      { ...JANE2, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
    ]);
    expect(result).toEqual(itemList);
  });

  it("listPaged()", async () => {
    let { dao, itemList } = await setup();

    let result = await dao.listPaged();
    expect(result).toEqual({
      itemList,
      pageInfo: { pageIndex: 0, pageSize: 100, total: itemList.length },
    });

    result = await dao.listPaged({ pageIndex: 1, pageSize: 3 });
    expect(result).toEqual({
      itemList: itemList.slice(3, 6),
      pageInfo: { pageIndex: 1, pageSize: 3, total: itemList.length },
    });

    result = await dao.listPaged({ pageIndex: 0, pageSize: 2 });
    expect(result).toEqual({
      itemList: itemList.slice(0, 2),
      pageInfo: { pageIndex: 0, pageSize: 2, total: itemList.length },
    });
  });

  it("_insertOne()", async () => {
    // same as create()
    let { dao } = await setup({ skipInsert: true });

    let result = await dao._insertOne({ name: "Foo", surname: "Bar", age: 80 });
    let now = Date.now();
    expect(result).toEqual({
      name: "Foo",
      surname: "Bar",
      age: 80,
      id: expect.any(Number),
      oid: expect.any(String),
      sys: { cts: expect.any(Date), mts: expect.any(Date), rev: 0 },
    });
    expect(result.sys.cts).toEqual(result.sys.mts);
    expect(result.sys.cts.getTime()).toBeLessThanOrEqual(now);
    expect(result.sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);

    // "sys" field should be entirely replaced
    result = await dao._insertOne({ name: "Foo", surname: "Bar2", age: 80, sys: { foo: "bar", rev: 10, cts: 123 } });
    now = Date.now();
    expect(result?.sys).toEqual({ cts: expect.any(Date), mts: expect.any(Date), rev: 0 });
    expect(result.sys.cts).toEqual(result.sys.mts);
    expect(result.sys.cts.getTime()).toBeLessThanOrEqual(now);
    expect(result.sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);

    // inserting while already having ID / OID should throw error
    await expect(async () => dao._insertOne({ ...result, age: 81 })).rejects.toThrow(
      Utils.Uu5ObjectStore.Errors.NotUniqueError,
    );
    await expect(async () => dao._insertOne({ id: result.id, ...JOHN })).rejects.toThrow(
      Utils.Uu5ObjectStore.Errors.NotUniqueError,
    );
    await expect(async () => dao._insertOne({ oid: result.oid, ...JOHN })).rejects.toThrow(
      Utils.Uu5ObjectStore.Errors.NotUniqueError,
    );
  });

  it("_insertMany()", async () => {
    let { dao } = await setup({ skipInsert: true });

    let result = await dao._insertMany([
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
        oid: expect.any(String),
        sys: { cts: expect.any(Date), mts: expect.any(Date), rev: 0 },
      },
      {
        name: "Foo2",
        surname: "Bar2",
        age: 70,
        id: expect.any(Number),
        oid: expect.any(String),
        sys: { cts: expect.any(Date), mts: expect.any(Date), rev: 0 },
      },
    ]);
    for (let i = 0; i < 2; i++) {
      expect(result[i].sys.cts).toEqual(result[i].sys.mts);
      expect(result[i].sys.cts.getTime()).toBeLessThanOrEqual(now);
      expect(result[i].sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);
    }

    // empty list
    result = await dao._insertMany([]);
    expect(result).toEqual([]);

    // "sys" field should be entirely replaced
    result = await dao._insertMany([
      { name: "Foo3", surname: "Bar3", age: 80, sys: { foo: "bar", rev: 10, cts: 123 } },
    ]);
    now = Date.now();
    expect(result?.[0]?.sys).toEqual({ cts: expect.any(Date), mts: expect.any(Date), rev: 0 });
    expect(result[0].sys.cts).toEqual(result[0].sys.mts);
    expect(result[0].sys.cts.getTime()).toBeLessThanOrEqual(now);
    expect(result[0].sys.cts.getTime()).toBeGreaterThanOrEqual(now - 800);

    // inserting while already having ID / OID should throw error
    let rejection = expect(async () => dao._insertMany([JANE2, { ...result[0], ...JOHN }])).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.InsertManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 1: expect.any(Utils.Uu5ObjectStore.Errors.NotUniqueError) },
    });
    rejection = expect(async () => dao._insertMany([JANE2, { id: result[0].id, ...JOHN }])).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.InsertManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 1: expect.any(Utils.Uu5ObjectStore.Errors.NotUniqueError) },
    });
    rejection = expect(async () => dao._insertMany([{ oid: result[0].oid, ...JOHN }, JANE2])).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.InsertManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 0: expect.any(Utils.Uu5ObjectStore.Errors.NotUniqueError) },
    });
    expect(await dao._count()).toBe(3); // nothing should have been inserted due to failures

    // inserting while breaking a unique index should throw error
    rejection = expect(async () => dao._insertMany([JANE2, ALICE, JANE2])).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.InsertManyFailedError);
    await rejection.toMatchObject({
      errorMap: { 2: expect.any(Utils.Uu5ObjectStore.Errors.NotUniqueError) },
    });
    expect(await dao._count()).toBe(3); // nothing should have been inserted due to failure
  });

  it("_findOne()", async () => {
    let { dao } = await setup();

    let result = await dao._findOne({ surname: "Wonderland", name: "Alice" });
    expect(result).toEqual({ ...ALICE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) });

    result = await dao._findOne({ surname: "Borderland", name: "Malice" });
    expect(result).toEqual(null);

    // finding by using index spanning more fields than given
    result = await dao._findOne({ name: "Alice" }); // can use index { name: 1, surname: 1 }
    expect(result).toEqual({ ...ALICE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) });

    // finding multiple is not allowed
    let rejection = expect(async () => dao._findOne({ "address.city": "Prague" })).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.AmbiguousQueryError);

    // finding without suitable index is not supported
    rejection = expect(async () => dao._findOne({ surname: "Doe" })).rejects; // unable to use index { name: 1, surname: 1 }
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.InvalidCallError);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"surname":1}') } }); // error contains suggested index name
  });

  it("_findMany()", async () => {
    let { dao, itemList } = await setup();
    const [john, jane, alice, bob, jane2] = itemList;

    // expect iterator API
    let result = await dao._findMany({});
    expect(typeof result?.hasNext).toEqual("function");
    expect(typeof result?.next).toEqual("function");
    expect(typeof result?.close).toEqual("function");
    expect(result.hasNext()).toEqual(true);
    expect(await result.next()).toEqual(john);
    expect(result.hasNext()).toEqual(true);
    expect(await result.next()).toEqual(jane);
    expect(result.hasNext()).toEqual(true);
    expect(await result.next()).toEqual(alice);
    expect(result.hasNext()).toEqual(true);
    expect(await result.next()).toEqual(bob);
    expect(result.hasNext()).toEqual(true);
    expect(await result.next()).toEqual(jane2);
    expect(result.hasNext()).toEqual(false);

    // NOTE We should actually use iterator API here in test but since we also return data as an array for frontend,
    // we'll simply use the array comparisons.
    result = await dao._findMany({});
    expect(result).toEqual([
      { ...JOHN, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      { ...JANE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      { ...ALICE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      { ...BOB, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      { ...JANE2, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
    ]);
    expect(result).toEqual(itemList);

    result = await dao._findMany({ surname: "Wonderland", name: "Alice" });
    expect(result).toEqual([{ ...ALICE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) }]);

    result = await dao._findMany({ surname: "Borderland", name: "Malice" });
    expect(result).toEqual([]);

    // finding by using index spanning more fields than given
    result = await dao._findMany({ name: "Jane" }); // can use index { name: 1, surname: 1 }
    expect(result).toEqual([
      { ...JANE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      { ...JANE2, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
    ]);

    result = await dao._findMany({ "address.city": "Prague" });
    expect(result).toEqual([
      { ...JOHN, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      { ...JANE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      { ...ALICE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
    ]);

    // nested field must use dot notation (otherwise it should do lookup of "address" field which equals { city: "Prague" }
    // but that isn't supported either because objects are not indexable)
    let rejection = expect(async () => await dao._findMany({ address: { city: "Prague" } })).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.InvalidCallError);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"address":1}') } }); // error contains suggested index name

    // finding without suitable index is not supported
    rejection = expect(async () => dao._findMany({ surname: "Doe" })).rejects; // unable to use index { name: 1, surname: 1 }
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.InvalidCallError);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"surname":1}') } }); // error contains suggested index name
  });

  it("_findManyPaged()", async () => {
    let { dao, itemList } = await setup();

    let result = await dao._findManyPaged({});
    expect(result).toEqual({
      itemList: [
        { ...JOHN, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
        { ...JANE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
        { ...ALICE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
        { ...BOB, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
        { ...JANE2, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      ],
      pageInfo: { pageIndex: 0, pageSize: 100, total: 5 },
    });
    expect(result.itemList).toEqual(itemList);

    result = await dao._findManyPaged({ surname: "Wonderland", name: "Alice" });
    expect(result).toEqual({
      itemList: [{ ...ALICE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) }],
      pageInfo: { pageIndex: 0, pageSize: 100, total: 1 },
    });

    result = await dao._findManyPaged({ surname: "Borderland", name: "Malice" });
    expect(result).toEqual({ itemList: [], pageInfo: { pageIndex: 0, pageSize: 100, total: 0 } });

    // finding by using index spanning more fields than given
    result = await dao._findManyPaged({ name: "Jane" }); // can use index { name: 1, surname: 1 }
    expect(result).toEqual({
      itemList: [
        { ...JANE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
        { ...JANE2, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      ],
      pageInfo: { pageIndex: 0, pageSize: 100, total: 2 },
    });

    result = await dao._findManyPaged({ "address.city": "Prague" });
    expect(result).toEqual({
      itemList: [
        { ...JOHN, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
        { ...JANE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
        { ...ALICE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) },
      ],
      pageInfo: { pageIndex: 0, pageSize: 100, total: 3 },
    });

    // nested field must use dot notation (otherwise it should do lookup of "address" field which equals { city: "Prague" }
    // but that isn't supported either because objects are not indexable)
    let rejection = expect(async () => await dao._findManyPaged({ address: { city: "Prague" } })).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.InvalidCallError);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"address":1}') } }); // error contains suggested index name

    // finding without suitable index is not supported
    rejection = expect(async () => dao._findManyPaged({ surname: "Doe" })).rejects; // unable to use index { name: 1, surname: 1 }
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.InvalidCallError);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"surname":1}') } }); // error contains suggested index name

    // with pageInfo
    result = await dao._findManyPaged({ name: "Alice", surname: "Wonderland" }, { pageIndex: 1, pageSize: 2 });
    expect(result).toEqual({
      itemList: [],
      pageInfo: { pageIndex: 1, pageSize: 2, total: 1 },
    });

    result = await dao._findManyPaged({ name: "Jane" }, { pageIndex: 1, pageSize: 1 }); // can use index { name: 1, surname: 1 }
    expect(result).toEqual({
      itemList: [{ ...JANE2, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) }],
      pageInfo: { pageIndex: 1, pageSize: 1, total: 2 },
    });

    result = await dao._findManyPaged({ "address.city": "Prague" }, { pageIndex: 1, pageSize: 2 });
    expect(result).toEqual({
      itemList: [{ ...ALICE, id: expect.any(Number), oid: expect.any(String), sys: expect.any(Object) }],
      pageInfo: { pageIndex: 1, pageSize: 2, total: 3 },
    });
  });

  it("_count()", async () => {
    let { dao } = await setup();

    let result = await dao._count();
    expect(result).toEqual(5);

    result = await dao._count({ age: 28 });
    expect(result).toEqual(3);

    // finding by using index spanning more fields than given
    result = await dao._count({ name: "Jane" }); // can use index { name: 1, surname: 1 }
    expect(result).toEqual(2);

    // finding without (exact) index is not supported
    let rejection = expect(async () => dao._count({ surname: "Doe" })).rejects; // unable to use index { name: 1, surname: 1 }
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.InvalidCallError);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"surname":1}') } }); // error contains suggested index name
  });

  it("_updateOne()", async () => {
    // similar to update() but with custom filter and it doesn't handle sys attributes at all
    let {
      dao,
      // eslint-disable-next-line no-unused-vars
      itemList: [john, jane, alice, bob],
    } = await setup();
    await TestUtils.wait(2); // so that updates will have different mts than cts

    let result = await dao._updateOne(
      { surname: "Wonderland", name: "Alice" },
      { ...alice, name: "Malice", surname: "Borderland" },
    );
    expect(result).toEqual({
      ...alice,
      name: "Malice",
      surname: "Borderland",
    });

    // update with partial uuObject should do merge with existing
    let alice2 = result;
    result = await dao._updateOne({ oid: alice2.oid }, { name: "Malice2" });
    expect(result).toEqual({
      ...alice2,
      name: "Malice2",
    });

    // should update even if using custom revision
    result = await dao._updateOne({ oid: alice2.oid }, { name: "Malice3", sys: { ...alice2.sys, rev: 100 } });
    expect(result).toEqual({
      ...alice2,
      name: "Malice3",
      sys: { ...alice2.sys, rev: 100 },
    });

    // not finding should do nothing
    result = await dao._updateOne({ surname: "Worderland", name: "Alice" }, alice);
    expect(result).toEqual(null);

    // should throw if multiple items found
    let rejection = expect(async () => dao._updateOne({ "address.city": "Prague" }, { name: "Johnny" })).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.AmbiguousQueryError);
    expect(await dao._findMany({ name: "Johnny" })).toEqual([]);

    // finding without suitable index is not supported
    rejection = expect(async () => dao._updateOne({ surname: "Doe" }, john)).rejects; // unable to use index { name: 1, surname: 1 }
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.InvalidCallError);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"surname":1}') } }); // error contains suggested index name
  });

  it("_updateMany()", async () => {
    // similar to update() but with custom filter and it doesn't handle sys attributes at all
    let { dao, itemList } = await setup();
    // eslint-disable-next-line no-unused-vars
    let [john, jane, alice, bob, jane2] = itemList;
    let alice2 = await dao.create({ ...ALICE, surname: "Chalice" });
    await TestUtils.wait(2); // so that updates will have different mts than cts

    let result = await dao._updateMany({ name: "Alice" }, { name: "Malice" });
    expect(result).toEqual(2);
    let items = await dao._findMany({ name: "Malice" });
    expect(items?.length).toEqual(2);
    expect(items).toContainEqual({ ...alice, name: "Malice" });
    expect(items).toContainEqual({ ...alice2, name: "Malice" });
    // eslint-disable-next-line no-unused-vars

    // should update even if using custom revision
    result = await dao._updateMany(
      { name: "Malice", surname: "Wonderland" },
      { name: "Malice2", sys: { ...alice2.sys, rev: 100 } },
    );
    expect(result).toEqual(1);
    expect(await dao._findMany({ name: "Malice2" })).toEqual([
      { ...alice, name: "Malice2", sys: { ...alice2.sys, rev: 100 } },
    ]);

    // not finding should do nothing
    result = await dao._updateMany({ surname: "Worderland", name: "Alice" }, alice);
    expect(result).toEqual(0);

    // updating multiple items should work
    result = await dao._updateMany({ name: "Jane" }, { name: "Jenny" });
    expect(result).toEqual(2);
    items = await dao._findMany({ name: "Jenny" });
    expect(items?.length).toEqual(2);
    expect(items).toContainEqual({ ...jane, name: "Jenny" });
    expect(items).toContainEqual({ ...jane2, name: "Jenny" });

    // finding without suitable index is not supported
    let rejection = expect(async () => dao._updateMany({ surname: "Doe" }, john)).rejects; // unable to use index { name: 1, surname: 1 }
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.InvalidCallError);
    await rejection.toMatchObject({ paramMap: { detail: expect.stringMatching('{"surname":1}') } }); // error contains suggested index name
  });

  it("_deleteOne()", async () => {
    let { dao, itemList } = await setup();
    // eslint-disable-next-line no-unused-vars
    let [john, jane, alice, bob, jane2] = itemList;

    let result = await dao._deleteOne({ name: "Alice", surname: "Wonderland" });
    expect(result).toBe(true);
    expect(await dao.get(alice.oid)).toBe(null);
    expect(await dao._count()).toBe(4);

    // deleting non-existing item is no-op
    result = await dao._deleteOne({ oid: "1234" });
    expect(result).toBe(false);
    expect(await dao._count()).toBe(4);

    // deleting multiple items should throw
    let rejection = expect(async () => dao._deleteOne({ name: "Jane" })).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.AmbiguousQueryError);
    expect(await dao._count()).toBe(4);
  });

  it("_deleteMany()", async () => {
    let { dao, itemList } = await setup();
    // eslint-disable-next-line no-unused-vars
    let [john, jane, alice, bob, jane2] = itemList;

    let result = await dao._deleteMany({ name: "Alice", surname: "Wonderland" });
    expect(result).toBe(1);
    expect(await dao.get(alice.oid)).toBe(null);
    expect(await dao._count()).toBe(4);

    // deleting non-existing item is no-op
    result = await dao._deleteMany({ oid: "1234" });
    expect(result).toBe(0);
    expect(await dao._count()).toBe(4);

    // deleting multiple items should work
    result = await dao._deleteMany({ name: "Jane" });
    expect(result).toBe(2);
    expect(await dao._count()).toBe(2);
  });

  it("_runInTransaction()", async () => {
    let { dao, itemList } = await setup();
    // eslint-disable-next-line no-unused-vars
    let [john, jane, alice, bob, jane2] = itemList;

    let result = await dao._runInTransaction(async function () {
      await this.update({ ...john, name: "Johnny" });
      await this.delete(jane);
      expect(typeof this.customGetByOid).toEqual("function"); // 'this' in transaction should have access to all Dao's methods
      expect(await this.customGetByOid(john.oid)).toMatchObject({ name: "Johnny" }); // should see immediate results within transaction
      return 123;
    });
    expect(result).toBe(123);
    expect(await dao.get(jane.oid)).toBe(null);
    expect(await dao.get(john.oid)).toMatchObject({ name: "Johnny" });

    // failure within transaction should rollback it whole
    let rejection = expect(
      async () =>
        await dao._runInTransaction(async function () {
          await this.create(JANE);
          await this.create(JANE); // should throw due to unique { name: 1, surname: 1 } index
        }),
    ).rejects;
    await rejection.toThrow(Utils.Uu5ObjectStore.Errors.NotUniqueError);
    expect(await dao._findOne({ name: JANE.name, surname: JANE.surname })).toBe(null);

    // multiple transactions are executed after each other, not in parallel
    let t1 = dao._runInTransaction(async function () {
      let alice2 = await this.update({ ...alice, name: "Malice" });
      await this.update({ ...alice2, name: "Malice2" });
    });
    let t2 = dao._runInTransaction(async function () {
      // any call here should resolve only after previous transaction is settled
      expect(await this.get(alice.oid)).toMatchObject({ name: "Malice2" });
    });
    await t1;
    await t2;

    // nested transaction is ignored (but gets executed as a part of the outer transaction)
    result = await dao._runInTransaction(async function () {
      let bob2 = await this.update({ ...bob, name: "Bobby" });
      return await this._runInTransaction(async function () {
        return await this.update({ ...bob2, name: "Bobby2" });
      });
    });
    expect(result).toMatchObject({ name: "Bobby2" });
  });

  it("should use separate dbs based on session uuIdentity", async () => {
    let { dao } = await setup();
    expect(await dao._count()).toEqual(5);

    Test.render(<SessionProvider authenticationService={AuthenticationService}></SessionProvider>);
    expect(await dao._count()).toEqual(0);
  });

  if (!skipSchemaMaxAge) {
    it("should cleanup schema based on schemaMaxAge", async () => {
      const MAX_AGE = 200;
      class TestDao extends Utils.Uu5ObjectStore.Dao {
        constructor() {
          super("expireDao", { schemaMaxAge: MAX_AGE });
        }
      }
      let { dao } = await setup({ daoClass: TestDao });
      expect(await dao._count()).toEqual(5);

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

describe("[uu5g05] Utils.Uu5ObjectStore.Dao", () => {
  runTests();
});

describe("[uu5g05] Utils.Uu5ObjectStore.Dao, falling back to memory (indexedDB unavailable)", () => {
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
    skipCloseCheck: true,
    listDatabases: () => Object.keys(dbMap).map((it) => ({ name: it })),
  });
});

describe("[uu5g05] Utils.Uu5ObjectStore.Dao, persist=false", () => {
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
    skipCloseCheck: true,
    listDatabases: () => Object.keys(dbMap).map((it) => ({ name: it })),
  });
});
