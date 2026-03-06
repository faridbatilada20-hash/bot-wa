import makeWASocket, { 
DisconnectReason, 
useMultiFileAuthState, 
fetchLatestBaileysVersion 
} from "@whiskeysockets/baileys"

import P from "pino"

const owner = "628388407448@s.whatsapp.net"
const botName = "FARID-MD"
const prefix = "."

let userDB = {}
let afk = {}

function runtime(seconds) {
seconds = Number(seconds)
var d = Math.floor(seconds / (3600*24))
var h = Math.floor(seconds % (3600*24) / 3600)
var m = Math.floor(seconds % 3600 / 60)
var s = Math.floor(seconds % 60)
return `${d}d ${h}h ${m}m ${s}s`
}

async function startBot(){

const { state, saveCreds } = await useMultiFileAuthState("./session")

const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
logger: P({ level:"silent" }),
printQRInTerminal:true,
auth: state,
version
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", (update) => {

const { connection } = update

if(connection === "open"){
console.log("✅ BOT FARID CONNECTED")
}

})

sock.ev.on("messages.upsert", async ({ messages }) => {

try{

const m = messages[0]

if(!m.message) return
if(m.key && m.key.remoteJid === "status@broadcast") return

const from = m.key.remoteJid
const sender = m.key.fromMe ? sock.user.id : m.key.participant || m.key.remoteJid

const body =
m.message.conversation ||
m.message.extendedTextMessage?.text ||
m.message.imageMessage?.caption ||
""

if(!body.startsWith(prefix)) return

const command = body.slice(1).split(" ")[0].toLowerCase()
const text = body.split(" ").slice(1).join(" ")

console.log("Pesan:", command)

const reply = (text) => sock.sendMessage(from,{text},{quoted:m})

if(!userDB[sender]){
userDB[sender] = {
limit: Infinity,
money: 0,
lastclaim: 0
}
}

if(afk[sender]){
delete afk[sender]
reply("AFK dimatikan")
}

let mentionUser = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

for(let user of mentionUser){

if(afk[user]){
reply(`@${user.split("@")[0]} sedang AFK\nAlasan: ${afk[user].reason}`,{
mentions:[user]
})
}

}

switch(command){

case "menu":{

let name = sender.split("@")[0]

let pp
try{
pp = await sock.profilePictureUrl(sender,"image")
}catch{
pp = "https://i.ibb.co/2Wz0n6T/avatar.png"
}

let uptime = runtime(process.uptime())

let teks = `
╭──❍「 USER INFO 」❍
├ Nama : ${name}
├ Id : ${name}
├ User : Member
├ Limit : Infinity
╰─┬────❍

╭─┴─❍「 BOT INFO 」❍
├ Nama Bot : farid-bot
├ Owner : 628388407448
├ Runtime : ${uptime}
├ Prefix : .
╰─┬────❍

╭─┴❍「 BOT MENU 」❍
│□ .menu
│□ .profile
│□ .owner
│□ .ping
│□ .runtime
│□ .claim
│□ .afk
╰────❍
`

await sock.sendMessage(from,{
image:{url:pp},
caption:teks,
mentions:[sender]
},{quoted:m})

}
break

case "profile":{

let name = sender.split("@")[0]

let isAdmin = "Member"

if(from.endsWith("@g.us")){
let meta = await sock.groupMetadata(from)
let admin = meta.participants.find(v=>v.id===sender && v.admin)
if(admin) isAdmin = "Admin"
}

let pp
try{
pp = await sock.profilePictureUrl(sender,"image")
}catch{
pp = "https://i.ibb.co/2Wz0n6T/avatar.png"
}

let teks = `
╭──❍ PROFILE ❍
├ Nama : ${name}
├ Nomor : ${name}
├ Status : ${isAdmin}
├ Money : ${userDB[sender].money}
├ Limit : Infinity
╰────❍
`

await sock.sendMessage(from,{
image:{url:pp},
caption:teks
},{quoted:m})

}
break

case "owner":
reply("Owner : 628388407448")
break

case "ping":
reply("Pong 🏓")
break

case "runtime":
reply(runtime(process.uptime()))
break

case "claim":{

let now = Date.now()

if(now - userDB[sender].lastclaim < 86400000){
return reply("Kamu sudah claim hari ini")
}

let reward = 1000

userDB[sender].money += reward
userDB[sender].lastclaim = now

reply(`Claim berhasil\nMoney +${reward}`)

}
break

case "afk":{

let reason = text || "tidak ada alasan"

afk[sender] = {
reason,
time:Date.now()
}

reply(`@${sender.split("@")[0]} sekarang AFK\nAlasan: ${reason}`,{
mentions:[sender]
})

}
break

}

}catch(e){
console.log(e)
}

})

}

startBot()
  