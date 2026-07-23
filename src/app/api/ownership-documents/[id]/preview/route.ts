import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnershipDocumentObject } from "@/features/listings/media-queries";
import { getCurrentUser } from "@/lib/auth/server";
import { createOwnershipDocumentPreview } from "@/lib/blob-storage";

export const dynamic = "force-dynamic";

type PreviewRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: PreviewRouteContext) {
  const [user, { id }] = await Promise.all([getCurrentUser(), context.params]);
  if (!user) {
    return NextResponse.json({ error: "Log ind for at se dokumentet." }, { status: 401 });
  }

  const validId = z.string().uuid().safeParse(id);
  if (!validId.success) {
    return NextResponse.json({ error: "Dokumentet blev ikke fundet." }, { status: 404 });
  }

  const document = await getOwnershipDocumentObject(user.id, validId.data);
  if (!document) {
    return NextResponse.json({ error: "Dokumentet blev ikke fundet." }, { status: 404 });
  }

  try {
    const previewUrl = await createOwnershipDocumentPreview(document.object_key);
    const response = NextResponse.redirect(previewUrl, 307);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Det private dokumentlager er ikke tilgængeligt." },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}

