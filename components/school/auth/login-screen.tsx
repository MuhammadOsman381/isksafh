"use client";

import { BookOpen, CalendarCheck, Database, Loader2, ShieldCheck, Sparkles, UserRoundCheck } from "lucide-react";
import { motion } from "framer-motion";
import { FormEvent, useState } from "react";
import { roleCopy } from "../constants";
import { Metric, StatusPill, TextInput } from "../ui";
import type { Role } from "../types";

export function LoginScreen({
  onLogin,
  loading,
  source,
  notice,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  loading: boolean;
  source: "demo" | "supabase";
  notice: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onLogin(email, password);
  }


  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-950">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-8 md:grid-cols-[1fr_1.1fr] md:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm">
            <Sparkles size={16} className="text-emerald-600" />
            Premium Next.js rebuild
          </div>
          <h1 className="mt-6 max-w-2xl text-5xl font-semibold tracking-tight md:text-7xl">
            ISKSAFH Student Management System
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600">
            A clean school operations dashboard for administrators, teachers,
            and attendance staff with Supabase-ready storage and animated workflows.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <Metric label="Teachers" value="50" tone="emerald" />
            <Metric label="Students" value="1000" tone="amber" />
            <Metric label="Roles" value="3" tone="rose" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
          className="rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-2xl shadow-zinc-300/50"
        >
          <div className="rounded-[1.5rem] bg-zinc-950 p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-400">Choose portal</p>
                <h2 className="mt-1 text-2xl font-semibold">Sign in preview</h2>
              </div>
              <StatusPill icon={Database} label={source === "supabase" ? "Supabase" : "Demo"} dark />
            </div>
            <form onSubmit={submitLogin} className="mt-6 grid gap-3">
              <TextInput label="Email" value={email} onChange={setEmail} required type="email" />
              <TextInput label="Password" value={password} onChange={setPassword} required type="password" />
              {notice ? <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{notice}</p> : null}
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">
                <ShieldCheck size={17} />
                Login
              </button>
            </form>
            <div className="mt-5 space-y-3">
              {(["admin", "teacher", "attendent"] as Role[]).map((item) => (
                <button
                  key={item}
                  disabled={loading}
                  className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left transition hover:bg-white hover:text-zinc-950 disabled:cursor-wait disabled:opacity-70"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-zinc-950">
                      {item === "admin" ? <ShieldCheck size={21} /> : null}
                      {item === "teacher" ? <BookOpen size={21} /> : null}
                      {item === "attendent" ? <CalendarCheck size={21} /> : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold capitalize">{item == "attendent" ? "Registrar" :item}</p>
                      <p className="mt-1 text-sm text-zinc-400 group-hover:text-zinc-600">
                        {roleCopy[item]}
                      </p>
                    </div>
                  </div>
                  {loading ? <Loader2 className="animate-spin" size={19} /> : <UserRoundCheck size={19} />}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
