import type { Bindings, TgMessage } from '../types/types';
import type { Telegram } from '../libs/telegram';
import { listGroups, countGroups, getGroup } from '../libs/db';
import { esc } from '../utils/message';

export async function handleGroups(env: Bindings, tg: Telegram, msg: TgMessage) {
  const chatId = msg.chat.id;
  const isPrivate = msg.chat.type === 'private';

  if (!isPrivate) {
    const current = await getGroup(env.DB, chatId);
    const syncStatus = current?.universalSync ? '✅ Enabled' : '❌ Disabled';
    return void (await tg.reply(
      chatId,
      `📋 <b>Group Info</b>\n\n` +
        `• <b>Title:</b> ${esc(msg.chat.title || 'Untitled')}\n` +
        `• <b>Chat ID:</b> <code>${chatId}</code>\n` +
        `• <b>Universal Sync:</b> ${syncStatus}\n` +
        `• <b>Database Status:</b> ${esc(current?.status || 'active')}`,
    ));
  }

  const [totalActive, groups] = await Promise.all([
    countGroups(env.DB, 'active'),
    listGroups(env.DB, { status: 'active', limit: 20 }),
  ]);

  if (groups.length === 0) {
    return void (await tg.reply(chatId, 'The bot is not currently active in any groups.'));
  }

  let text = `📋 <b>Connected Groups (${totalActive} active)</b>\n\n`;

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const syncIcon = g.universalSync ? '🔄' : '▫️';
    const link = g.username ? ` (@${esc(g.username)})` : '';
    text += `${i + 1}. <b>${esc(g.title)}</b>${link}\n   ID: <code>${g.chatId}</code> | Sync: ${syncIcon} ${g.universalSync ? 'On' : 'Off'}\n\n`;
  }

  if (totalActive > groups.length) {
    text += `<i>...and ${totalActive - groups.length} more</i>`;
  }

  await tg.reply(chatId, text);
}
