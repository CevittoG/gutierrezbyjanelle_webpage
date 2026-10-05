// /faq answer-length checks. Plain Node after a standalone tsc compile, like
// the engine tests. Every section lead and answer must open with the direct
// answer and run 40–60 words in English so an answer engine can quote one
// passage on its own; Spanish runs longer, so it only has to exist.

import { faqSections, faqs } from "../config/faq";

declare const process: { exit(code: number): never };

let failures = 0;
function check(name: string, cond: boolean): void {
  if (cond) console.log("  PASS  " + name);
  else {
    console.error("  FAIL  " + name);
    failures++;
  }
}

const words = (s: string): number => s.trim().split(/\s+/).filter((w) => /[A-Za-z0-9\u00C0-\u024F]/.test(w)).length;

for (const s of faqSections) {
  const n = words(s.lead.en);
  check(`lead "${s.id}" is 40–60 words (${n})`, n >= 40 && n <= 60);
  check(`lead "${s.id}" has Spanish`, words(s.lead.es) > 0 && words(s.title.es) > 0);
  check(`section "${s.id}" has questions`, faqs.some((f) => f.section === s.id));
}

const ids = new Set<string>();
for (const f of faqs) {
  const n = words(f.a.en);
  check(`answer "${f.id}" is 40–60 words (${n})`, n >= 40 && n <= 60);
  check(`answer "${f.id}" has Spanish`, words(f.a.es) > 0 && words(f.q.es) > 0);
  check(`answer "${f.id}" belongs to a section`, faqSections.some((s) => s.id === f.section));
  check(`id "${f.id}" is unique`, !ids.has(f.id));
  ids.add(f.id);
}

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) FAILED`);
  process.exit(1);
} else {
  console.log("All FAQ answer checks passed.");
}
