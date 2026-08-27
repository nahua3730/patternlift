"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProblemRow, episodeVideoUrl } from "@/components/fundamentals-series";
import { fundamentalsSeries, type FundamentalsEpisode } from "@/lib/fundamentals-series";

type ChatMessage = {
  id: string;
  speaker: "coach" | "user";
  text: string;
};

function introMessage(episode: FundamentalsEpisode): ChatMessage {
  return {
    id: "intro",
    speaker: "coach",
    text: `This step covers ${episode.titleEn}. Watch the video alongside, and ask me anything as you go - what a step does, why this technique fits, or complexity. Say "ready" when you want to move on to practicing.`
  };
}

export function FundamentalsEpisodeView({
  episode,
  reps
}: {
  episode: FundamentalsEpisode;
  reps: Record<string, number>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [introMessage(episode)]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([introMessage(episode)]);
    setDraft("");
    setError(null);
  }, [episode]);

  useEffect(() => {
    const node = conversationRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text || isLoading) return;

    setDraft("");
    setError(null);
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, speaker: "user", text };
    const coachMessageId = `coach-${Date.now()}`;
    setMessages((current) => [...current, userMessage, { id: coachMessageId, speaker: "coach", text: "" }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/fundamentals/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episode: episode.episode,
          userMessage: text,
          conversationHistory: messages.map((message) => ({ speaker: message.speaker, text: message.text }))
        })
      });

      if (!response.ok || !response.body) {
        throw new Error((await response.text()) || "Unable to reach the coach right now.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const visibleReply = reply.replace(/\*\*/g, "").trimStart();
        setMessages((current) =>
          current.map((message) => (message.id === coachMessageId ? { ...message, text: visibleReply } : message))
        );
      }
      reply += decoder.decode();
      const finalReply = reply.replace(/\*\*/g, "").trim();
      setMessages((current) =>
        current.map((message) =>
          message.id === coachMessageId
            ? { ...message, text: finalReply || "I didn't catch that - could you ask again?" }
            : message
        )
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reach the coach right now.");
      setMessages((current) => current.filter((message) => message.id !== coachMessageId));
    } finally {
      setIsLoading(false);
    }
  }, [draft, episode.episode, isLoading, messages]);

  const prevEpisode = fundamentalsSeries.find((ep) => ep.episode === episode.episode - 1);
  const nextEpisode = fundamentalsSeries.find((ep) => ep.episode === episode.episode + 1);
  const allProblemIds = [...episode.problemIds, ...(episode.relatedProblemIds ?? [])];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/fundamentals" className="text-sm font-medium text-black/60 transition hover:text-ink">
          ← All 27 steps
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={prevEpisode ? `/fundamentals/${prevEpisode.episode}` : "#"}
            aria-disabled={!prevEpisode}
            className={`rounded-full border border-black/10 px-3 py-2 text-xs font-medium transition ${
              prevEpisode ? "bg-mist text-black/72 hover:border-black/24" : "pointer-events-none bg-mist/50 text-black/30"
            }`}
          >
            ← Prev
          </Link>
          <Link
            href={nextEpisode ? `/fundamentals/${nextEpisode.episode}` : "#"}
            aria-disabled={!nextEpisode}
            className={`rounded-full border border-black/10 px-3 py-2 text-xs font-medium transition ${
              nextEpisode ? "bg-mist text-black/72 hover:border-black/24" : "pointer-events-none bg-mist/50 text-black/30"
            }`}
          >
            Next →
          </Link>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-black/50">
          Step {episode.episode} of {fundamentalsSeries.length}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">{episode.titleCn}</h1>
        <p className="text-sm text-black/60">{episode.titleEn}</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="uiverse-panel overflow-hidden p-0">
          <div className="relative aspect-video w-full bg-black">
            {episode.bvid ? (
              <iframe
                src={`https://player.bilibili.com/player.html?bvid=${episode.bvid}&page=1&high_quality=1&danmaku=0`}
                allow="fullscreen; autoplay"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
                title={episode.titleEn}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white/70">
                No embedded video for this step yet -{" "}
                <a href={episodeVideoUrl(episode)} target="_blank" rel="noreferrer" className="ml-1 underline">
                  open it on Bilibili ↗
                </a>
              </div>
            )}
          </div>
          {episode.bvid ? (
            <p className="px-4 py-2 text-xs text-black/50">
              Video not loading?{" "}
              <a href={episodeVideoUrl(episode)} target="_blank" rel="noreferrer" className="underline">
                Open it on Bilibili directly ↗
              </a>
            </p>
          ) : null}
        </div>

        <div className="uiverse-panel flex max-h-[520px] flex-col p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-ember">Discuss this technique</p>
          <div ref={conversationRef} className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl px-3 py-2 text-sm leading-6 ${
                  message.speaker === "coach" ? "bg-mist text-black/80" : "ml-6 bg-ink text-white"
                }`}
              >
                {message.text || "…"}
              </div>
            ))}
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
            className="mt-3 flex items-center gap-2"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about this technique..."
              className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-ink outline-none focus:border-black/24"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !draft.trim()}
              className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      </section>

      {episode.note ? <p className="text-sm leading-6 text-black/60">{episode.note}</p> : null}

      {allProblemIds.length > 0 ? (
        <section className="uiverse-panel p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-lake">Ready to practice</p>
          <div className="mt-3 grid gap-2">
            {episode.problemIds.map((problemId) => (
              <ProblemRow key={problemId} problemId={problemId} reps={reps} />
            ))}
            {episode.relatedProblemIds?.map((problemId) => (
              <ProblemRow key={problemId} problemId={problemId} reps={reps} muted />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
