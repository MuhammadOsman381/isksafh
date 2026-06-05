"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Database, Loader2, LogOut, Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { pageTitle, tabs } from "../constants";
import { LoadingState, StatusPill } from "../ui";
import type { Role, Tab, User } from "../types";
import Image from "next/image";

export function SchoolShell({
  role,
  currentUser,
  activeTab,
  setActiveTab,
  saving,
  loading,
  notice,
  source,
  onLogout,
  children,
}: {
  role: Role;
  currentUser: User | null;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  saving: boolean;
  loading: boolean;
  notice: string;
  source: "demo" | "supabase";
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const visibleTabs = tabs.filter((tab) => {
    if (role === "admin") return !["marks", "attendance"].includes(tab.id);
    if (role === "teacher") return ["students", "marks"].includes(tab.id);
    if (role === "attendent") return ["students", "attendance"].includes(tab.id);
    return true;
  });

  return (
    <main className="min-h-screen bg-[var(--background)] text-zinc-950">
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="text-center">
            <p className="text-xs font-medium text-zinc-500">ISKSAFH</p>
            {/* <p className="text-sm font-semibold text-zinc-950">School OS</p> */}
          </div>
          <button
            onClick={onLogout}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </header>

        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm lg:hidden"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-zinc-800 bg-zinc-950 px-5 py-5 text-white shadow-[24px_0_70px_rgba(24,24,27,0.24)] transition-transform duration-300 lg:z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl  shadow">
                {/* <GraduationCap size={24} />
                 */}
                <Image
                  src="/logo.jpeg"
                  alt="Logo" width={55} height={55} className="rounded-full" />
              </div>
              <div>
                <h1 className=" font-semibold text-lg">ISKSAFH</h1>
                {/* <h1 className="text-lg font-semibold">School OS</h1> */}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Signed in</p>
            <p className="mt-2 font-semibold">{currentUser?.name ?? role}</p>
            <p className="mt-1 text-sm capitalize text-zinc-400">
              {role === "attendent" ? "Registrar" : role} portal
            </p>
          </div>

          <nav className="mt-6 space-y-1">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${activeTab === tab.id
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <button
            onClick={onLogout}
            className="mt-8 flex w-full items-center gap-3 rounded-xl border border-white/10 px-3 py-3 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </aside>

        <section className={`min-w-0 px-4 py-4 transition-[margin] duration-300 sm:px-6 lg:px-8 ${sidebarOpen ? "lg:ml-[280px]" : "lg:ml-0"}`}>
          <div className="mx-auto max-w-[1500px]">
            <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen((open) => !open)}
                    aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                    className="hidden size-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50 lg:inline-flex"
                  >
                    {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                  <span>Student management</span>
                  <ChevronRight size={15} />
                  <span className="capitalize">{activeTab}</span>
                </div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                  {pageTitle(activeTab)}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill icon={Database} label={source === "supabase" ? "Supabase connected" : "Demo mode"} />
                {saving ? <StatusPill icon={Loader2} label="Saving" spin /> : null}
                {notice ? <StatusPill icon={Sparkles} label={notice} /> : null}
              </div>
            </header>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="py-6"
              >
                {loading ? <LoadingState /> : children}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}
