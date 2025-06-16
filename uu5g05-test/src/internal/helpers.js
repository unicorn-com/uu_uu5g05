const cleanupErrorStack = (stack, messageToSetToStack = undefined) => {
  // remove stacktrace rows containing tools.js & regenerator-runtime so that Jest
  // displays source code portion from which the Tools method has been called.
  let lines = stack.split(/\n/);
  let i = 0;
  while (i < lines.length && !lines[i].match(/^\s*at\s+/)) i++; // skip 1st/few lines (error message)
  let messageLines = messageToSetToStack ? [messageToSetToStack] : lines.slice(0, i);
  while (
    i < lines.length &&
    lines[i].match(
      /(src|uu5g04[/\\]dist[^/\\]*)[/\\]test[/\\][^.]+\.js:|regenerator-runtime|\(<anonymous>\)|node_modules[/\\]jest-mock[/\\]/,
    )
  ) {
    i++;
  }
  return [...messageLines, ...lines.slice(i)].join("\n");
};

module.exports = { cleanupErrorStack };
