"use client";

import { CalendarCheck, GraduationCap, Users } from "lucide-react";
import { InsightCard, Panel, ReportMini } from "../ui";
import type { SchoolData } from "../types";

export function DashboardView({
  data,
  averageAttendance,
  teachers,
  attendants,
}: {
  data: SchoolData;
  averageAttendance: number;
  teachers: number;
  attendants: number;
}) {
  const latestReports = data.reports.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InsightCard icon={GraduationCap} label="Students" value={data.students.length} detail="Active learner profiles" tone="emerald" />
        <InsightCard icon={Users} label="Teachers" value={teachers} detail={`${attendants} attendance staff`} tone="indigo" />
        <InsightCard icon={CalendarCheck} label="Attendance" value={`${averageAttendance}%`} detail="Average student presence" tone="amber" />
        {/* <InsightCard icon={Activity} label="Average score" value={`${averageScore}%`} detail="Across submitted reports" tone="rose" /> */}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel title="School Pulse" subtitle="Cohort health by attendance and performance">
          <div className="space-y-4">
            {data.students.slice(0, 6).map((student) => (
              <div key={student.id} className="grid gap-3 rounded-2xl border border-zinc-200 p-4 md:grid-cols-[1fr_160px] md:items-center">
                <div>
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-sm text-zinc-500">{student.studentId} · {student.year}</p>
                </div>
                {/* <ProgressBar value={student.attendance} label={`${student.attendance}% attendance`} /> */}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent Reports" subtitle="Latest marks entered by teachers">
          <div className="space-y-3">
            {latestReports.map((report) => (
              <ReportMini key={report.id} report={report} data={data} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
