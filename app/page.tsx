import { FeatureCard } from "@/components/feature-card";
import { PatternDemo } from "@/components/pattern-demo";
import { ProductHeader } from "@/components/product-header";
import { productFeatures } from "@/lib/product";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <ProductHeader />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {productFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </section>

        <PatternDemo />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-black/10 bg-white/70 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-ember">
              MVP Loop
            </p>
            <ol className="mt-4 grid gap-4 text-sm text-black/75 sm:grid-cols-2">
              <li className="rounded-lg border border-black/10 bg-mist p-4">
                Save a problem and predict the pattern before seeing the answer.
              </li>
              <li className="rounded-lg border border-black/10 bg-mist p-4">
                Get layered hints instead of a full solution dump.
              </li>
              <li className="rounded-lg border border-black/10 bg-mist p-4">
                Log confusion points such as two pointers vs sliding window.
              </li>
              <li className="rounded-lg border border-black/10 bg-mist p-4">
                Review weak patterns with short recall drills over time.
              </li>
            </ol>
          </div>

          <div className="rounded-lg border border-black/10 bg-ink p-6 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-fern">
              What Makes It Different
            </p>
            <div className="mt-4 space-y-4 text-sm leading-6 text-white/78">
              <p>
                PatternLift is built around one specific beginner problem:
                understanding solutions without being able to recognize the
                pattern independently next time.
              </p>
              <p>
                The goal is not to be a generic AI chatbot. The goal is to
                diagnose confusion, teach the distinction, and bring the right
                review back later.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
