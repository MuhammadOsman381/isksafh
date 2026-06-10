import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import chromium from "@sparticuz/chromium";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import puppeteer, { type Browser } from "puppeteer-core";
import { buildReportStudents, type ReportStudent } from "@/lib/reports";
import { getSchoolData } from "@/lib/supabase-db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "local-school-secret");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let browser: Browser | null = null;

  try {
    const user = await getSessionUser(request);
    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { reportTitle?: unknown; studentIds?: unknown[] };
    const reportTitle = cleanText(body.reportTitle || "Student Report Card");
    const requestedStudentIds = Array.isArray(body.studentIds)
      ? new Set(body.studentIds.map((id) => String(id)))
      : null;

    const data = await getSchoolData();
    const students = buildReportStudents(data).filter((student) =>
      requestedStudentIds?.size ? requestedStudentIds.has(student.id) : true,
    );

    if (!students.length) {
      return NextResponse.json({ error: "No reports found" }, { status: 400 });
    }

    browser = await launchPdfBrowser();

    const page = await browser.newPage();
    await page.setContent(await renderReportHtml(reportTitle, students), {
      waitUntil: "domcontentloaded",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${students.length === 1 ? `${students[0].studentID}-report` : "student-reports"}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to generate reports PDF",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await browser?.close();
  }
}

async function launchPdfBrowser() {
  const serverless = isServerlessRuntime();
  const executablePath = serverless
    ? await chromium.executablePath()
    : getLocalChromeExecutablePath();

  if (!executablePath) {
    throw new Error(
      "Chrome executable not found. Set PUPPETEER_EXECUTABLE_PATH locally or deploy with @sparticuz/chromium.",
    );
  }

  return puppeteer.launch({
    args: serverless ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1240, height: 1754, deviceScaleFactor: 1 },
    executablePath,
    headless: true,
  });
}

function isServerlessRuntime() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function getLocalChromeExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;

  const localPaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];

  return localPaths.find((chromePath) => existsSync(chromePath));
}

async function getSessionUser(request: NextRequest) {
  const token = request.cookies.get("school_session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.sub !== "string") return null;
    if (payload.role !== "admin" && payload.role !== "teacher" && payload.role !== "attendent") {
      return null;
    }
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

async function renderReportHtml(reportTitle: string, students: ReportStudent[]) {
  const logoDataUrl = await getLogoDataUrl();

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(reportTitle)}</title>
    <style>
      @page {
        size: A4;
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #ffffff;
        color: #000000;
        font-family: Arial, Helvetica, sans-serif;
      }

      .page {
        min-height: 297mm;
        padding: 8mm 5mm;
        page-break-after: always;
        break-after: page;
      }

      .page:last-child {
        page-break-after: auto;
        break-after: auto;
      }

      .report-card {
        width: 200mm;
        min-height: 281mm;
        margin: 0 auto;
        border: 5px solid #000000;
        padding: 20px;
        background: #ffffff;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 12px;
      }

      .logo-wrap {
        width: 95px;
        flex: 0 0 95px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .logo {
        width: 95px;
        height: auto;
      }

      .school-copy {
        flex: 1;
        text-align: center;
      }

      h1 {
        margin: 0;
        font-size: 20px;
        line-height: 1.25;
        font-weight: 700;
      }

      .school-name {
        margin: 3px 0;
        font-size: 18px;
        line-height: 1.25;
        font-weight: 700;
        color: #16a34a;
      }

      .former {
        margin: 2px 0;
        font-size: 14px;
        font-weight: 700;
      }

      .contact {
        margin: 2px 0;
        font-size: 16px;
        line-height: 1.25;
      }

      .title {
        margin: 8px 0;
        text-align: center;
        font-size: 20px;
        font-weight: 700;
      }

      .student-info {
        margin-bottom: 16px;
      }

      .info-box {
        border: 1px solid #6b7280;
        padding: 4px;
        margin-bottom: 4px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        gap: 4px;
      }

      .info-row .info-box:first-child {
        flex: 1;
      }

      .info-row .info-box:last-child {
        width: 34%;
      }

      p {
        margin: 0;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #000000;
        font-size: 14px;
      }

      th,
      td {
        border: 1px solid #000000;
        padding: 4px;
      }

      th {
        padding: 8px;
        text-align: center;
        font-weight: 700;
      }

      .center {
        text-align: center;
      }

      .left {
        text-align: left;
      }

      .attendance {
        margin: 16px 0;
      }

      .bold {
        font-weight: 700;
      }

      .signatures {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .signature {
        margin-top: 20px;
        text-align: center;
      }

      .signature-line {
        width: 230px;
        margin: 0 auto;
        border-top: 1px solid #000000;
      }

      .footer {
        margin-top: 8px;
        display: flex;
        justify-content: center;
        gap: 4px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    ${students.map((student) => renderReportPage(reportTitle, student, logoDataUrl)).join("")}
  </body>
</html>`;
}

function renderReportPage(reportTitle: string, student: ReportStudent, logoDataUrl: string) {
  return `<main class="page">
  <article class="report-card">
    <header class="header">
      <div class="logo-wrap">
        <img class="logo" src="${logoDataUrl}" alt="School Logo" />
      </div>
      <div class="school-copy">
        <h1>King Salman Armed Forces Hospital in Northwestern Region</h1>
        <p class="school-name">The International School of KSAFH in Northwestern Region Tabuk</p>
        <p class="former">Formerly: The British International School of Tabuk</p>
        <p class="contact">P.O. Box 100 Tabuk, Kingdom of Saudi Arabia</p>
        <p class="contact">Tel: +966 (14) 4411088 x 83103 Email: admin@bis-tabuk.org</p>
      </div>
    </header>

    <h2 class="title">${escapeHtml(reportTitle)}</h2>

    <section class="student-info">
      <div class="info-box"><p><strong>Name:</strong> ${escapeHtml(student.name)}</p></div>
      <div class="info-row">
        <div class="info-box"><p><strong>Year:</strong> ${escapeHtml(student.year)}</p></div>
        <div class="info-box"><p><strong>Student No:</strong> ${escapeHtml(student.studentID)}</p></div>
      </div>
    </section>

    <section>
      <table>
        <thead>
          <tr>
            <th>Subjects</th>
            <th>Percentage (%)</th>
            <th>Grade</th>
            <th>Teachers</th>
          </tr>
        </thead>
        <tbody>
          ${
            student.subjects.length
              ? student.subjects.map(renderSubjectRow).join("")
              : '<tr><td class="center" colspan="4">No subjects assigned.</td></tr>'
          }
        </tbody>
      </table>
    </section>

    <section class="attendance">
      <table>
        <thead>
          <tr>
            <th>Attendance</th>
            <th>Days</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="bold">Number of sessions</td><td class="center">${student.attendance.sessions}</td></tr>
          <tr><td class="bold">Number of attendances</td><td class="center">${student.attendance.attendence}</td></tr>
          <tr><td class="bold">Number of authorised absences</td><td class="center">${student.attendance.authoriseAbsence}</td></tr>
          <tr><td class="bold">Number of unauthorised absences</td><td class="center">${student.attendance.unAuthoriseAbsence}</td></tr>
        </tbody>
      </table>
    </section>

    <section class="signatures">
      <div class="signature">
        <div class="signature-line"></div>
        <p class="bold">Dr. Khaled Khader Abudhaim</p>
        <p>Director General</p>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <p class="bold">Dr. Areej Faraj Al Atawi</p>
        <p>School Principal</p>
      </div>
    </section>
    <footer class="footer"><p>School Stamp</p><p>&amp;</p><p>Date</p></footer>
  </article>
</main>`;
}

function renderSubjectRow(row: ReportStudent["subjects"][number]) {
  return `<tr>
    <td class="left">${escapeHtml(row.subject)}</td>
    <td class="center">${escapeHtml(String(row.percentage))}</td>
    <td class="center">${escapeHtml(row.grade)}</td>
    <td class="left">${escapeHtml(row.teacher)}</td>
  </tr>`;
}

async function getLogoDataUrl() {
  const logoPath = path.join(process.cwd(), "public", "school-logo.jpeg");
  const logo = await readFile(logoPath);
  return `data:image/jpeg;base64,${logo.toString("base64")}`;
}

function cleanText(value: unknown) {
  return String(value ?? "").trim() || "Student Report Card";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
