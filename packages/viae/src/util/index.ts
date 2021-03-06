/** Collapse list of binary parts into single buffer;*/
/*export function flatten(list: Array<ArrayLike<number>>): Uint8Array {

  let count = list.reduce(function (a, b) {
    return a + (b.length);
  }, 0);

  let buffer = new Uint8Array(count);
  let offset = 0;

  for (let item of list) {
    buffer.set(item, offset);
    offset += item.length;
  }
  return buffer;
}*/

export function textToBytes(s: string): Uint8Array {
  const ua = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    ua[i] = s.charCodeAt(i) & 0xFF;
  }
  return ua;
};

export function bytesToText(ua: Uint8Array | number[], start: number = 0, end: number = ua.length): string {
  const _ua = ua.slice(start, end);
  return String.fromCharCode.apply(null, _ua);
};

export function toUint8Array(value: ArrayBuffer | ArrayBufferView) {
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  } else {
    return new Uint8Array(value, 0);
  }
}

export * from './normalise';
export * from './uuid';