import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  countUnreadContactMessages,
  readAllContactMessages,
} from "@/lib/contact-messages-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("count") === "unread") {
    const count = await countUnreadContactMessages();
    return NextResponse.json(
      { count },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  const messages = await readAllContactMessages();
  return NextResponse.json(messages, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
