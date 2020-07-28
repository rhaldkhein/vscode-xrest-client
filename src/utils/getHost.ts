import { URL } from 'url'
import cleanUrl from './cleanUrl'

export default function getHost(
  config: any):
  string {

  const url = new URL(
    config.url.indexOf('://') > -1 ?
      config.url : config.baseURL
  )
  return cleanUrl(url.host)
}