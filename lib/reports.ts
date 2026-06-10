import type { SchoolData } from "@/lib/demo-data";

export type ReportStudent = {
  id: string;
  name: string;
  year: string;
  studentID: string;
  subjects: Array<{
    subject: string;
    percentage: string | number;
    grade: string;
    teacher: string;
  }>;
  attendance: {
    sessions: number;
    attendence: number;
    authoriseAbsence: number;
    unAuthoriseAbsence: number;
  };
};

export function buildReportStudents(data: SchoolData): ReportStudent[] {
  return data.students.map((student) => {
    const assignedSubjects = data.studentSubjects
      .filter((assignment) => assignment.studentId === student.id)
      .map((assignment) => data.subjects.find((subject) => subject.id === assignment.subjectId))
      .filter(Boolean) as SchoolData["subjects"];
    const yearSubjectIds = new Set(
      data.teacherSubjects
        .filter((assignment) => assignment.year === student.year)
        .map((assignment) => assignment.subjectId),
    );
    const yearSubjects = data.subjects.filter((subject) => yearSubjectIds.has(subject.id));
    const reportSubjects = data.reports
      .filter((report) => report.studentId === student.id)
      .map((report) => data.subjects.find((subject) => subject.id === report.subjectId))
      .filter(Boolean) as SchoolData["subjects"];
    const subjectsForReport = assignedSubjects.length
      ? assignedSubjects
      : yearSubjects.length
        ? yearSubjects
        : reportSubjects;

    const subjects = [...subjectsForReport]
      .sort((first, second) =>
        first.name.localeCompare(second.name, undefined, { sensitivity: "base", numeric: true }),
      )
      .map((subject) => {
        const report = data.reports.find(
          (item) => item.studentId === student.id && item.subjectId === subject.id,
        );
        const teacher = report
          ? data.users.find((user) => user.id === report.teacherId)
          : findTeacherForSubject(data, subject.id);

        return {
          subject: subject.name,
          percentage: report?.percentage ?? "-",
          grade: report?.attainment ?? "-",
          teacher: teacher?.name ?? "-",
        };
      });

    const records = data.attendance.filter((record) => record.studentId === student.id);
    const latestRecord = records[0];
    const authoriseAbsence = Number(latestRecord?.authorisedAbsence || 0);
    const unAuthoriseAbsence = Number(latestRecord?.unauthorisedAbsence || 0);
    const attendenceTotal = Number(latestRecord?.attendances || 0);
    const sessions = latestRecord
      ? Number(latestRecord.sessions || attendenceTotal + authoriseAbsence + unAuthoriseAbsence)
      : 0;

    return {
      id: student.id,
      name: student.name,
      year: student.year,
      studentID: student.studentId,
      subjects,
      attendance: {
        sessions,
        attendence: latestRecord
          ? attendenceTotal
          : records.filter((record) => record.status === "present").length,
        authoriseAbsence,
        unAuthoriseAbsence,
      },
    };
  });
}

function findTeacherForSubject(data: SchoolData, subjectId: string) {
  const assignment = data.teacherSubjects.find((item) => item.subjectId === subjectId);
  return assignment ? data.users.find((user) => user.id === assignment.teacherId) : undefined;
}
