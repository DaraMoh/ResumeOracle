export async function extractTextFromFile(file: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractFromPDF(file);
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return extractFromDOCX(file);
  } else if (mimeType === "text/plain") {
    return file.toString("utf-8");
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
}

async function extractFromPDF(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues with Next.js server components
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
