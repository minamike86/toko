import { exec } from "child_process"
import fs from "fs"
import path from "path"
import readline from "readline"

const DB_NAME = process.env.DATABASE_NAME || "toko_dev_test"
const DB_USER = process.env.DATABASE_USER || "root"
const DB_PASSWORD = process.env.DATABASE_PASSWORD || ""
const DB_HOST = process.env.DATABASE_HOST || "127.0.0.1"

const fileArg = process.argv[2]

if (!fileArg) {
  console.error("❌ Please provide backup file path.")
  process.exit(1)
}

const filePath = path.resolve(fileArg)

if (!fs.existsSync(filePath)) {
  console.error("❌ Backup file not found:", filePath)
  process.exit(1)
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function confirm(): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(
      `⚠️  This will OVERWRITE database '${DB_NAME}'. Continue? (yes/no): `,
      (answer) => {
        resolve(answer.toLowerCase() === "yes")
      }
    )
  })
}

async function run() {
  const proceed = await confirm()

  if (!proceed) {
    console.log("Restore cancelled.")
    process.exit(0)
  }

  const command = `mysql -h ${DB_HOST} -u ${DB_USER} ${DB_PASSWORD ? `-p${DB_PASSWORD}` : ""} ${DB_NAME} < "${filePath}"`

  console.log("Starting restore...")

  exec(command, (error) => {
    if (error) {
      console.error("Restore failed:", error)
      process.exit(1)
    }

    console.log("Restore completed successfully.")
    process.exit(0)
  })
}

run()
