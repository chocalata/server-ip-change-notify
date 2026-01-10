/**
 * This is the class that will handle the WhatsApp API
 */
import whatsappWebJsPkg from 'whatsapp-web.js'
import QRCode from 'qrcode'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const { Client, LocalAuth } = whatsappWebJsPkg
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const WHATSAPP_DATA_DIR = '../whatsapp-data'
const WHATSAPP_CACHE_DIR = path.join(WHATSAPP_DATA_DIR, 'cache')
const MESSAGE_FILE_SEPARATOR =
  '\n||||||||||||||||||||||||||||||||||||||||||||||'
const MESSAGES_TO_SEND_FILE_PATH = path.join(
  __dirname,
  WHATSAPP_DATA_DIR,
  'messagesToSend.txt'
)

const WHATSAPP_CHAT_WEB_CONTACT = process.env.WHATSAPP_CHAT_WEB_CONTACT

class WhatsAppController {
  #client
  #appName
  #clientIsReady = false
  constructor(appName) {
    if (!appName) {
      throw new Error('App name is required to initialize WhatsAppController')
    }

    this.#appName = appName

    const client = new Client({
      puppeteer: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-extensions'
        ],
        headless: true
      },
      authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, WHATSAPP_DATA_DIR)
      }),
      webVersionCache: {
        type: 'local',
        path: path.join(__dirname, WHATSAPP_CACHE_DIR)
      }
    })

    client.initialize()

    client.on('qr', (qr) => {
      console.info(`QR RECEIVED: ${qr}`)
      QRCode.toString(qr, { type: 'terminal' }, function (err, url) {
        console.log(url)
      })
    })

    client.on('ready', async () => {
      console.info('CLIENT IS READY!')
      this.#clientIsReady = true

      let sent = await this.sendMessage(
        `Whatsapp client ready for ${this.#appName}!`
      )

      if (sent) this.sendRemainingMessages()
    })

    this.#client = client
  }

  sendMessage(message, chatId = WHATSAPP_CHAT_WEB_CONTACT) {
    if (!this.#clientIsReady) {
      console.error('Client is not ready yet!')
      this.saveMessageToSend(message)
      return false
    }

    const target = typeof chatId === 'string' ? chatId.trim() : ''
    if (!target) {
      console.error(
        'No WhatsApp chat id provided (WHATSAPP_CHAT_WEB_CONTACT). Skipping sendMessage.'
      )
      this.saveMessageToSend(message)
      return false
    }

    return this.#client
      .getChatById(target)
      .then((chat) => {
        return chat.sendMessage(message).then((msg) => {
          console.info(`Message sent: ${msg.body}`)
          return msg
        })
      })
      .catch((err) => {
        console.error('Error sending message:', err)
        this.saveMessageToSend(message)
        return false
      })
  }

  getMessagesToSend() {
    try {
      const data = fs.readFileSync(MESSAGES_TO_SEND_FILE_PATH, 'utf-8')
      return data
        .split(MESSAGE_FILE_SEPARATOR)
        .filter((msg) => msg.trim() !== '')
    } catch (err) {
      console.error('Error reading messagesToSend.txt:', err)
      return []
    }
  }

  clearMessagesToSend() {
    try {
      fs.writeFileSync(MESSAGES_TO_SEND_FILE_PATH, '')
      console.info('messagesToSend.txt cleared successfully.')
      return true
    } catch (err) {
      console.error('Error clearing messagesToSend.txt:', err)
      return false
    }
  }

  sendRemainingMessages() {
    const messages = this.getMessagesToSend()
    messages.forEach((message) => {
      this.sendMessage(message)
    })
    this.clearMessagesToSend()
  }

  isClientReady() {
    return this.#clientIsReady
  }

  saveMessageToSend(message) {
    try {
      fs.appendFileSync(
        MESSAGES_TO_SEND_FILE_PATH,
        `${message}${MESSAGE_FILE_SEPARATOR}`
      )
      console.info(`Message saved to send later: ${message}`)
      return true
    } catch (err) {
      console.error('Error saving message to send later:', err)
      return false
    }
  }
}

export default WhatsAppController
