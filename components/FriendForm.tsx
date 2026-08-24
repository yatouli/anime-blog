"use client";

import { useState } from "react";

export default function FriendForm() {
  const [form, setForm] = useState({ name: "", url: "", avatar: "", desc: "" });
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">(
    "idle"
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;
    setState("submitting");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("bad");
      setState("done");
      setForm({ name: "", url: "", avatar: "", desc: "" });
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="friend-form glass">
        <h3>🎉 申请已提交！</h3>
        <p>感谢友链申请，管理员会尽快审核，通过后就会展示在页面上～</p>
        <button className="btn" onClick={() => setState("idle")}>
          再提交一个
        </button>
      </div>
    );
  }

  return (
    <form className="friend-form glass" onSubmit={submit}>
      <h3>🤝 申请友链</h3>
      <label>
        网站名称 *
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="例如：星野の小窝"
          required
        />
      </label>
      <label>
        网站地址 *
        <input
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="https://example.com"
          type="url"
          required
        />
      </label>
      <label>
        头像地址
        <input
          value={form.avatar}
          onChange={(e) => setForm({ ...form, avatar: e.target.value })}
          placeholder="https://…/avatar.png（留空则自动生成）"
        />
      </label>
      <label>
        一句话介绍
        <input
          value={form.desc}
          onChange={(e) => setForm({ ...form, desc: e.target.value })}
          placeholder="介绍一下你的小站吧～"
          maxLength={100}
        />
      </label>
      {state === "error" && <p className="form-error">提交失败，请稍后再试。</p>}
      <button className="btn" type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? "提交中…" : "提交申请"}
      </button>
    </form>
  );
}
