export function parseByteRange(header, size) {
  if (!header) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(header)
  if (!match || size <= 0) throw new RangeError('Invalid byte range')
  let start
  let end
  if (match[1] === '') {
    const suffix = Number(match[2])
    if (!Number.isSafeInteger(suffix) || suffix <= 0) throw new RangeError('Invalid byte range')
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(match[1])
    end = match[2] === '' ? size - 1 : Number(match[2])
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) throw new RangeError('Unsatisfiable byte range')
  return { start, end: Math.min(end, size - 1) }
}
