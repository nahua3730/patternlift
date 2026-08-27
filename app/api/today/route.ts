import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbAll, dbOne } from "@/lib/db";
import { allProblems } from "@/lib/product";
import { getRepCounts } from "@/lib/rep-counts";
import { computeStreak } from "@/lib/streak";
import type { CurriculumPlan } from "@/lib/curriculum-agent";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const run = await dbOne<{ output_json: string; accepted_at: string; headline: string }>(
    `
      SELECT output_json, accepted_at
      FROM study_plan_runs
      WHERE user_id = ? AND status = 'accepted'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [user.id]
  );

  if (!run) {
    return NextResponse.json({ error: "No active study plan" }, { status: 404 });
  }

  const plan = JSON.parse(run.output_json) as CurriculumPlan;
  const acceptedAt = new Date(run.accepted_at);
  const daysSinceStart = Math.max(
    0,
    Math.floor((Date.now() - acceptedAt.getTime()) / 86_400_000)
  );
  const dayIndex = Math.min(daysSinceStart, plan.days.length - 1);
  const day = plan.days[dayIndex];

  const reps = await getRepCounts(user.id);

  const problems = day.problemIds
    .map((problemId) => allProblems.find((problem) => problem.id === problemId))
    .filter((problem): problem is (typeof allProblems)[number] => Boolean(problem))
    .map((problem) => ({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      reps: reps[problem.id] ?? 0
    }));

  const dueReviews = await dbAll<{
    id: string;
    problem_title: string;
    target_pattern_label: string;
    review_question: string;
    urgency: string;
    due_at: string;
  }>(
    `
      SELECT id, problem_title, target_pattern_label, review_question, urgency, due_at
      FROM review_items
      WHERE user_id = ? AND due_at <= ?
      ORDER BY due_at ASC
      LIMIT 5
    `,
    [user.id, new Date().toISOString()]
  );

  const checkinRows = await dbAll<{ checkin_date: string }>(
    `SELECT checkin_date FROM daily_checkins WHERE user_id = ? ORDER BY checkin_date DESC LIMIT 30`,
    [user.id]
  );
  const checkins = checkinRows.map((row) => row.checkin_date);
  const streak = computeStreak(checkins);

  return NextResponse.json({
    plan: {
      headline: plan.headline,
      rationale: plan.rationale,
      totalWeeks: plan.totalWeeks,
      dailyMinutes: plan.dailyMinutes,
      totalDays: plan.days.length,
      coachStyle: plan.coachStyle ?? "guided"
    },
    today: {
      dayNumber: day.dayNumber,
      weekNumber: day.weekNumber,
      patternLabel: day.patternLabel,
      studyMode: day.studyMode,
      problems
    },
    dueReviews: dueReviews.map((row) => ({
      id: row.id,
      problemTitle: row.problem_title,
      patternLabel: row.target_pattern_label,
      reviewQuestion: row.review_question,
      urgency: row.urgency
    })),
    streak,
    checkins
  });
}
