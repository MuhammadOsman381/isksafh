import {
  Activity,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Role } from "@/lib/demo-data";
import type { Tab } from "./types";

export const today = new Date().toISOString().slice(0, 10);

export const tabs: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "teachers", label: "Users", icon: Users },
  { id: "subjects", label: "Subjects", icon: BookOpen },
  { id: "marks", label: "Marks", icon: Activity },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "reports", label: "Reports", icon: ShieldCheck },
];

export const roleCopy: Record<Role, string> = {
  admin: "Full control over users, students, subjects, reports and setup.",
  teacher: "Enter marks, review assigned subjects, and track performance.",
  attendent: "Record attendance and absence details for student cohorts.",
};

export const effortOptions = ["Excellent", "Good", "Satisfactory", "Needs Support"];
export const attainmentOptions = ["Mastered", "Secure", "Developing", "Emerging"];

export function pageTitle(tab: Tab) {
  const titles: Record<Tab, string> = {
    dashboard: "Command Dashboard",
    students: "Student Directory",
    teachers: "User Management",
    subjects: "Subjects & Years",
    marks: "Marks Entry",
    attendance: "Attendance Register",
    reports: "Report Cards",
  };
  return titles[tab];
}

export function ensureYears(years: string[]) {
  return years.length ? years : ["Year 7", "Year 8", "Year 9", "Year 10"];
}

export function option(value: string, label: string) {
  return { value, label };
}
