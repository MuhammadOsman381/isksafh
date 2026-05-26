export type Role = "admin" | "teacher" | "attendent";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: "active" | "blocked";
};

export type Student = {
  id: string;
  studentId: string;
  name: string;
  year: string;
  attendance: number;
  status: "active" | "watch" | "inactive";
};

export type Subject = {
  id: string;
  name: string;
  year: string;
};

export type TeacherSubject = {
  id: string;
  teacherId: string;
  subjectId: string;
  year: string;
};

export type StudentSubject = {
  id: string;
  studentId: string;
  subjectId: string;
  year: string;
};

export type Report = {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  percentage: number;
  effort: string;
  attainment: string;
  note: string;
};

export type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  status: "present" | "absent" | "authorised";
  authorisedAbsence: number;
  unauthorisedAbsence: number;
};

export type SchoolData = {
  users: User[];
  students: Student[];
  subjects: Subject[];
  years: string[];
  teacherSubjects: TeacherSubject[];
  studentSubjects: StudentSubject[];
  reports: Report[];
  attendance: AttendanceRecord[];
  meta: {
    source: "demo" | "supabase";
    generatedAt: string;
  };
};

export const demoData: SchoolData = {
  users: [
    {
      id: "u-admin",
      name: "Admin Office",
      email: "admin@isksafh.school",
      password: "admin123",
      role: "admin",
      status: "active",
    },
    {
      id: "u-teacher-1",
      name: "Ayesha Khan",
      email: "ayesha@isksafh.school",
      password: "teacher123",
      role: "teacher",
      status: "active",
    },
    {
      id: "u-teacher-2",
      name: "Omar Malik",
      email: "omar@isksafh.school",
      password: "teacher123",
      role: "teacher",
      status: "active",
    },
    {
      id: "u-attendent",
      name: "Attendance Desk",
      email: "attendance@isksafh.school",
      password: "attend123",
      role: "attendent",
      status: "active",
    },
  ],
  students: [
    {
      id: "s-1",
      studentId: "ISK-1001",
      name: "Hania Ahmed",
      year: "Year 7",
      attendance: 96,
      status: "active",
    },
    {
      id: "s-2",
      studentId: "ISK-1002",
      name: "Zain Raza",
      year: "Year 8",
      attendance: 91,
      status: "active",
    },
    {
      id: "s-3",
      studentId: "ISK-1003",
      name: "Mariam Noor",
      year: "Year 9",
      attendance: 84,
      status: "watch",
    },
    {
      id: "s-4",
      studentId: "ISK-1004",
      name: "Ibrahim Shah",
      year: "Year 10",
      attendance: 98,
      status: "active",
    },
  ],
  subjects: [
    { id: "sub-english-7", name: "English", year: "Year 7" },
    { id: "sub-maths-8", name: "Mathematics", year: "Year 8" },
    { id: "sub-science-9", name: "Science", year: "Year 9" },
    { id: "sub-history-10", name: "History", year: "Year 10" },
  ],
  years: ["Year 7", "Year 8", "Year 9", "Year 10"],
  teacherSubjects: [
    {
      id: "ts-1",
      teacherId: "u-teacher-1",
      subjectId: "sub-english-7",
      year: "Year 7",
    },
    {
      id: "ts-2",
      teacherId: "u-teacher-2",
      subjectId: "sub-maths-8",
      year: "Year 8",
    },
  ],
  studentSubjects: [
    { id: "ss-1", studentId: "s-1", subjectId: "sub-english-7", year: "Year 7" },
    { id: "ss-2", studentId: "s-2", subjectId: "sub-maths-8", year: "Year 8" },
  ],
  reports: [
    {
      id: "r-1",
      studentId: "s-1",
      subjectId: "sub-english-7",
      teacherId: "u-teacher-1",
      percentage: 88,
      effort: "Excellent",
      attainment: "Secure",
      note: "Strong written responses and careful presentation.",
    },
    {
      id: "r-2",
      studentId: "s-3",
      subjectId: "sub-science-9",
      teacherId: "u-teacher-2",
      percentage: 73,
      effort: "Good",
      attainment: "Developing",
      note: "Needs more confidence applying formulas independently.",
    },
  ],
  attendance: [
    {
      id: "a-1",
      studentId: "s-1",
      date: "2026-05-26",
      status: "present",
      authorisedAbsence: 0,
      unauthorisedAbsence: 0,
    },
    {
      id: "a-2",
      studentId: "s-3",
      date: "2026-05-26",
      status: "authorised",
      authorisedAbsence: 1,
      unauthorisedAbsence: 0,
    },
  ],
  meta: {
    source: "demo",
    generatedAt: new Date().toISOString(),
  },
};
