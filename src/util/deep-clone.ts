/* eslint-disable @typescript-eslint/no-unsafe-return */

export default function deepClone<T>(o: T): T {
  if (!o || typeof o !== 'object') {
    return o;
  }

  if (Array.isArray(o)) {
    // assume arrays are not sparse
    return o.map((e) => deepClone(e)) as unknown as T;
  }

  const newO = {} as T;
  for (const k in o) {
    if (Object.prototype.hasOwnProperty.call(o, k)) {
      newO[k] = deepClone(o[k]);
    }
  }
  return newO;
}
