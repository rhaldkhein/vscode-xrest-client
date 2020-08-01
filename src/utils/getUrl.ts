
export default function getUrl(
  config: any):
  string {

  return (config.url?.indexOf('://') > -1 ?
    config.url : ((config.baseURL || '') + config.url)) || ''
}