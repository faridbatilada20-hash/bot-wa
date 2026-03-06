import makeWASocket, {
DisconnectReason,
useMultiFileAuthState,
fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

import P from "pino"
import fs from "fs"

const prefix = "."
const owner = "628388407448"
const botname = "farid-bot"

const dbFile = "./database.json"

if (!fs.existsSync(dbFile)) {
fs.writeFileSync(dbFile, JSON.stringify({ users:{} }))
}

let db = JSON.parse(fs.readFileSync(dbFile))

function saveDB(){
fs.writeFileSync(dbFile, JSON.stringify(db,null,2))
}

function runtime(seconds){
seconds = Number(seconds)
const h = Math.floor(seconds / 3600)
const m = Math.floor(seconds % 3600 / 60)
const s = Math.floor(seconds % 60)
return `${h}h ${m}m ${s}s`
}

async function startBot(){

const { state, saveCreds } = await useMultiFileAuthState("session")
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
logger: P({ level: "silent" }),
printQRInTerminal: true,
auth: state,
version
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", ({ connection }) => {

if(connection === "open"){
console.log("✅ BOT FARID CONNECTED")
}

})

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0]
if (!msg.message) return
if (msg.key.remoteJid === "status@broadcast") return

const from = msg.key.remoteJid
const sender = msg.key.participant || msg.key.remoteJid

const body =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
""

if (!body.startsWith(prefix)) return

const command = body.slice(1).split(" ")[0]

if (!db.users[sender]){
db.users[sender] = {
money: 0,
lastclaim: 0
}
}

const user = db.users[sender]

switch(command){

case "menu":

let ppuser

try {
ppuser = await sock.profilePictureUrl(sender, "image")
} catch {
ppuser = "https://i.ibb.co/2kRZ7Qk/user.png"
}

let menu = `╭──❍「 USER INFO 」❍
├ Nama : ${msg.pushName}
├ Id : ${sender.split("@")[0]}
├ User : Member
├ Limit : Infinity
╰─┬────❍

╭─┴─❍「 BOT INFO 」❍
├ Nama Bot : ${botname}
├ Owner : ${owner}
├ Runtime : ${runtime(process.uptime())}
├ Prefix : .
╰─┬────❍

╭─┴❍「 BOT MENU 」❍
│□ .menu
│□ .profile
│□ .owner
│□ .ping
│□ .runtime
│□ .claim
╰────❍`

await sock.sendMessage(from,{
image:{ url: ppuser },
caption: menu
})

break


case "profile":

await sock.sendMessage(from,{
text:`👤 PROFILE

Nama : ${msg.pushName}
ID : ${sender.split("@")[0]}
Money : ${user.money}`
})
break


case "owner":

await sock.sendMessage(from,{
text:`👑 Owner Bot
wa.me/${owner}`
})
break


case "ping":

await sock.sendMessage(from,{
text:"🏓 Pong!"
})
break


case "runtime":

await sock.sendMessage(from,{
text:`⏱ Runtime : ${runtime(process.uptime())}`
})
break


case "claim":

let now = Date.now()
let sehari = 86400000

if(now - user.lastclaim < sehari){

let sisa = sehari - (now - user.lastclaim)

let jam = Math.floor(sisa / 3600000)
let menit = Math.floor(sisa / 60000) % 60

await sock.sendMessage(from,{
text:`❌ Kamu sudah claim hari ini

Coba lagi dalam
${jam} jam ${menit} menit`
})

} else {

let hadiah = Math.floor(Math.random() * 5000) + 1000

user.money += hadiah
user.lastclaim = now
saveDB()

await sock.sendMessage(from,{
text:`🎁 CLAIM BERHASIL

Kamu mendapat 💰 ${hadiah}

Total uang : ${user.money}`
})

}

break

}

})

}

startBot()
  