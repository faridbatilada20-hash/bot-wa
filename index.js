import makeWASocket, {
DisconnectReason,
useMultiFileAuthState,
fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

import pino from "pino"
import readline from "readline"
import { Boom } from "@hapi/boom"

const owner = "628388407448"
const prefix = "."

let selfMode = false

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
auth: state,
version,
emitOwnEvents: true
})

sock.ev.on("creds.update", saveCreds)

if(!sock.authState.creds.registered){

const phone = await question("Masukkan nomor WA: ")

const code = await sock.requestPairingCode(phone)

console.log(`
==========================
PAIRING CODE BOT
${code}
==========================
`)

}

sock.ev.on("connection.update",(update)=>{

const { connection, lastDisconnect } = update

if(connection === "close"){

const shouldReconnect =
(lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut

if(shouldReconnect) startBot()

}else if(connection === "open"){

console.log("✅ BOT FARID CONNECTED")

}

})

sock.ev.on("messages.upsert", async ({ messages }) => {

const m = messages[0]
if(!m.message) return

const from = m.key.remoteJid

const sender = m.key.fromMe
? sock.user.id
: (m.key.participant || m.key.remoteJid)

const text =
m.message?.conversation ||
m.message?.extendedTextMessage?.text ||
m.message?.imageMessage?.caption ||
""

if(!text) return

const pushname = m.pushName || "User"

if(selfMode && !sender.includes(owner)) return

if(!text.startsWith(prefix)) return

const command = text.slice(1).split(" ")[0]

console.log("Pesan masuk:", text)
console.log("Command:", command)

switch(command){
case "profile":

let ppfoto

try{
ppfoto = await sock.profilePictureUrl(sender, "image")
}catch{
ppfoto = "https://telegra.ph/file/6880771a42bad09dd6087.jpg"
}

let statusUser = "Member"

// detect owner
if(sender.includes(owner)){
statusUser = "Owner"
}

// detect admin group
if(from.endsWith("@g.us")){
let groupMetadata = await sock.groupMetadata(from)
let admins = groupMetadata.participants
.filter(v => v.admin !== null)
.map(v => v.id)

if(admins.includes(sender)){
statusUser = "Admin Group"
}
}

let chatType = from.endsWith("@g.us") ? "Group" : "Private"

let textProfile = `
╭──❍「 PROFILE 」❍
├ Nama : ${pushname}
├ Nomor : ${sender.split("@")[0]}
├ Status : ${statusUser}
├ Chat : ${chatType}
╰────❍
`

await sock.sendMessage(from,{
image:{url:ppfoto},
caption:textProfile
})

break

case "self":

if(!sender.includes(owner)) return

selfMode = true

sock.sendMessage(from,{text:"Bot sekarang SELF MODE"})
break


case "selfout":

if(!sender.includes(owner)) return

selfMode = false

sock.sendMessage(from,{text:"Bot sekarang PUBLIC MODE"})
break


case "menu":

let pp

try{
pp = await sock.profilePictureUrl(sender,"image")
}catch{
pp = "https://telegra.ph/file/6880771a42bad09dd6087.jpg"
}

let menu = `
╭──❍「 USER INFO 」❍
├ Nama : ${pushname}
├ Id : ${sender.split("@")[0]}
├ User : Member
├ Limit : Infinity
╰─┬────❍

╭─┴─❍「 BOT INFO 」❍
├ Nama Bot : farid-bot
├ Owner : ${owner}
├ Mode : ${selfMode ? "SELF" : "PUBLIC"}
├ Prefix : .
╰─┬────❍

╭─┴❍「 BOT MENU 」❍
│□ .menu
│□ .runtime
│□ .owner
│□ .self
│□ .selfout
│□ .profile
╰────❍
`

sock.sendMessage(from,{
image:{url:pp},
caption:menu
})

break


case "ping":

sock.sendMessage(from,{text:"🏓 Pong Bot Aktif"})
break


case "owner":

sock.sendMessage(from,{text:"Owner : "+owner})
break


case "runtime":

sock.sendMessage(from,{text:"Bot sedang berjalan"})
break

}

})

}

startBot()
  