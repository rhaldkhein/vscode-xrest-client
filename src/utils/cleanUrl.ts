
export default function cleanUrl(
  host: string):
  string {

  return host.replace('www.', '').replace(/(\.|:|\\|\/)/g, '_')
}