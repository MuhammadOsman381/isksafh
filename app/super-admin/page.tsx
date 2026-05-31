"use client";

import { FormEvent, useState } from "react";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin";
  status: "active" | "blocked";
};

type AdminForm = {
  currentEmail: string;
  name: string;
  email: string;
  password: string;
  status: "active" | "blocked";
};

const emptyForm: AdminForm = {
  currentEmail: "",
  name: "Admin",
  email: "",
  password: "",
  status: "active" as const,
};

export default function SuperAdminPage() {
  const [accessKey, setAccessKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAdmins(key = accessKey) {
    setLoading(true);
    setNotice("");
    const response = await fetch("/api/super-admin", {
      cache: "no-store",
      headers: { "x-super-admin-key": key },
    });
    const payload = await response.json().catch(() => null) as { admins?: AdminUser[]; error?: string; detail?: string } | null;
    setLoading(false);

    if (!response.ok) {
      setNotice(payload?.detail ?? payload?.error ?? "Unable to unlock super admin");
      setUnlocked(false);
      return;
    }

    const nextAdmins = payload?.admins ?? [];
    setAdmins(nextAdmins);
    setUnlocked(true);
    const firstAdmin = nextAdmins[0];
    if (firstAdmin) {
      setForm({
        currentEmail: firstAdmin.email,
        name: firstAdmin.name,
        email: firstAdmin.email,
        password: firstAdmin.password,
        status: firstAdmin.status,
      });
    }
  }

  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadAdmins();
  }

  async function saveAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    const response = await fetch("/api/super-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-super-admin-key": accessKey,
      },
      body: JSON.stringify(form),
    });
    const payload = await response.json().catch(() => null) as { admin?: AdminUser; error?: string; detail?: string } | null;
    setLoading(false);

    if (!response.ok || !payload?.admin) {
      setNotice(payload?.detail ?? payload?.error ?? "Unable to update admin login");
      return;
    }

    setNotice("Admin login updated");
    setForm({
      currentEmail: payload.admin.email,
      name: payload.admin.name,
      email: payload.admin.email,
      password: payload.admin.password,
      status: payload.admin.status,
    });
    void loadAdmins(accessKey);
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
            <ShieldCheck size={16} />
            Hidden Super Admin
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Admin Login Control</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            This page is not linked in the app. Use it only to recover or edit the main admin login details.
          </p>
        </div>

        {!unlocked ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl">
            <form onSubmit={unlock} className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-zinc-200">
                Super admin access key
                <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3">
                  <LockKeyhole size={18} className="text-zinc-500" />
                  <input
                    value={accessKey}
                    onChange={(event) => setAccessKey(event.target.value)}
                    type="password"
                    className="min-w-0 flex-1 bg-transparent text-white outline-none"
                    required
                  />
                </div>
              </label>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-60" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
                Unlock
              </button>
            </form>
          </section>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl">
            <form onSubmit={saveAdmin} className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-zinc-200">
                Admin to edit
                <select
                  value={form.currentEmail}
                  onChange={(event) => {
                    const selected = admins.find((admin) => admin.email === event.target.value);
                    setForm(selected ? {
                      currentEmail: selected.email,
                      name: selected.name,
                      email: selected.email,
                      password: selected.password,
                      status: selected.status,
                    } : { ...form, currentEmail: event.target.value });
                  }}
                  className="h-11 rounded-xl border border-white/10 bg-zinc-900 px-3 text-white outline-none"
                >
                  <option value="">Create new admin</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.email}>{admin.email}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                <TextField label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} type="email" />
                <TextField label="Password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
                <label className="grid gap-2 text-sm font-medium text-zinc-200">
                  Status
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value === "blocked" ? "blocked" : "active" })}
                    className="h-11 rounded-xl border border-white/10 bg-zinc-900 px-3 text-white outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </label>
              </div>

              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-60" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
                Save admin login
              </button>
            </form>
          </section>
        )}

        {notice ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">{notice}</p>
        ) : null}
      </div>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-200">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        className="h-11 rounded-xl border border-white/10 bg-zinc-900 px-3 text-white outline-none"
        required
      />
    </label>
  );
}
