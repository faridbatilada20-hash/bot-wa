import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import pino from "pino"
import readline from "readline"

const { state, saveCreds } = await useMultiFileAuthState("./session")

const afk = {}
const claim = {}

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
})

const question = (text) => new Promise(resolve => rl.question(text, resolve))

async function startBot(){

const sock = makeWASocket({
logger: pino({ level: "silent" }),
auth: state,
browser: ["FARID-MD","Chrome","1.0"]
})

sock.ev.on("connection.update", async (update)=>{
const { connection } = update

if(connection === "connecting"){
console.log("Menghubungkan...")
}

if(connection === "open"){
console.log("✅ BOT FARID CONNECTED")
}

if(connection === "close"){
console.log("Koneksi terputus, mencoba ulang...")
startBot()
}

if(!sock.authState.creds.registered){

const nomor = await question("Masukkan nomor WhatsApp: ")
const code = await sock.requestPairingCode(nomor)

console.log("PAIRING CODE:",code)

}

})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("messages.upsert", async ({messages})=>{

const msg = messages[0]
if(!msg.message) return

const from = msg.key.remoteJid
const sender = msg.key.participant || from
const pushname = msg.pushName || "User"

const body =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
msg.message.imageMessage?.caption ||
""

const prefix="."
const isCmd = body.startsWith(prefix)
const command = isCmd ? body.slice(1).split(" ")[0] : ""
const args = body.trim().split(/ +/).slice(1)

const reply = (text)=>{
sock.sendMessage(from,{text},{quoted:msg})
}

const runtime=(seconds)=>{
seconds=Number(seconds)
const d=Math.floor(seconds/(3600*24))
const h=Math.floor(seconds%(3600*24)/3600)
const m=Math.floor(seconds%3600/60)
const s=Math.floor(seconds%60)
return `${d}d ${h}h ${m}m ${s}s`
}

const run=runtime(process.uptime())

// AFK RETURN

if(afk[sender]){
let data=afk[sender]
delete afk[sender]

reply(`@${pushname} kembali setelah ${runtime((Date.now()-data.time)/1000)}`)
}

// MENU

if(command==="menu"){

let menu=`╭──❍「 USER INFO 」❍
├ Nama : ${pushname}
├ Id : ${sender.split("@")[0]}
├ User : Member
├ Limit : Infinity
╰─┬────❍

╭─┴─❍「 BOT INFO 」❍
├ Nama Bot : farid-bot
├ Owner : 628388407448
├ Runtime : ${run}
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
│□ .rvo
╰────❍`

sock.sendMessage(from,{text:menu},{quoted:msg})

}

// PROFILE

if(command==="profile"){

let pp

try{
pp = await sock.profilePictureUrl(sender,"image")
}catch{
pp="https://i.ibb.co/2Wz9Z9K/avatar.png"
}

sock.sendMessage(from,{
image:{url:pp},
caption:`Nama : ${pushname}
Nomor : ${sender.split("@")[0]}
Status : Member`
},{quoted:msg})

}

// OWNER

if(command==="owner"){
reply("Owner : 628388407448")
}

// PING

if(command==="ping"){
reply("Pong 🏓")
}

// RUNTIME

if(command==="runtime"){
reply(run)
}

// CLAIM

if(command==="claim"){

let id=sender

if(claim[id] && Date.now()-claim[id] < 86400000){

reply("Kamu sudah claim hari ini")

}else{

claim[id]=Date.now()

reply("Berhasil claim uang 💰")

}

}

// AFK

if(command==="afk"){

let alasan=args.join(" ") || "AFK"

afk[sender]={
reason:alasan,
time:Date.now()
}

reply(`@${pushname} sedang AFK\nAlasan: ${alasan}`)

}

// RVO

if(command==="rvo"){

let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

if(!quoted){
reply("Reply foto sekali lihat dengan .rvo")
return
}

let view = quoted?.viewOnceMessageV2?.message?.imageMessage

if(view){

sock.sendMessage(from,{
image:{url:view.url},
caption:"Berhasil membuka view once"
})

}else{

reply("Itu bukan view once")

}

}

})

}

startBot()
  