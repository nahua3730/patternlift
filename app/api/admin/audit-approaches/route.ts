import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbAll, dbExecute } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbAll<{ problem_id: string; approaches_json: string }>(
    `SELECT problem_id, approaches_json FROM problem_approaches`
  );

  const bad: { problemId: string; tierName: string; error: string }[] = [];

  for (const row of rows) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.approaches_json);
    } catch (error) {
      bad.push({ problemId: row.problem_id, tierName: "(unparseable JSON)", error: String(error) });
      continue;
    }
    if (!Array.isArray(parsed)) {
      bad.push({ problemId: row.problem_id, tierName: "(not an array)", error: "n/a" });
      continue;
    }
    for (const tier of parsed as Array<{ name?: string; code?: string }>) {
      try {
        // eslint-disable-next-line no-new-func
        new Function(String(tier.code ?? ""));
      } catch (error) {
        bad.push({
          problemId: row.problem_id,
          tierName: String(tier.name ?? "(unnamed)"),
          error: error instanceof Error ? error.message : String(error)
        });
        break;
      }
    }
  }

  return NextResponse.json({ totalRows: rows.length, badCount: bad.length, bad });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { problemIds?: string[] };
  const ids = body.problemIds ?? [];
  if (ids.length === 0) return NextResponse.json({ error: "No problemIds given" }, { status: 400 });

  for (const id of ids) {
    await dbExecute(`DELETE FROM problem_approaches WHERE problem_id = ?`, [id]);
  }

  return NextResponse.json({ deleted: ids.length });
}
