import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Saves an uploaded PDF file to local disk or S3/R2 cloud storage.
 * If STORAGE_PROVIDER is 's3' or 'r2' and env variables are present, it uses cloud storage.
 * Otherwise, it falls back to zero-cost local storage (/uploads/...).
 */
export async function savePdf(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || '.pdf';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

  // 1. Supabase Cloud Storage (Free 1GB PDF Bucket)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'project-pdfs';

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      const filePath = `projects/${safeName}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase Cloud Storage upload error, using local fallback:', err);
    }
  }

  // 2. Zero-cost Local Storage Fallback
  await ensureUploadDir();
  const localFilePath = path.join(UPLOAD_DIR, safeName);
  await fs.writeFile(localFilePath, buffer);
  return `/uploads/${safeName}`;
}

/** Deletes a file by its public URL path */
export async function deletePdf(publicUrl: string): Promise<void> {
  try {
    if (publicUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', publicUrl);
      await fs.unlink(filePath);
    }
  } catch {
    // Ignore errors for missing files
  }
}
