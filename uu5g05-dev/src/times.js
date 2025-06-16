function times(num, fn) {
  return Array.from({ length: num }, (_, i) => fn(i));
}

export { times };
export default times;
