"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProblemRow } from "@/components/fundamentals-series";
import { techniqueLibrary, type Technique } from "@/lib/techniques";

type Lang = "en" | "cn";

const LABELS = {
  en: {
    eyebrow: "Techniques",
    title: "A quick-reference library for the technique families you should keep reaching for.",
    subtitle:
      "This page turns common algorithm frameworks into practical prompts: when to think of them, what question to ask first, and what mistake beginners often make.",
    sourceNote:
      "Organized around the standard technique families taught across LeetCode prep resources (including Labuladong's essential-technique catalog) - every explanation here is written fresh for PatternLift's coaching workflow, not copied from any source.",
    whenToThink: "When to think of it",
    coreIdea: "Core idea",
    starterQuestion: "Starter question",
    commonTrap: "Common trap",
    quickTips: "Quick tips",
    recommended: "Recommended problems",
    noRecommended: "No matching problem in our catalog yet - this technique is here for reference.",
    close: "Close",
    count: (n: number) => `${n} techniques`
  },
  cn: {
    eyebrow: "技巧库",
    title: "一份速查手册，收录你应该反复用到的技巧套路。",
    subtitle: "把常见的算法框架变成实用的提示：什么时候该想到它、第一个该问自己的问题是什么、初学者常踩的坑是什么。",
    sourceNote:
      "内容围绕 LeetCode 备考中常见的标准技巧分类组织（包括 Labuladong 的核心技巧目录），但这里的每一段讲解都是为 PatternLift 重新原创撰写的，不是从任何来源直接照搬。",
    whenToThink: "什么时候该想到它",
    coreIdea: "核心思路",
    starterQuestion: "第一个该问的问题",
    commonTrap: "常见误区",
    quickTips: "速记要点",
    recommended: "推荐练习题",
    noRecommended: "我们的题库里暂时没有匹配的题目——这个技巧仅供参考。",
    close: "关闭",
    count: (n: number) => `共 ${n} 个技巧`
  }
} as const;

export function TechniqueLibrary({ reps }: { reps: Record<string, number> }) {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Lang>("en");
  const [selected, setSelected] = useState<Technique | null>(null);
  const t = LABELS[lang];

  useEffect(() => {
    const techId = searchParams.get("tech");
    if (!techId) return;
    const match = techniqueLibrary.find((technique) => technique.id === techId);
    if (match) setSelected(match);
  }, [searchParams]);

  return (
    <div className="grid gap-6">
      <div className="uiverse-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-ember">{t.eyebrow}</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-ink">{t.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">{t.subtitle}</p>
          </div>
          <div className="flex shrink-0 rounded-full border border-black/10 bg-mist p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`rounded-full px-3 py-1.5 transition ${lang === "en" ? "bg-ink text-white" : "text-black/60"}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("cn")}
              className={`rounded-full px-3 py-1.5 transition ${lang === "cn" ? "bg-ink text-white" : "text-black/60"}`}
            >
              中文
            </button>
          </div>
        </div>
        <p className="mt-4 text-xs text-black/45">
          {t.sourceNote} {t.count(techniqueLibrary.length)}.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {techniqueLibrary.map((technique) => (
          <button
            key={technique.id}
            type="button"
            onClick={() => setSelected(technique)}
            className="uiverse-panel flex flex-col items-start gap-1 p-4 text-left transition hover:border-black/20"
          >
            <span className="text-sm font-semibold text-ink">
              {lang === "cn" ? technique.titleCn : technique.title}
            </span>
            <span className="text-xs text-black/45">{lang === "cn" ? technique.title : technique.titleCn}</span>
          </button>
        ))}
      </section>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="uiverse-panel max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  {lang === "cn" ? selected.titleCn : selected.title}
                </h2>
                <p className="text-sm text-black/45">{lang === "cn" ? selected.title : selected.titleCn}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="shrink-0 rounded-full border border-black/10 bg-mist px-3 py-1.5 text-xs font-medium text-black/60 transition hover:border-black/24"
              >
                {t.close}
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-7 text-black/72">
              <p>
                <span className="font-semibold text-ink">{t.whenToThink}: </span>
                {lang === "cn" ? selected.whenToThinkCn : selected.whenToThink}
              </p>
              <p>
                <span className="font-semibold text-ink">{t.coreIdea}: </span>
                {lang === "cn" ? selected.coreIdeaCn : selected.coreIdea}
              </p>
              <p>
                <span className="font-semibold text-ink">{t.starterQuestion}: </span>
                {lang === "cn" ? selected.starterQuestionCn : selected.starterQuestion}
              </p>
              <p>
                <span className="font-semibold text-ink">{t.commonTrap}: </span>
                {lang === "cn" ? selected.commonTrapCn : selected.commonTrap}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40">{t.quickTips}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(lang === "cn" ? selected.quickTipsCn : selected.quickTips).map((tip) => (
                  <span
                    key={tip}
                    className="rounded-full border border-black/10 bg-mist px-3 py-2 text-xs font-medium text-black/70"
                  >
                    {tip}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40">{t.recommended}</p>
              {selected.representativeProblemIds.length > 0 ? (
                <div className="mt-2 grid gap-2">
                  {selected.representativeProblemIds.map((problemId) => (
                    <ProblemRow key={problemId} problemId={problemId} reps={reps} />
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-black/50">{t.noRecommended}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
