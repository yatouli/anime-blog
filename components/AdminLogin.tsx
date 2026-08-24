"use client";

import { useState } from "react";

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onSuccess();
      } else {
        setError("密码错误，再试试？");
      }
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login glass">
      <div className="admin-login-icon">🔐</div>
      <h2>后台管理</h2>
      <p>输入管理密码进入（部署时请通过环境变量 ADMIN_PASSWORD 修改）</p>
      <form onSubmit={submit}>
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="管理密码"
          autoFocus
        />
        {error && <div className="form-error">{error}</div>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "验证中…" : "进入后台"}
        </button>
      </form>
    </div>
  );
}
