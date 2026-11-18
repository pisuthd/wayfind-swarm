'use client';

const rows = [
  { model: 'DeepSeek V4.1 Flash', from: '$0.30' },
  { model: 'GLM 5.3 Flash', from: '$0.45' },
  { model: 'Muse Spark Open', from: '$1.25' },
  { model: 'Claude Haiku 5.5', from: '$0.15' },
  { model: 'GPT-6 Luna', from: '$0.15' },
  { model: 'GLM 5.3', from: '$1.40' },
  { model: 'Kimi K3.1 Pro', from: '$2.00' },
];

export default function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 pb-14 md:pb-20">
      <div className="band rounded-3xl px-6 py-16 text-white md:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">Pricing</p>
        <div className="mt-4 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-xl font-brico text-4xl font-bold md:text-5xl">
            Pay for what your team burns.
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-white/70">
            We resell inference from top providers at published rates, plus one flat fee. Nothing for
            seats.
          </p>
        </div>
        <div className="mt-10 grid gap-x-8 gap-y-3 text-sm md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <p key={r.model} className="flex justify-between border-b border-white/10 pb-3">
              <span className="text-white/70">{r.model}</span>
              <span className="font-semibold">from {r.from}</span>
            </p>
          ))}
        </div>
        <p className="mt-6 text-xs text-white/50">
          Early access: $1 free credit included, no card required.
        </p>
      </div>
    </section>
  );
}
