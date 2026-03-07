import makeWASocket,
import readline from "readline"

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
})

const question = (text) => new Promise(resolve => rl.question(text, resolve))

if (!sock.authState.creds.registered) {

const phone = await question("Masukkan nomor WhatsApp: ")

const code = await sock.requestPairingCode(phone)

console.log("Kode Pairing:", code)

}
 { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import pino from "pino"
import fs from "fs"

const { state, saveCreds } = await useMultiFileAuthState("./session")

const afk = {}
const claim = {}

const startBot = async () => {

const sock = makeWASocket({
logger: pino({ level: "silent" }),
auth: state,
browser: ["FARID-MD","Chrome","1.0"]
})

sock.ev.on("connection.update", async (update) => {
const { connection } = update

if(connection === "connecting"){
console.log("🔄 Menghubungkan ke WhatsApp...")
}

if(connection === "open"){
console.log("✅ BOT FARID CONNECTED")
}

if(connection === "close"){
console.log("❌ Koneksi terputus, mencoba ulang...")
startBot()
}
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", ({ connection }) => {
if(connection === "open"){
console.log("✅ BOT FARID CONNECTED")
}
})

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0]
if(!msg.message) return

const sender = msg.key.remoteJid
const fromMe = msg.key.fromMe
const isGroup = sender.endsWith("@g.us")

const body =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
msg.message.imageMessage?.caption ||
""

const prefix = "."
const isCmd = body.startsWith(prefix)
const command = isCmd ? body.slice(1).split(" ")[0] : ""
const args = body.trim().split(/ +/).slice(1)

const pushname = msg.pushName || "User"

const reply = (text) => {
sock.sendMessage(sender,{text},{quoted:msg})
}

const runtime = (seconds) => {
seconds = Number(seconds)
const d = Math.floor(seconds / (3600*24))
const h = Math.floor(seconds % (3600*24) / 3600)
const m = Math.floor(seconds % 3600 / 60)
const s = Math.floor(seconds % 60)
return `${d}d ${h}h ${m}m ${s}s`
}

const startTime = process.uptime()

// AFK RETURN
if(afk[msg.key.participant || sender]){
const data = afk[msg.key.participant || sender]
delete afk[msg.key.participant || sender]
reply(`@${pushname} kembali setelah ${runtime((Date.now()-data.time)/1000)}`)
}

// COMMANDS

if(command === "menu"){

let menu = `╭──❍「 USER INFO 」❍
├ Nama : ${pushname}
├ Id : ${sender.split("@")[0]}
├ User : Member
├ Limit : Infinity
╰─┬────❍

╭─┴─❍「 BOT INFO 」❍
├ Nama Bot : farid-bot
├ Owner : 628388407448
├ Runtime : ${runtime(startTime)}
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

sock.sendMessage(sender,{
text:menu,
contextInfo:{
mentionedJid:[msg.key.participant || sender]
}
},{quoted:msg})
}

if(command === "profile"){
reply(`Nama : ${pushname}\nNomor : ${sender.split("@")[0]}`)
}

if(command === "owner"){
reply(`Owner : 628388407448`)
}

if(command === "ping"){
reply("Pong 🏓")
}

if(command === "runtime"){
reply(runtime(startTime))
}

if(command === "claim"){

let id = sender

if(claim[id] && Date.now() - claim[id] < 86400000){
reply("Kamu sudah claim hari ini")
}else{
claim[id] = Date.now()
reply("Berhasil claim uang 💰")
}

}

if(command === "afk"){

let alasan = args.join(" ") || "AFK"

afk[msg.key.participant || sender] = {
reason: alasan,
time: Date.now()
}

reply(`@${pushname} sedang afk\nAlasan: ${alasan}`)
}

if(command === "rvo"){

if(msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.viewOnceMessageV2){

let media = msg.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage

sock.sendMessage(sender,{
image:{url:media.url},
caption:"Berhasil membuka view once"
})

}else{
reply("Reply foto sekali lihat dengan .rvo")
}

}

})

}

startBot()
  