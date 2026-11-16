'use client';

export default function Showcase() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-4 pt-4">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-brico text-4xl font-bold md:text-5xl">
          One shared workspace. Zero status meetings.
        </h2>
        <p className="mt-4 leading-relaxed text-ink">
          Every plan, file, and test result lands in one place you can inspect anytime.
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
        <div className="flex items-center gap-1.5 border-b border-gray-200 bg-mist px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-3 hidden rounded-md bg-white px-3 py-1 text-xs text-ink sm:inline">
            app.wayfind.swarm/workspace
          </span>
        </div>
        <img
          src="/showcase.png"
          alt="Wayfind SWARM shared workspace preview"
          className="h-auto w-full"
        />
      </div>
    </section>
  );
}
