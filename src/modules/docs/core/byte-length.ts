const UTF_8 = new TextEncoder();

export function byteLengthOf(text: string) {
  return UTF_8.encode(text).byteLength;
}
