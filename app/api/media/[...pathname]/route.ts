import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ pathname: string[] }>;
}

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

/** Sadece ürün görselleri; sipariş/ayar JSON'ları servis edilmez. */
function isAllowedProductPath(pathname: string): boolean {
  return (
    pathname.startsWith("odonexo/products/") &&
    !pathname.includes("..") &&
    pathname.split("/").length >= 3
  );
}

export async function GET(request: Request, { params }: RouteParams) {
  const { pathname: parts } = await params;
  const pathname = parts.map((p) => decodeURIComponent(p)).join("/");

  if (!isAllowedProductPath(pathname)) {
    return NextResponse.json({ error: "Geçersiz yol" }, { status: 400 });
  }

  const token = blobToken();
  const ifNoneMatch = request.headers.get("if-none-match") || undefined;

  try {
    const result = await get(pathname, {
      access: "private",
      ...(token ? { token } : {}),
      ...(ifNoneMatch ? { ifNoneMatch } : {}),
    });

    if (!result) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control":
            result.blob.cacheControl || "public, max-age=31536000, immutable",
        },
      });
    }

    if (result.statusCode !== 200 || !result.stream) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Cache-Control":
          result.blob.cacheControl || "public, max-age=31536000, immutable",
        ETag: result.blob.etag,
        "Content-Disposition": result.blob.contentDisposition || "inline",
      },
    });
  } catch (err) {
    console.error("Ürün görseli okuma hatası:", err);
    return NextResponse.json(
      { error: "Görsel okunamadı" },
      { status: 500 }
    );
  }
}
