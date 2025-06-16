import importLsi from "../lsi/import-lsi.js";

export function required() {
  return {
    message: { import: importLsi, path: ["Validation", "required"] },
    feedback: "error",
  };
}

export function pattern() {
  return {
    message: { import: importLsi, path: ["Validation", "pattern"] },
    feedback: "error",
  };
}

export function minLength() {
  return {
    message: { import: importLsi, path: ["Validation", "minLength"] },
    feedback: "error",
  };
}

export function maxLength() {
  return {
    message: { import: importLsi, path: ["Validation", "maxLength"] },
    feedback: "error",
  };
}
