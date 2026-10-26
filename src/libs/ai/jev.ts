import type { Bindings, Verdict } from '../../types/types';
import { JEV_MODEL, SPAM_QUESTIONS } from '../../configs/jev';

export async function classifyWithJev(env: Bindings, text: string): Promise<Verdict> {
  const raw: any = await env.AI.run(JEV_MODEL as any, {
    state: text,
    questions: SPAM_QUESTIONS,
  } as any);

  const answers = raw?.answers ?? raw?.result?.answers ?? raw?.response?.answers;
  if (answers?.is_spam) {
    return {
      isSpam: answers.is_spam.value === true,
      category: String(answers.category?.value || (answers.is_spam.value ? 'spam' : 'safe')),
    };
  }

  const out = raw?.result ?? raw?.response ?? raw;
  if (out?.is_spam !== undefined) {
    return {
      isSpam: out.is_spam === true,
      category: String(out.category || (out.is_spam ? 'spam' : 'safe')),
    };
  }

  throw new Error(`Unexpected Jev response format: ${JSON.stringify(raw)}`);
}
