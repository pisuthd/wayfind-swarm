'use client';

const steps = [
  {
    n: '01',
    title: 'You describe the outcome',
    body: 'One sentence is enough. No roles to pick, no prompts to write.',
    active: true,
  },
  {
    n: '02',
    title: 'The team does the work',
    body: 'Planned, built, and tested — with handoffs handled for you.',
    active: false,
  },
  {
    n: '03',
    title: 'You approve the result',
    body: 'Inspect progress anytime. Nothing ships without you.',
    active: false,
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-t border-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-3 md:gap-8">
          {steps.map((s) => (
            <div key={s.n} className={`border-t-2 pt-6 ${s.active ? 'border-navy' : 'border-gray-200'}`}>
              <p className="font-brico text-sm font-bold text-ink/60">{s.n}</p>
              <p className="mt-3 font-brico text-2xl font-bold">{s.title}</p>
              <p className="mt-3 leading-relaxed text-ink">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
