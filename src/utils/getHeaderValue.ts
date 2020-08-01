
export default function getHeaderValue(
  headers: any,
  key: string):
  string | undefined {

  for (const k in headers) {
    if (k.toLowerCase() === key) return headers[k]
  }
}