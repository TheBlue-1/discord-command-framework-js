export function unreachable(
  nothing: never,
  message: string = "Unreachable Code Reached",
): never {
  console.error("Unreachable Value:", nothing);
  throw new Error(message);
}
