import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import pino from "pino"
import fs from "fs"

const prefix = "."
const dbFile = "./database.json"

if (!fs.existsSync(dbFile)) {
fs.writeFileSync(dbFile, JSON.stringify({ users:{} }, null, 2))
}

let db = JSON.parse(fs.readFileSync(dbFile))

function saveDB(){
fs.writeFileSync(dbFile, JSON.stringify(db,null,2))
}

async function startBot(){

const { state, saveCreds } = await useMultiFileAuthState("./session")

const sock = makeWASocket({
logger: pino({ level:"silent" }),
auth: state,
browser: ["FARID-MD","Chrome","1.0"]
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", async (update)=>{
const { connection } = update

if(connection === "open"){
console.log("BOT TERHUBUNG")
}

if(connection === "close"){
startBot()
}
})

if(!sock.authState.creds.registered){

const nomor = await new Promise(resolve=>{
process.stdout.write("Masukkan nomor WhatsApp: ")
process.stdin.once("data",data=>{
resolve(data.toString().trim())
})
})

setTimeout(async()=>{
const code = await sock.requestPairingCode(nomor)
console.log("PAIRING CODE:", code)
},4000)

}

sock.ev.on("messages.upsert", async ({ messages })=>{

const msg = messages[0]
if(!msg.message) return

const from = msg.key.remoteJid
const sender = msg.key.participant || msg.key.remoteJid
const pushname = msg.pushName || "User"

const body =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
msg.message.imageMessage?.caption ||
""

if(!db.users[sender]){
db.users[sender] = { money:100, afk:false, reason:"" }
saveDB()
}

if(db.users[sender].afk){
db.users[sender].afk = false
db.users[sender].reason = ""
await sock.sendMessage(from,{text:`${pushname} kembali dari AFK`},{quoted:msg})
saveDB()
}

if(!body.startsWith(prefix)) return

const args = body.slice(prefix.length).trim().split(/ +/)
const command = args.shift().toLowerCase()

switch(command){

case "menu":

try{

let pp = await sock.profilePictureUrl(sender,"image")

let menu = `
╭──❍ FARID-MD BOT
├ User : ${pushname}
├ Nomor : ${sender.split("@")[0]}
├ Money : ${db.users[sender].money}
╰────❍

╭─❍ BOT
│□ .profile
│□ .afk
│□ .ping
│□ .rvo
╰────❍
`

await sock.sendMessage(from,{
image:{url:pp},
caption:menu
},{quoted:msg})

}catch{

await sock.sendMessage(from,{text:"Menu error mengambil foto profil"},{quoted:msg})

}

break

case "ping":

await sock.sendMessage(from,{text:"PONG 🏓"},{quoted:msg})

break

case "afk":

let reason = args.join(" ") || "Tidak ada alasan"
db.users[sender].afk = true
db.users[sender].reason = reason
saveDB()

await sock.sendMessage(from,{
text:`${pushname} sekarang AFK\nAlasan : ${reason}`
},{quoted:msg})

break

case "profile":

try{

let pp = await sock.profilePictureUrl(sender,"image")

let teks = `
Nama : ${pushname}
Nomor : ${sender.split("@")[0]}
Money : ${db.users[sender].money}
AFK : ${db.users[sender].afk}
`

await sock.sendMessage(from,{
image:{url:pp},
caption:teks
},{quoted:msg})

}catch{

await sock.sendMessage(from,{text:"Tidak bisa mengambil foto profil"},{quoted:msg})

}

break

case "rvo":

await sock.sendMessage(from,{text:"🔥"},{quoted:msg})

break

}

})

}

startBot()
  