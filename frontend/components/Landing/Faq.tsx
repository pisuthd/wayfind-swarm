'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'How is this different from hiring AI bots one by one?',
    a: 'You don\u2019t configure roles or prompts. You pick a team with defined roles and workflows; a project manager plans and coordinates, specialists execute in one shared workspace.',
  },
  {
    q: 'How does pricing work?',
    a: 'Your team burns tokens on the models it uses, billed per million input tokens plus one flat service fee. No seats, no subscriptions. See the rate card above.',
  },
  {
    q: 'What happens to my data?',
    a: 'Work runs in disposable cloud sandboxes that are destroyed after the task. Everything you keep lives in your persistent workspace.',
  },
  {
    q: 'Which team should I start with?',
    a: 'Software Development if you\u2019re building something; Video Production for ads and content; Design Studio for brand and UI.',
  },
  {
    q: 'Do I stay in control?',
    a: 'Yes. Inspect progress anytime, and nothing destructive ships without your approval.',
  },
  {
    q: 'Which AI models do the teams use?',
    a: 'DeepSeek, GLM, Kimi, Muse Spark, and Qwen, picked per task for speed or quality.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-14 md:py-20">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-ink/70">FAQ</p>
      <h2 className="mt-4 text-center font-brico text-4xl font-bold md:text-5xl">
        Questions, answered.
      </h2>
      <div className="mt-10 divide-y divide-gray-200 border-y border-gray-200">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="font-brico text-lg font-bold">{f.q}</span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-ink transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <p className="overflow-hidden leading-relaxed text-ink">{f.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
