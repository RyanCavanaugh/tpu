interface Type {
  a: 123;
  b: "some string";
}

function get123<K extends keyof Type>(): Type[K] {
  return 123;
}
