import getContentType from './getContentType'

export default function getChatSet(
  headers: any):
  string {

  const cs = getContentType(headers)
    .split(';')
    .filter(p => p.includes('charset'))[0]
  return (cs && cs.trim().split('=')[1]) || 'utf8'
}