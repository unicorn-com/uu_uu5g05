const fs = require("fs");
const path = require("path");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const BookKitClient = require("./bookkit-client.js");

const getFilesRecursively = (directory) => {
  const files = [];

  const filesInDirectory = fs.readdirSync(directory);
  for (const file of filesInDirectory) {
    const absolute = path.join(directory, file);
    if (fs.statSync(absolute).isDirectory()) {
      files.push(...getFilesRecursively(absolute));
    } else {
      files.push(absolute.replace(/\\/g, "/"));
    }
  }
  return files;
};

const examples = getFilesRecursively("./demo").filter((path) => !/\/_/.test(path));
const sources = getFilesRecursively("./src").filter((path) => !/\/_/.test(path));

module.exports = class Component {
  constructor(tag_name, tid_awid, includeNamespace = true) {
    this.tag_name = tag_name;
    this.tid_awid = tid_awid;
    this.includeNamespace = includeNamespace;
  }

  async update_example(i, file_name0 = null) {
    let { fileName, code } = this._getMeta(this.tag_name);
    let file_name = file_name0 || fileName;
    let base_code = `example${this.includeNamespace ? pkg.namespace : ""}${code.replace(/^./g, (m) =>
      m.toUpperCase()
    )}`;

    let num = i.toString();
    if (num.length < 2) num = "0" + num;
    let binCode = `${base_code}${num}`;
    let file_path = examples.find((path) => path.endsWith(`/${file_name}/e${num}.html`));
    if (file_path) await this._update_file(file_path, binCode);
  }

  async update_examples() {
    let { fileName } = this._getMeta(this.tag_name);

    let i = 0;
    while (i < 15) {
      await this.update_example(i, fileName);
      i += 1;
    }
  }

  async update_source() {
    let { fileName, code } = this._getMeta(this.tag_name);

    let source_path_js = sources.find((path) => path.endsWith(`${fileName}.js`));
    let code_js = `source${this.includeNamespace ? pkg.namespace : ""}${code.replace(/^./g, (m) => m.toUpperCase())}Js`;
    await this._update_file(source_path_js, code_js);

    // let source_path_less = `./src/${mdl.toLowerCase()}/${name.replace(/\./g, "-").toLowerCase()}.less`
    // let code_less = `source${mdl}${name.replace(/\./g, "")}Less`
    // await this._update_file(source_path_less, code_less)
  }

  async update(opt = {}) {
    if (opt.source !== false) await this.update_source();

    if (opt.example) {
      await this.update_example(opt.example);
    } else {
      await this.update_examples();
    }
  }

  _client() {
    return (
      this.client ||
      (this.client = new BookKitClient({ baseUrl: `https://uuapp.plus4u.net/uu-bookkit-maing01/${this.tid_awid}/` }))
    );
  }

  _getMeta(componentName) {
    let fileName = componentName
      .replace(/\./g, "/")
      .replace(/[A-Z]/g, (m, i) => (i ? "-" : "") + m.toLowerCase())
      .replace(/\/-/g, "/");
    let code = componentName.replace(/\.(.)/g, (m, g) => g.toUpperCase());
    return { code, fileName };
  }

  async _update_file(filePath, code) {
    if (fs.existsSync(filePath)) {
      let params = { code: code };

      if (filePath.match(/\.html?$/)) {
        params["contentType"] = "text/html";
      }

      params["revisionStrategy"] = "NONE";
      params["filename"] = path.basename(filePath);
      params["data"] = fs.readFileSync(filePath);
      try {
        await this._client().uuAppBinaryStore_updateBinaryData(params);
        console.log(`Binary file ${code} updated.`);
      } catch (e) {
        let err =
          e.dtoOut &&
          e.dtoOut.uuAppErrorMap &&
          (e.dtoOut.uuAppErrorMap["uu-app-binarystore/uuBinaryUpdateBinaryData/uuBinaryDaoUpdateByCodeFailed"] ||
            e.dtoOut.uuAppErrorMap["uu-app-binarystore/updateBinaryData/uuBinaryDaoUpdateByCodeFailed"] ||
            e.dtoOut.uuAppErrorMap["uu-appbinarystore/binaryDoesNotExist"]);
        while (err && err.cause) {
          err = err.cause.uuAppErrorMap;
        }
        if (
          err &&
          (err["uu-app-binarystore/objectNotFound"] || err["uu-appbinarystore-main/binary/update/binaryDoesNotExist"])
        ) {
          try {
            delete params["revisionStrategy"];
            await this._client().uuAppBinaryStore_createBinary(params);
            console.log(`Binary file ${code} added.`);
          } catch (e) {
            console.log(`\x1b[31mBinary file ${code} failed.\x1b[0m`);
            console.error(e.dtoOut && e.dtoOut.uuAppErrorMap ? JSON.stringify(e.dtoOut, null, 2) : e);
            throw e;
          }
        } else {
          console.error(e.dtoOut && e.dtoOut.uuAppErrorMap ? JSON.stringify(e.dtoOut, null, 2) : e);
          throw e;
        }
      }
    }
  }

  _dash_case(string) {
    return string
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .replace(/([A-Z])([A-Z])/g, "$1-$2")
      .replace(/([a-z\d])([A-Z])/g, "$1-$2")
      .replace(/\./g, "")
      .toLowerCase();
  }
};
