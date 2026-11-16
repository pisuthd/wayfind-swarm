'use client';

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-3xl px-6 py-14 md:py-20">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-ink/70">
        How it works
      </p>
      <h2 className="mt-4 text-center font-brico text-4xl font-bold md:text-5xl">
        It feels like texting your team.
      </h2>
      <div className="mx-auto mt-12 max-w-xl space-y-4">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-navy px-5 py-3.5 text-sm text-white">
          Build me a booking page for my restaurant, with table management.
        </div>
        <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-mist px-5 py-3.5 text-sm">
          <span className="font-bold">PM</span>{' '}
          <span className="text-ink">
            · On it. <span className="font-semibold text-cta">@frontend</span> booking calendar with table
            management, <span className="font-semibold text-cta">@backend</span> reservation API.
          </span>
        </div>
        <div className="ml-8 w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-mist px-5 py-3.5 text-sm">
          <span className="font-bold">Frontend</span>{' '}
          <span className="text-ink">
            · <span className="font-semibold text-cta">@pm</span> done, calendar UI is live in the workspace.
          </span>
        </div>
        <div className="ml-8 w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-mist px-5 py-3.5 text-sm">
          <span className="font-bold">QA</span>{' '}
          <span className="text-ink">
            · <span className="font-semibold text-cta">@pm</span> 14/14 browser tests pass.
          </span>
        </div>
        <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-mist px-5 py-3.5 text-sm">
          <span className="font-bold">PM</span>{' '}
          <span className="text-ink">· Calendar built, API wired, tests green. Approve to ship?</span>
        </div>
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-cta px-5 py-3.5 text-sm text-white">
          Approved. Ship it.
        </div>
      </div>
    </section>
  );
}
