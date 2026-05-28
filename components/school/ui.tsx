"use client";

import { Database, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { SchoolData } from "./types";

type Tone = "emerald" | "indigo" | "amber" | "rose";

export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-[0_18px_50px_rgba(24,24,27,0.06)]">
      <div className="mb-5">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-zinc-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export function InsightCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Database;
  label: string;
  value: string | number;
  detail: string;
  tone: Tone;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-[0_18px_50px_rgba(24,24,27,0.06)] transition-colors hover:border-zinc-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={`flex size-11 items-center justify-center rounded-xl ${toneClass(tone)}`}>
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-5 text-sm text-zinc-500">{detail}</p>
    </motion.div>
  );
}

export function Metric({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className={`rounded-xl border p-4 ${toneClass(tone)}`}>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm">{label}</p>
    </div>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-[var(--surface-muted)] text-xs uppercase tracking-[0.14em] text-zinc-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={index} className="bg-white transition hover:bg-zinc-50/80">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 align-middle text-zinc-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-zinc-500">
                No records yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  required,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
        min={min}
        max={max}
        className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-zinc-950 outline-none transition focus:border-[var(--brand)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,118,110,0.12)]"
      />
    </label>
  );
}

export function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<string | { value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const normalized = options.map((item) =>
    typeof item === "string" ? { value: item, label: item } : item,
  );

  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-zinc-950 outline-none transition focus:border-[var(--brand)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,118,110,0.12)]"
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {normalized.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PrimaryButton({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <button disabled={disabled} className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(24,24,27,0.18)] transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60">
      {disabled ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
      {label}
    </button>
  );
}

export function IconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100"
    >
      <Trash2 size={16} />
    </button>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500 transition focus-within:border-[var(--brand)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(15,118,110,0.12)]">
      <Search size={17} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-zinc-950 outline-none placeholder:text-zinc-400"
      />
    </label>
  );
}

export function PersonCell({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-zinc-950">{title}</p>
      <p className="mt-0.5 truncate text-xs text-zinc-500">{subtitle}</p>
    </div>
  );
}

export function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold capitalize text-zinc-700">
      {label}
    </span>
  );
}

export function StatusPill({
  icon: Icon,
  label,
  dark,
  spin,
}: {
  icon: typeof Database;
  label: string;
  dark?: boolean;
  spin?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium ${dark ? "bg-white/10 text-white" : "border border-zinc-200 bg-white/90 text-zinc-700 shadow-sm"}`}>
      <Icon size={16} className={spin ? "animate-spin" : ""} />
      {label}
    </span>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-[120px]">
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-zinc-950"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

export function ReportMini({
  report,
  data,
  compact,
}: {
  report: SchoolData["reports"][number];
  data: SchoolData;
  compact?: boolean;
}) {
  const student = data.students.find((item) => item.id === report.studentId);
  const subject = data.subjects.find((item) => item.id === report.subjectId);
  const teacher = data.users.find((item) => item.id === report.teacherId);

  return (
    <div className={`rounded-xl border border-zinc-200 bg-white/80 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start justify-between gap-4">
        <PersonCell
          title={`${subject?.name ?? "Subject"} · ${report.percentage}%`}
          subtitle={`${student?.name ?? "Student"} by ${teacher?.name ?? "Teacher"}`}
        />
        <Badge label={report.attainment} />
      </div>
      {!compact ? (
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Effort: {report.effort} · Attainment: {report.attainment}
        </p>
      ) : null}
    </div>
  );
}

export function AssignmentList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="font-semibold text-zinc-950">{title}</p>
      <div className="mt-3 space-y-2">
        {items.length ? items.map((item) => (
          <p key={item} className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-600">
            {item}
          </p>
        )) : (
          <p className="text-sm text-zinc-500">No assignments yet.</p>
        )}
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white/95">
      <div className="w-full max-w-sm space-y-3 p-6">
        <div className="mx-auto mb-5 flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
          <Loader2 className="animate-spin" size={21} />
        </div>
        <div className="h-3 rounded-full bg-zinc-100" />
        <div className="h-3 w-4/5 rounded-full bg-zinc-100" />
        <div className="h-3 w-2/3 rounded-full bg-zinc-100" />
        <p className="pt-2 text-center text-sm font-medium text-zinc-500">Loading school workspace</p>
      </div>
    </div>
  );
}

function toneClass(tone: Tone) {
  const classes = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
  };
  return classes[tone];
}
