import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "gif"];

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

function contentTypeFor(ext: string, fileType: string): string {
  if (fileType && ALLOWED_TYPES.includes(fileType)) return fileType;
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

function mediaProxyUrl(pathname: string): string {
  return `/api/media/${pathname
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/")}`;
}

function blobErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return "Bilinmeyen Blob hatası";
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Dosya okunamadı. Boyut çok büyük olabilir (max 8 MB)." },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Dosya çok büyük. En fazla 8 MB yükleyin." },
      { status: 400 }
    );
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const extOk = ALLOWED_EXT.includes(ext);
  const typeOk = !file.type || ALLOWED_TYPES.includes(file.type);

  if (!typeOk && !extOk) {
    return NextResponse.json(
      { error: "Sadece JPG, PNG, WebP veya GIF yüklenebilir" },
      { status: 400 }
    );
  }

  const safeExt = extOk ? ext : "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
  const pathname = `odonexo/products/${filename}`;
  const contentType = contentTypeFor(safeExt, file.type);
  const bytes = Buffer.from(await file.arrayBuffer());

  const token = blobToken();
  const onVercel = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
  );

  if (token || onVercel) {
    const attempts: Array<"private" | "public"> = ["private", "public"];
    const errors: string[] = [];

    for (const access of attempts) {
      try {
        const blob = await put(pathname, bytes, {
          access,
          contentType,
          addRandomSuffix: false,
          ...(token ? { token } : {}),
        });

        // Private store → site üzerinden proxy; public store → doğrudan URL
        const url =
          access === "private" ? mediaProxyUrl(blob.pathname || pathname) : blob.url;

        return NextResponse.json({ url, access, pathname: blob.pathname });
      } catch (err) {
        const msg = blobErrorMessage(err);
        console.error(`Blob görsel yükleme hatası (${access}):`, msg);
        errors.push(`${access}: ${msg}`);
      }
    }

    return NextResponse.json(
      {
        error: `Görsel Blob'a yüklenemedi. ${errors.join(" | ")}`,
      },
      { status: 500 }
    );
  }

  try {
    const uploadDir = path.join(process.cwd(), "public", "products", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), bytes);
    return NextResponse.json({ url: `/products/uploads/${filename}` });
  } catch (err) {
    console.error("Yerel görsel yükleme hatası:", err);
    return NextResponse.json(
      { error: "Görsel yüklenemedi" },
      { status: 500 }
    );
  }
}
