import { homedir } from 'os'

const storagePath = homedir() + '/.xrest-client'

export default {
  name: 'Xrest',
  storagePath,
  bufferLimit: 1024 * 1024 * 2,
  lastResPath: storagePath + '/responses/last',
  savedResPath: storagePath + '/responses/saved'
}