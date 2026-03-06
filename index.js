import makeWASocket, {
DisconnectReason,
useMultiFileAuthState,
fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

import pino from "pino"
import { Boom } from "@hapi/boom"

const owner = "628388407448"
const prefix = "."

const startTime = Date.now()

async function startBot(){

const { state, saveCreds } = await useMultiFileAuthState("./session")
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
logger: pino({ level: "silent" }),
auth: state,
version,
browser: ["farid-bot","Chrome","1.0.0"],
emitOwnEvents: true
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update",(update)=>{

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

try{

const m = messages[0]
if(!m.message) return

const from = m.key.remoteJid
const isGroup = from.endsWith("@g.us")

const sender =
m.key.fromMe
? sock.user.id
: (m.key.participant || m.key.remoteJid)

const text =
m.message?.conversation ||
m.message?.extendedTextMessage?.text ||
m.message?.imageMessage?.caption ||
""

if(!text) return
if(!text.startsWith(prefix)) return

const command = text.slice(1).split(" ")[0]

const pushname = m.pushName || "User"

console.log("Pesan:", text)

switch(command){

// MENU
case "menu":

let pp

try{
pp = await sock.profilePictureUrl(sender,"image")
}catch{
pp = "https://telegra.ph/file/6880771a42bad09dd6087.jpg"
}

let runtime = Math.floor((Date.now() - startTime)/1000)

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
├ Runtime : ${runtime}s
├ Prefix : .
╰─┬────❍

╭─┴❍「 BOT MENU 」❍
│□ .menu
│□ .profile
│□ .owner
│□ .ping
│□ .runtime
╰────❍
`

await sock.sendMessage(from,{
image:{url:pp},
caption:menu
})

break


// PROFILE
case "profile":

let ppfoto

try{
ppfoto = await sock.profilePictureUrl(sender,"image")
}catch{
ppfoto = "https://telegra.ph/file/6880771a42bad09dd6087.jpg"
}

let statusUser = "Member"

if(sender.includes(owner)){
statusUser = "Owner"
}

if(isGroup){

let groupMetadata = await sock.groupMetadata(from)

let admins = groupMetadata.participants
.filter(v => v.admin !== null)
.map(v => v.id)

if(admins.includes(sender)){
statusUser = "Admin Group"
}

}

let profile = `
╭──❍「 PROFILE 」❍
├ Nama : ${pushname}
├ Nomor : ${sender.split("@")[0]}
├ Status : ${statusUser}
├ Chat : ${isGroup ? "Group" : "Private"}
╰────❍
`

await sock.sendMessage(from,{
image:{url:ppfoto},
caption:profile
})

break


// OWNER
case "owner":

await sock.sendMessage(from,{
text:"Owner Bot : "+owner
})

break


// PING
case "ping":

await sock.sendMessage(from,{
text:"🏓 Pong"
})

break


// RUNTIME
case "runtime":

let run = Math.floor((Date.now() - startTime)/1000)

await sock.sendMessage(from,{
text:"Bot sudah berjalan "+run+" detik"
})

break

}

}catch(err){

console.log("ERROR:",err)

}

})

}

startBot()
  