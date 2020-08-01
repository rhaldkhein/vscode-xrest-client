import getHeaderValue from './getHeaderValue'

export default function getContentType(
  headers: any):
  string {

  return getHeaderValue(headers, 'content-type') || ''
}