"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { LoginScreen } from "@/components/school/auth/login-screen";
import { today } from "@/components/school/constants";
import { SchoolShell } from "@/components/school/layout/school-shell";
import { AttendanceView } from "@/components/school/views/attendance-view";
import { DashboardView } from "@/components/school/views/dashboard-view";
import { MarksView } from "@/components/school/views/marks-view";
import { ReportsView } from "@/components/school/views/reports-view";
import { StudentsView } from "@/components/school/views/students-view";
import { SubjectsView } from "@/components/school/views/subjects-view";
import { UsersView } from "@/components/school/views/users-view";
import type {
  AssignmentForm,
  NewAttendanceForm,
  NewReportForm,
  NewStudentForm,
  NewSubjectForm,
  NewUserForm,
  Role,
  SchoolData,
  Tab,
  User,
} from "@/components/school/types";

const initialData: SchoolData = {
  users: [],
  students: [],
  subjects: [],
  years: [],
  teacherSubjects: [],
  studentSubjects: [],
  reports: [],
  attendance: [],
  meta: { source: "demo", generatedAt: new Date().toISOString() },
};

const roleRoutes: Record<Role, string> = {
  admin: "/admin",
  teacher: "/teacher",
  attendent: "/attendee",
};

export default function SchoolDashboard({ expectedRole }: { expectedRole?: Role }) {
  const router = useRouter();
  const [data, setData] = useState<SchoolData>(initialData);
  const [role, setRole] = useState<Role | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  const [newUser, setNewUser] = useState<NewUserForm>({
    name: "",
    email: "",
    password: "",
    role: "teacher",
  });
  const [newStudent, setNewStudent] = useState<NewStudentForm>({
    studentId: "",
    name: "",
    year: "Year 7",
    guardian: "",
  });
  const [newSubject, setNewSubject] = useState<NewSubjectForm>({
    name: "",
    year: "Year 7",
  });
  const [newReport, setNewReport] = useState<NewReportForm>({
    studentId: "",
    subjectId: "",
    teacherId: "",
    percentage: "",
    effort: "Good",
    attainment: "Secure",
  });
  const [newAttendance, setNewAttendance] = useState<NewAttendanceForm>({
    studentId: "",
    date: today,
    status: "present",
    authorisedAbsence: "0",
    unauthorisedAbsence: "0",
  });
  const [assignment, setAssignment] = useState<AssignmentForm>({
    teacherId: "",
    studentId: "",
    subjectId: "",
    year: "Year 7",
  });

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/system", { cache: "no-store" }).then(
        (response) => response.json() as Promise<SchoolData>,
      ),
      fetch("/api/auth", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { user: User | null };
      }),
    ])
      .then(([schoolData, session]) => {
        if (!active) return;
        setData(schoolData);
        if (session?.user) {
          setCurrentUser(session.user);
          setRole(session.user.role);
          if (!expectedRole) {
            router.replace(roleRoutes[session.user.role]);
          } else if (session.user.role !== expectedRole) {
            router.replace(roleRoutes[session.user.role]);
          }
        }
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [expectedRole, router]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const teachers = data.users.filter((user) => user.role === "teacher");
  const attendants = data.users.filter((user) => user.role === "attendent");

  const averageAttendance = Math.round(
    data.students.reduce((sum, student) => sum + student.attendance, 0) /
      Math.max(data.students.length, 1),
  );

  const averageScore = Math.round(
    data.reports.reduce((sum, report) => sum + report.percentage, 0) /
      Math.max(data.reports.length, 1),
  );

  const filteredStudents = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return data.students;
    return data.students.filter((student) =>
      [student.name, student.studentId, student.year, student.guardian]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [data.students, query]);

  async function mutate(action: string, payload: Record<string, unknown>) {
    setSaving(true);
    const response = await fetch("/api/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const payloadData = (await response.json()) as SchoolData;
    setData(payloadData);
    setSaving(false);
    setNotice(data.meta.source === "demo" ? "Demo mode preview updated" : "Saved to Neon");
  }

  async function login(email: string, password: string) {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setNotice("Invalid login");
      return;
    }
    const payload = (await response.json()) as { user: User };
    setCurrentUser(payload.user);
    setRole(payload.user.role);
    setActiveTab("dashboard");
    router.push(roleRoutes[payload.user.role]);
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    setRole(null);
    setCurrentUser(null);
    setActiveTab("dashboard");
    router.push("/");
  }

  function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutate("create-user", newUser);
    setNewUser({ name: "", email: "", password: "", role: "teacher" });
  }

  function createStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutate("create-student", newStudent);
    setNewStudent({ studentId: "", name: "", year: newStudent.year, guardian: "" });
  }

  function createSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutate("create-subject", newSubject);
    setNewSubject({ name: "", year: newSubject.year });
  }

  function createReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutate("create-report", newReport);
    setNewReport({
      studentId: "",
      subjectId: "",
      teacherId: "",
      percentage: "",
      effort: "Good",
      attainment: "Secure",
    });
  }

  function createAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutate("create-attendance", newAttendance);
    setNewAttendance({
      studentId: "",
      date: today,
      status: "present",
      authorisedAbsence: "0",
      unauthorisedAbsence: "0",
    });
  }

  function assignTeacherSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutate("assign-subject", assignment);
  }

  function assignStudentSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutate("assign-student-subject", assignment);
  }

  if (!role) {
    return (
      <LoginScreen
        onLogin={login}
        loading={loading || checkingSession}
        source={data.meta.source}
        notice={notice}
      />
    );
  }

  if (expectedRole && role !== expectedRole) {
    return null;
  }

  return (
    <SchoolShell
      role={role}
      currentUser={currentUser}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      saving={saving}
      loading={loading}
      notice={notice}
      source={data.meta.source}
      onLogout={() => void logout()}
    >
      {activeTab === "dashboard" && (
        <DashboardView
          data={data}
          averageAttendance={averageAttendance}
          averageScore={averageScore}
          teachers={teachers.length}
          attendants={attendants.length}
        />
      )}
      {activeTab === "students" && (
        <StudentsView
          role={role}
          years={data.years}
          students={filteredStudents}
          query={query}
          setQuery={setQuery}
          newStudent={newStudent}
          setNewStudent={setNewStudent}
          createStudent={createStudent}
          deleteStudent={(id) => void mutate("delete-student", { id })}
        />
      )}
      {activeTab === "teachers" && (
        <UsersView
          users={data.users}
          newUser={newUser}
          setNewUser={setNewUser}
          createUser={createUser}
          deleteUser={(id) => void mutate("delete-user", { id })}
        />
      )}
      {activeTab === "subjects" && (
        <SubjectsView
          data={data}
          subjects={data.subjects}
          years={data.years}
          assignment={assignment}
          setAssignment={setAssignment}
          newSubject={newSubject}
          setNewSubject={setNewSubject}
          createSubject={createSubject}
          assignTeacherSubject={assignTeacherSubject}
          assignStudentSubject={assignStudentSubject}
          deleteSubject={(id) => void mutate("delete-subject", { id })}
        />
      )}
      {activeTab === "marks" && (
        <MarksView
          data={data}
          currentUser={currentUser}
          newReport={newReport}
          setNewReport={setNewReport}
          createReport={createReport}
        />
      )}
      {activeTab === "attendance" && (
        <AttendanceView
          data={data}
          newAttendance={newAttendance}
          setNewAttendance={setNewAttendance}
          createAttendance={createAttendance}
        />
      )}
      {activeTab === "reports" && <ReportsView data={data} />}
    </SchoolShell>
  );
}
