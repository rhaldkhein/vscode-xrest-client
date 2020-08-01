import { homedir } from 'os'

export default {
  name: 'Xrest',
  storagePath: homedir() + '/.xrest-client',
  bufferLimit: 1024 * 1024 * 2
}