"use client";

import { useEffect, useState } from "react";
import AdminLogin from "@/components/AdminLogin";
import SiteSettings from "@/components/SiteSettings";

export default function SettingsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.ok))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <div className="admin-loading">加载中…</div>;

  return authed ? (
    <SiteSettings />
  ) : (
    <AdminLogin onSuccess={() => setAuthed(true)} />
  );
}
