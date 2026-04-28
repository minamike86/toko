// src/app/admin/system/page.tsx

"use client"

import { useEffect, useState } from "react"

type MaintenanceInfo = {
  enabled: boolean
  updatedAt: string | null
  updatedBy: string | null
}

export default function SystemAdminPage() {
  const [data, setData] = useState<MaintenanceInfo | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchStatus() {
    const res = await fetch("/api/admin/maintenance")
    const json = await res.json()
    setData(json)
  }

  async function toggleMaintenance() {
    if (!data) return

    const confirmAction = confirm(
      data.enabled
        ? "Matikan maintenance mode?"
        : "Aktifkan maintenance mode? Semua write akan ditolak."
    )

    if (!confirmAction) return

    setLoading(true)

    await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        enabled: !data.enabled
      })
    })

    await fetchStatus()
    setLoading(false)
  }

  useEffect(() => {
  let mounted = true

  const load = async () => {
    const res = await fetch("/api/admin/maintenance")
    const json = await res.json()

    if (mounted) {
      setData(json)
    }
  }

  load()

  return () => {
    mounted = false
  }
}, [])



  if (!data) return <div>Loading...</div>

  return (
    <div style={{ padding: "24px" }}>
      <h1>System Administration</h1>

      <div style={{ marginTop: "20px" }}>
        <p>
          <strong>Maintenance Mode:</strong>{" "}
          {data.enabled ? "ON" : "OFF"}
        </p>

        <p>
          <strong>Last Updated At:</strong>{" "}
          {data.updatedAt
            ? new Date(data.updatedAt).toLocaleString()
            : "-"}
        </p>

        <p>
          <strong>Updated By:</strong>{" "}
          {data.updatedBy ?? "-"}
        </p>
      </div>

      <button
        onClick={toggleMaintenance}
        disabled={loading}
        style={{
          marginTop: "20px",
          padding: "10px 16px",
          backgroundColor: data.enabled ? "red" : "green",
          color: "white",
          border: "none",
          cursor: "pointer"
        }}
      >
        {data.enabled ? "Disable Maintenance" : "Enable Maintenance"}
      </button>
    </div>
  )
}
