import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import pino from "pino"
import { botname, ownername, prefix } from "./config.js"

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState("session")

const sock = makeWASocket({
logger: pino({ level: "silent" }),
auth: state
})

sock.ev.on("creds.update", saveCreds)

if(!sock.authState.creds.registered){
const phone = await question("Masukkan nomor WA: ")
const code = await sock.requestPairingCode(phone)
console.log("Pairing Code:", code)
}

sock.ev.on("messages.upsert", async (msg) => {

let m = msg.messages[0]
if(!m.message) return

let text = m.message.conversation || m.message.extendedTextMessage?.text
let from = m.key.remoteJid

if(!text.startsWith(prefix)) return

let command = text.slice(1).split(" ")[0]

if(command === "menu"){

let menu = `
🤖 ${botname}

Owner: ${ownername}

MENU BOT
.menu
.ping
.owner

MENU GROUP
.kick
.add
.promote
.demote
.tagall

MENU GAME
.slot
.math
.tebak

MENU TOOLS
.sticker
.play
.ytmp3
.ytmp4
.tiktok

Total Fitur: 250+
`

await sock.sendMessage(from,{ text: menu })

}

if(command === "ping"){
await sock.sendMessage(from,{ text:"Bot aktif ✅"})
}

if(command === "owner"){
await sock.sendMessage(from,{ text:`Owner: ${ownername}`})
}

})

}

startBot()
