import WhatsAppController from './models/WhatsAppController.js'
import {
  getPublicIP,
  getSavedIP,
  saveIP,
  closeService,
  startAppTimeout
} from './utils/utils.js'

const PROCESS_TTL = parseInt(process.env.PROCESS_TTL) * 1000 || 60000

startAppTimeout()

const ip = await getPublicIP()

const savedIP = getSavedIP()

if (savedIP == ip) {
  closeService('Public IP has not changed. Exiting.')
}

const whatsappController = new WhatsAppController('server-ip-change')

const isReadyPromise = whatsappController.checkIsReadyPromise()

if (whatsappController.isWaitingForClientReady()) {
  startAppTimeout(PROCESS_TTL * 3)
}

await isReadyPromise

startAppTimeout(PROCESS_TTL * 10)

whatsappController
  .sendMessage(`My IP is: ${ip}`)
  ?.then(() => {
    saveIP(ip)
    // Not closing immediately to ensure message is sent.
  })
  .catch((err) => {
    closeService(`Failed to send WhatsApp message: ${err}`, 1)
  })
