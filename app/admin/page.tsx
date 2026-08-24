"use client";

import { useEffect, useState } from "react";
import AdminLogin from "@/components/AdminLogin";
import AdminPostList from "@/components/AdminPostList";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.ok))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <div className="admin-loading">加载中…</div>;

  return authed ? <AdminPostList /> : <AdminLogin onSuccess={() => setAuthed(true)} />;
}
