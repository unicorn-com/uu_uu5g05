import LoggerFactory from "../utils/logger-factory.js";
import UtilsEvent from "../utils/event.js";
import Config from "../config/config.js";

let logger;
function getLogger() {
  if (!logger) logger = LoggerFactory.get(Config.TAG + "Utils.Stream");
  return logger;
}

const SUPPORTED_JSON =
  'Supported JSON stream must be valid JSON, it must contain only initial chunk, 0 or more item chunks and final chunk, each chunk on new line and there must be no other lines there. Item chunks must be valid JSON (possibly starting with "," character if it\'s a chunk for 2nd or later item).';

const Stream = {
  createItemListTransformStream({ onData } = {}) {
    let pendingChunks = [];
    let firstLineSkipped = false;
    let skipRemainingChunks = false;
    let bufferIntoMemory = false;

    return new TransformStream({
      transform(textChunk, /** @type TransformStreamDefaultController */ controller) {
        // NOTE This implementation currently assumes that the JSON stream must be valid JSON,
        // it must contain only initial chunk, item chunks and final chunk, each chunk on new line
        // and there must be no other lines there. Item chunks must be valid JSON (possibly starting
        // with "," character if it's a chunk for 2nd or later item). The attribute containing chunked list
        // must be in object root, not nested, e.g. {"pageInfo":{...},"itemList":[
        if (skipRemainingChunks) return;
        // NOTE If an error happenned with initial chunk, we'll simply buffer all chunks into memory and
        // then process it all at once in the end.
        pendingChunks.push(textChunk);
        if (bufferIntoMemory) return;

        if (textChunk.indexOf("\n") !== -1) {
          let lines = pendingChunks.join("").split("\n");
          pendingChunks = [lines.pop()];
          if (!firstLineSkipped) {
            // initial chunk
            firstLineSkipped = true;
            let wrongStructureError;
            let isWrongStructure = !lines[0].endsWith("[");
            let partialDtoOut;
            if (!isWrongStructure) {
              try {
                partialDtoOut = JSON.parse(lines[0] + "]}"); // this assumes that chunked array is in JSON root attribute such as {"itemList":[
              } catch (e) {
                isWrongStructure = true;
                wrongStructureError = e;
              }
            }
            if (isWrongStructure) {
              getLogger().error(
                `Unable to parse streamed JSON, JSON will be read into memory and then processed as a whole instead. ${SUPPORTED_JSON} Expected 1st line with an opened empty array attribute in JSON root such as {"itemList":[ but got: ` +
                  lines[0],
                wrongStructureError,
              );
              bufferIntoMemory = true;
              pendingChunks = [lines.concat(pendingChunks).join("\n")];
              return;
            }
            lines.shift();
            if (typeof onData === "function") onData(new UtilsEvent({ value: partialDtoOut }));
          }
          for (let line of lines) {
            if (line.startsWith("]")) {
              // final chunk
              skipRemainingChunks = true;
              return;
            }
            // item chunk
            let itemJsonString = line.startsWith(",") ? line.slice(1) : line;
            let item;
            try {
              item = JSON.parse(itemJsonString);
            } catch (e) {
              getLogger().error(
                `Unable to parse streamed JSON item, remaining JSON will be ignored. ${SUPPORTED_JSON} Problematic item: ` +
                  itemJsonString,
                e,
              );
              skipRemainingChunks = true;
              return;
            }
            controller.enqueue(item);
          }
        }
      },
      flush: (controller) => {
        if (bufferIntoMemory || !firstLineSkipped) {
          let jsonString = pendingChunks.join("");
          if (!firstLineSkipped) {
            getLogger().warn(
              `Streamed JSON is on single line which is not supported for streaming yet - JSON will be read into memory and then processed as a whole instead. ${SUPPORTED_JSON}`,
              { json: jsonString },
            );
          }
          let dtoOut = JSON.parse(jsonString);
          if (typeof onData === "function") onData(new UtilsEvent({ value: dtoOut }));
          if (Array.isArray(dtoOut?.itemList)) {
            for (let item of dtoOut.itemList) controller.enqueue(item);
          }
        }
      },
    });
  },

  async consume(stream, onChunk = undefined) {
    let reader = stream.getReader();
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        let { done, value } = await reader.read();
        if (done) break;
        onChunk?.(new UtilsEvent({ value }));
      }
    } finally {
      reader.releaseLock();
    }
  },
};

export { Stream };
export default Stream;
