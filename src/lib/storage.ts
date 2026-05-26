import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/** Ensures the upload directory exists */
async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Saves an uploaded PDF file to public/uploads/
 * Returns the public URL path (e.g., /uploads/filename.pdf)
 */
export async function savePdf(file: File): Promise<string> {
  await ensureUploadDir();

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || '.pdf';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filePath = path.join(UPLOAD_DIR, safeName);

  await fs.writeFile(filePath, buffer);
  return `/uploads/${safeName}`;
}

/** Deletes a file by its public URL path */
export async function deletePdf(publicUrl: string): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), 'public', publicUrl);
    await fs.unlink(filePath);
  } catch {
    // Ignore missing files
  }
}
