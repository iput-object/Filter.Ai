import type { Bindings } from '../types/types';
import { SPAM_QUESTIONS } from '../configs/jev';

export interface Verdict {
  isSpam: boolean;
  category: string;
}

export async function classify(env: Bindings, text: string): Promise<Verdict> {
  const raw: any = await env.AI.run('typesafe/jev' as any, {
    state: text,
    questions: SPAM_QUESTIONS,
  } as any);

  const answers = raw?.answers ?? raw?.result?.answers ?? raw?.response?.answers;
  const isSpam = answers?.is_spam?.value ?? raw?.is_spam ?? false;
  const category = answers?.category?.value ?? raw?.category ?? 'unknown';

  return {
    isSpam: isSpam === true,
    category: String(category),
  };
}
