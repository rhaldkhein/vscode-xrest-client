import { URL } from 'url'
import cleanUrl from './cleanUrl'

export default function getHostPath(
  config: any):
  string {

  if (typeof config !== 'string') {
    config = config.url.indexOf('://') > -1 ?
      config.url : (config.baseURL + config.url)
  }
  if (config.indexOf('://') === -1) {
    config = 'http://' + config
  }

  const url = new URL(config)
  return cleanUrl(url.host + url.pathname)
}