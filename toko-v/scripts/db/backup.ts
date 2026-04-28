import { exec } from "child_process"
import fs from "fs"
import path from "path"

const DB_NAME = process.env.DATABASE_NAME || "toko_dev"
const DB_USER = process.env.DATABASE_USER || "root"
const DB_PASSWORD = process.env.DATABASE_PASSWORD || ""
const DB_HOST = process.env.DATABASE_HOST || "127.0.0.1"

function timestamp() {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, "0")

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`
}

async function run() {
  const backupDir = path.resolve("backups")

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir)
  }

  const fileName = `db-backup-${timestamp()}.sql`
  const filePath = path.join(backupDir, fileName)

  const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} ${DB_PASSWORD ? `-p${DB_PASSWORD}` : ""} ${DB_NAME} > "${filePath}"`

  console.log("Starting backup...")
  console.log(`Output: ${filePath}`)

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Backup failed:", error)
      process.exit(1)
    }

    console.log("Backup completed successfully.")
  })
}

run()
