
export default function getUrl(
  config: any):
  string {

  return (config.url?.indexOf('://') ?
    config.url : ((config.baseURL || '') + config.url)) || ''
}