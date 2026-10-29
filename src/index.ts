import type { Bindings, Update } from './types/types';
import { Telegram } from './libs/telegram';
import { handleStart } from './handlers/start';
import { handleReport } from './handlers/report';
import { handleSettings } from './handlers/settings';
import { upsertGroup, updateGroupStatus } from './libs/db';

async function handleUpdate(update: Update, env: Bindings) {
  const tg = new Telegram(env.TELEGRAM_BOT_TOKEN);

  // 1. Handle bot membership updates (bot added to or removed from a group/channel)
  if (update.my_chat_member) {
    const chat = update.my_chat_member.chat;
    const newStatus = update.my_chat_member.new_chat_member.status;

    if (chat.type === 'group' || chat.type === 'supergroup' || chat.type === 'channel') {
      if (newStatus === 'administrator' || newStatus === 'member') {
        await upsertGroup(env.DB, {
          chatId: chat.id,
          title: chat.title || 'Untitled Group',
          type: chat.type,
          username: chat.username,
          status: 'active',
        });
      } else if (newStatus === 'left' || newStatus === 'kicked') {
        await updateGroupStatus(env.DB, chat.id, newStatus);
      }
    }
    return;
  }

  // 2. Handle incoming messages
  const msg = update.message;
  if (!msg) return;

  if (!msg.text) return;

  const cmd = msg.text.match(/^\/(\w+)(?:@\w+)?/)?.[1]?.toLowerCase();
  if (!cmd) return;

  // Track group presence only when a command is used
  if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
    await upsertGroup(env.DB, {
      chatId: msg.chat.id,
      title: msg.chat.title || 'Untitled Group',
      type: msg.chat.type,
      username: msg.chat.username,
      status: 'active',
    });
  }

  if (cmd === 'start') await handleStart(tg, msg);
  else if (cmd === 'report') await handleReport(env, tg, msg);
  else if (cmd === 'settings') await handleSettings(env, tg, msg);
}

export default {
  async fetch(req, env, ctx): Promise<Response> {
    const url = new URL(req.url);

    if (req.method !== 'POST' || url.pathname !== '/webhook') {
      return new Response('Filter.AI is running');
    }
    if (req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRET) {
      return new Response('Forbidden', { status: 403 });
    }

    const update = (await req.json()) as Update;
    ctx.waitUntil(handleUpdate(update, env).catch((e) => console.error('Update failed:', e)));
    return new Response('ok');
  },
} satisfies ExportedHandler<Bindings>;
