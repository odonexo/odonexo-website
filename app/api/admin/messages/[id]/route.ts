import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  deleteContactMessage,
  getContactMessageById,
  updateContactMessage,
} from "@/lib/contact-messages-store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id } = await params;
  const message = await getContactMessageById(id);
  if (!message) {
    return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(message);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const updated = await updateContactMessage(id, {
    read: body.read !== undefined ? Boolean(body.read) : undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteContactMessage(id);
  if (!ok) {
    return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
