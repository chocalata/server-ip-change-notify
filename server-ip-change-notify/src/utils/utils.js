import { clear } from 'console'
import fs from 'fs'

import path from 'path'

import { fileURLToPath } from 'url'

const PROCESS_TTL = parseInt(process.env.PROCESS_TTL) * 1000 || 60000

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const IP_FILE_PATH = path.join(__dirname, '../app-data/ip.txt')

const API_IPIFY_URL = 'https://api.ipify.org?format=json'

let appTimeout = null

export async function getPublicIP() {
  try {
    const response = await fetch(API_IPIFY_URL)
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.error('Error fetching public IP:', error)
    return null
  }
}

export function getSavedIP() {
  try {
    const data = fs.readFileSync(IP_FILE_PATH, 'utf-8')
    return data.trim()
  } catch (err) {
    console.error('Error reading ip.txt:', err)
    return null
  }
}

export function saveIP(ip) {
  try {
    fs.writeFileSync(IP_FILE_PATH, ip)
    console.info(`IP saved to ip.txt: ${ip}`)
    return true
  } catch (err) {
    console.error('Error saving IP to ip.txt:', err)
    return false
  }
}

export function startAppTimeout(ttl = PROCESS_TTL) {
  clearTimeout(appTimeout)
  console.info(`App timeout started for ${ttl / 1000} seconds.`)
  appTimeout = setTimeout(() => {
    closeService('Exiting app due to timeout.', 1)
  }, ttl)
}

export function closeService(message, exitCode = 0) {
  if (message)
    if (exitCode === 0) console.info(message)
    else console.error(message)
  process.exit(exitCode)
}
