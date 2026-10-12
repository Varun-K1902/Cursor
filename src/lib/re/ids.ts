export function nextStableCode(codes: string[], prefix = "REQ-", pad = 3) {
  let max = 0
  for (const code of codes) {
    if (!code.startsWith(prefix)) continue
    const value = Number.parseInt(code.slice(prefix.length), 10)
    if (!Number.isNaN(value)) max = Math.max(max, value)
  }
  return `${prefix}${String(max + 1).padStart(pad, "0")}`
}
