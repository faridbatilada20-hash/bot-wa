import makeWASocket, {
DisconnectReason,
useMultiFileAuthState,
fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

import pino from "pino"
import readline from "readline"
import { Boom } from "@hapi/boom"

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
})

const question = (text) => new Promise(resolve => rl.question(text, resolve))

async function startBot(){

const { state, saveCreds } = await useMultiFileAuthState("./session")
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
logger: pino({ level: "silent" }),
printQRInTerminal: false,
auth: state,
version
})

sock.ev.on("creds.update", saveCreds)

if(!sock.authState.creds.registered){

const phone = await question("Masukkan nomor WA: ")

const code = await sock.requestPairingCode(phone)

console.log(`
================================
PAIRING CODE BOT
${code}
================================
`)
}

sock.ev.on("connection.update", (update)=>{

const { connection, lastDisconnect } = update

if(connection === "close"){

const shouldReconnect =
(lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut

if(shouldReconnect){
startBot()
}

}else if(connection === "open"){

console.log("✅ BOT FARID CONNECTED")
}

})

sock.ev.on("messages.upsert", async ({ messages }) => {

const m = messages[0]

if(!m.message) return

const msg = m.message.conversation ||
m.message.extendedTextMessage?.text

if(!msg) return

const prefix = "."
if(!msg.startsWith(prefix)) return

const command = msg.slice(1).split(" ")[0]

const from = m.key.remoteJid

switch(command){

case "menu":

let menu = `
╭──❍「 USER INFO 」❍
├ Nama : User
├ Limit : Infinity
╰─┬────❍

╭─┴─❍「 BOT INFO 」❍
├ Nama Bot : farid-bot
├ Owner : Farid
├ Prefix : .
╰─┬────❍

╭─┴❍「 BOT 」❍
│□ .menu
│□ .ping
│□ .runtime
│□ .owner
╰─┬────❍

╭─┴❍「 SEARCH 」❍
│□ .ytsearch
│□ .pinterest
│□ .google
╰─┬────❍

╭─┴❍「 DOWNLOAD 」❍
│□ .ytmp3
│□ .ytmp4
│□ .tiktok
╰─┬────❍

╭─┴❍「 AI 」❍
│□ .ai
│□ .gemini
╰─┬────❍

╭─┴❍「 GAME 」❍
│□ .tictactoe
│□ .slot
│□ .casino
╰────❍
`

sock.sendMessage(from,{text:menu})

break


case "ping":

sock.sendMessage(from,{text:"🏓 Pong Bot Aktif"})
break


case "owner":

sock.sendMessage(from,{text:"Owner : Farid"})
break


case "runtime":

sock.sendMessage(from,{text:"Bot sedang berjalan"})
break

}

})

}

startBot()
  