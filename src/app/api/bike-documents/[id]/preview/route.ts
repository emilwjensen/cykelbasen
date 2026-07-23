import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { createPrivateDocumentPreview } from "@/lib/blob-storage";
import { getApplicationDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Ugyldigt dokument." }, { status: 400 });
  }

  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      select document.object_key
      from public.bike_documents document
      join public.garage_bikes bike on bike.id = document.bike_id
      where document.id = ${id}::uuid
        and document.owner_id = ${user.id}
        and bike.owner_id = ${user.id}
      limit 1
    `,
  ]);
  const document = (
    results[1] as unknown as Array<{ object_key: string }>
  )[0];
  if (!document) {
    return NextResponse.json({ error: "Dokumentet findes ikke." }, { status: 404 });
  }

  try {
    const previewUrl = await createPrivateDocumentPreview(document.object_key);
    return NextResponse.redirect(previewUrl, 307);
  } catch {
    return NextResponse.json(
      { error: "Dokumentlageret er ikke konfigureret." },
      { status: 503 },
    );
  }
}
