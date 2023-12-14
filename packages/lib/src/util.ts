export const assertUnreachable = (a: never): never => {
  throw new Error(`Unreachable: ${a}`);
};
