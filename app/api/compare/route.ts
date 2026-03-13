import { NextRequest, NextResponse } from "next/server";

// Sammenligner innkommende tilbud med eksisterende forsikringer (steg 4)
export async function POST(request: NextRequest) {
  // TODO: implementer sammenligning av tilbud
  return NextResponse.json({ error: "Ikke implementert ennå" }, { status: 501 });
}
