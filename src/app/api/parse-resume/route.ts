export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { createRequire } from "module";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ---------- PDF WORKER SETUP ---------- */

const require = createRequire(import.meta.url);
const workerPath = require.resolve("pdfjs-dist/build/pdf.worker.mjs");
PDFParse.setWorker(workerPath);

/* ---------- GEMINI SETUP ---------- */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/* ----------------------------------- */

export async function POST(request: Request) {
  let tempPath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    /* ---------- PDF ---------- */
    if (file.name.toLowerCase().endsWith(".pdf")) {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      text = result.text;
    }

    /* ---------- DOCX ---------- */
    else if (file.name.toLowerCase().endsWith(".docx")) {
      tempPath = path.join(os.tmpdir(), `${Date.now()}-${file.name}`);
      await fs.writeFile(tempPath, buffer);

      const result = await mammoth.extractRawText({ path: tempPath });
      text = result.value;
    }

    else {
      return NextResponse.json(
        { error: "Unsupported file type (PDF/DOCX only)" },
        { status: 400 }
      );
    }

    /* ---------- GEMINI STRUCTURING ---------- */

    const prompt = `
Extract structured resume data as valid JSON with this exact schema:

{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "skills": string[],
  "education": { degree?: string, institute?: string, year?: string }[],
  "experience": { company?: string, role?: string, duration?: string, description?: string }[],
  "projects": { name?: string, description?: string, tech?: string[] }[]
  "achievements": string[],
  "certifications": { name?: string, issuer?: string, year?: string }[]
}

Return ONLY JSON. No explanation.

Resume text:
${text}
`;

    const geminiResult = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  generationConfig: {
    responseMimeType: "application/json"
  }
});
    const responseText = geminiResult.response.text();

    let resumeJSON;
    try {
      resumeJSON = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: "Gemini returned invalid JSON", raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      resume: resumeJSON
    });

  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 }
    );
  } finally {
    if (tempPath) {
      await fs.unlink(tempPath).catch(() => {});
    }
  }
}
