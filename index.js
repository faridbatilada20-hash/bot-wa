import makeWASocket,{
useMultiFileAuthState,
fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

import P from "pino"

const prefix = "."
const owner = "628388407448"
const botname = "FARID-MD"

let userDB = {}
let afk = {}

function runtime(s){
let h = Math.floor(s/3600)
let m = Math.floor(s%3600/60)
let d = Math.floor(s%60)
return `${h}h ${m}m ${d}s`
}

function clockString(ms){
let d = Math.floor(ms / 86400000)
let h = Math.floor(ms / 3600000) % 24
let m = Math.floor(ms / 60000) % 60
let s = Math.floor(ms / 1000) % 60
return `${d} hari ${h} jam ${m} menit ${s} detik`
}

async function startBot(){

const { state, saveCreds } = await useMultiFileAuthState("./session")
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
logger:P({level:"silent"}),
printQRInTerminal:true,
auth:state,
version
})

sock.ev.on("creds.update",saveCreds)

sock.ev.on("connection.update",({connection})=>{
if(connection==="open"){
console.log("✅ BOT FARID CONNECTED")
}
})

sock.ev.on("messages.upsert",async({messages})=>{

try{

const m = messages[0]
if(!m.message) return
if(m.key.remoteJid === "status@broadcast") return

const from = m.key.remoteJid
const sender = m.key.participant || m.key.remoteJid

const body =
m.message.conversation ||
m.message.extendedTextMessage?.text ||
m.message.imageMessage?.caption ||
""

if(!userDB[sender]){
userDB[sender] = {
money:0,
lastclaim:0
}
}

if(afk[sender]){
let durasi = Date.now() - afk[sender].time
let alasan = afk[sender].reason
delete afk[sender]

await sock.sendMessage(from,{
text:`@${sender.split("@")[0]} telah kembali dari AFK
Durasi: ${clockString(durasi)}
Alasan sebelumnya: ${alasan}`,
mentions:[sender]
},{quoted:m})
}

let mentionUser = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

for(let user of mentionUser){
if(afk[user]){
let durasi = Date.now() - afk[user].time

await sock.sendMessage(from,{
text:`@${user.split("@")[0]} sedang AFK
Alasan: ${afk[user].reason}
Sejak: ${clockString(durasi)}`,
mentions:[user]
},{quoted:m})
}
}

if(!body.startsWith(prefix)) return

const command = body.slice(1).split(" ")[0]
const text = body.split(" ").slice(1).join(" ")

switch(command){

case "menu":{

let pp
try{
pp = await sock.profilePictureUrl(sender,"image")
}catch{
pp = "https://i.ibb.co/2Wz0n6T/avatar.png"
}

let menu = `
╭──❍「 USER INFO 」❍
├ Nama : ${sender.split("@")[0]}
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
│□ .afk
╰────❍
`

await sock.sendMessage(from,{
image:{url:pp},
caption:menu
},{quoted:m})

}
break

case "profile":

await sock.sendMessage(from,{
text:`👤 PROFILE

Nama : ${sender.split("@")[0]}
Nomor : ${sender.split("@")[0]}
Money : ${userDB[sender].money}`
},{quoted:m})

break

case "owner":

await sock.sendMessage(from,{
text:`👑 Owner
wa.me/${owner}`
},{quoted:m})

break

case "ping":

await sock.sendMessage(from,{
text:"🏓 Pong!"
},{quoted:m})

break

case "runtime":

await sock.sendMessage(from,{
text:`⏱ Runtime : ${runtime(process.uptime())}`
},{quoted:m})

break

case "claim":{

let now = Date.now()

if(now - userDB[sender].lastclaim < 86400000){

let sisa = 86400000 - (now - userDB[sender].lastclaim)

await sock.sendMessage(from,{
text:`❌ Kamu sudah claim
Coba lagi dalam ${clockString(sisa)}`
},{quoted:m})

return
}

let reward = Math.floor(Math.random()*5000)+1000

userDB[sender].money += reward
userDB[sender].lastclaim = now

await sock.sendMessage(from,{
text:`🎁 CLAIM BERHASIL

Kamu mendapat 💰 ${reward}
Total uang : ${userDB[sender].money}`
},{quoted:m})

}
break

case "afk":{

let reason = text || "tidak ada alasan"

afk[sender] = {
reason,
time:Date.now()
}

await sock.sendMessage(from,{
text:`@${sender.split("@")[0]} sekarang AFK
Alasan: ${reason}`,
mentions:[sender]
},{quoted:m})

}
break

}

}catch(e){
console.log(e)
}

})

}

startBot()
  