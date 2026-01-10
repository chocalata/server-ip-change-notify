import WhatsAppController from './models/WhatsAppController.js'

const whatsappController = new WhatsAppController('server-ip-change')

// get my public ip
async function getPublicIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.error('Error fetching public IP:', error)
    return null
  }
}

getPublicIP().then((ip) => {
  if (ip) {
    whatsappController.sendMessage(`My public IP address is: ${ip}`)
  }
})
