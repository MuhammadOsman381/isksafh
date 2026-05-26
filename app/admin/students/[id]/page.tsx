import { StudentSubjectsDetail } from "@/components/school/views/student-subjects-detail";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentSubjectsDetail studentId={id} />;
}
