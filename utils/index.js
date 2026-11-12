/*------------------------------
Lerp
------------------------------*/
export const lerp = (v0, v1, t) => v0 * (1 - t) + v1 * t;

/*--------------------
Wrap index into [0, length)
--------------------*/
export const wrapIndex = (i, length) => {
  if (length <= 0) return 0;
  return ((Math.round(i) % length) + length) % length;
};

/*--------------------
Shortest wrapped distance from active → index
--------------------*/
export const wrappedDelta = (index, active, length) => {
  if (length <= 0) return 0;
  let diff = index - active;
  const half = length / 2;
  while (diff > half) diff -= length;
  while (diff < -half) diff += length;
  return diff;
};

/*--------------------
Get Piramidal Index (wrapped)
--------------------*/
export const getPiramidalIndex = (length, activeIndex) =>
  Array.from({ length }, (_, i) => {
    const dist = Math.abs(wrappedDelta(i, activeIndex, length));
    return length - dist;
  });
