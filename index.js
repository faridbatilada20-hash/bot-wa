import makeWASocket, { 
useMultiFileAuthState, 
fetchLatestBaileysVersion 
} from "@whiskeysockets/baileys"

import readline from "readline"

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
})

const question = (text) => {
return new Promise(resolve => rl.question(text, resolve))
}

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState("./session")

const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
version,
auth: state
})

if (!sock.authState.creds.registered) {

const phone = await question("Masukkan nomor WA (628xxx): ")

const code = await sock.requestPairingCode(phone)

console.log("Pairing Code:", code)

}

sock.ev.on("creds.update", saveCreds)

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0]
if (!msg.message) return

const from = msg.key.remoteJid
const sender = msg.key.participant || msg.key.remoteJid
const pushname = msg.pushName || "User"

const text =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
""

const command = text.split(" ")[0]

/* ================= MENU ================= */

if (command === ".menu") {

const now = new Date()
const jam = now.toLocaleTimeString("id-ID")
const tanggal = now.toLocaleDateString("id-ID")
const hari = now.toLocaleDateString("id-ID",{ weekday:"long" })

const menu = `
╭──❍「 *USER INFO* 」❍
├ *Nama* : ${pushname}
├ *Id* : @${sender.split("@")[0]}
├ *User* : Member
├ *Limit* : Infinity
├ *Money* : 0
╰─┬────❍

╭─┴─❍「 *BOT INFO* 」❍
├ *Nama Bot* : farid-bot
├ *Powered* : WhatsApp
├ *Owner* : +628388407448
├ *Mode* : Public
├ *Prefix* : .
├ *Premium Feature* : 🔸️
╰─┬────❍

╭─┴─❍「 *ABOUT* 」❍
├ *Tanggal* : ${tanggal}
├ *Hari* : ${hari}
├ *Jam* : ${jam}
╰──────❍

╭──❍「 *BOT* 」❍
│□ .profile
│□ .claim
│□ .buy
│□ .transfer
│□ .leaderboard
│□ .runtime
│□ .speed
│□ .ping
│□ .afk
╰─┬────❍

╭─┴❍「 *GROUP* 」❍
│□ .add
│□ .kick
│□ .promote
│□ .demote
│□ .tagall
│□ .hidetag
│□ .linkgrup
╰─┬────❍

╭─┴❍「 *DOWNLOAD* 」❍
│□ .ytmp3
│□ .ytmp4
│□ .tiktok
│□ .instagram
│□ .facebook
╰─┬────❍

╭─┴❍「 *AI* 」❍
│□ .ai
│□ .gemini
│□ .txt2img
╰─┬────❍

╭─┴❍「 *GAME* 」❍
│□ .slot
│□ .math
│□ .tictactoe
│□ .casino
│□ .tebakgambar
╰─┬────❍

╭─┴❍「 *FUN* 」❍
│□ .dadu
│□ .bisakah
│□ .apakah
│□ .kapan
│□ .siapa
╰─┬────❍

╭─┴❍「 *OWNER* 」❍
│□ .join
│□ .leave
│□ .block
│□ .ban
│□ .unban
│□ .backup
╰──────❍
`

await sock.sendMessage(from,{
text: menu,
mentions: [sender]
})

}

/* ================= PING ================= */

if (command === ".ping") {

await sock.sendMessage(from,{
text: "🏓 Pong! Bot Aktif"
})

}

/* ================= OWNER ================= */

if (command === ".owner") {

await sock.sendMessage(from,{
text: "Owner Bot: Farid"
})

}

})

}

startBot()


