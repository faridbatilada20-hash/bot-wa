import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

import readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (text) => new Promise(resolve => rl.question(text, resolve))

async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("./session")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on("connection.update", async (update) => {

    const { connection } = update

    if (connection === "open") {
      console.log("✅ Bot berhasil connect ke WhatsApp")
    }

    if (connection === "close") {
      console.log("❌ Koneksi terputus, mencoba ulang...")
      startBot()
    }

  })

  if (!sock.authState.creds.registered) {

    const phone = await question("Masukkan nomor WA (628xxx): ")

    const code = await sock.requestPairingCode(phone)

    console.log("🔑 Pairing Code:", code)

  }

  sock.ev.on("creds.update", saveCreds)
}

startBot()