import type { Bindings, TgMessage } from '../types/types';
import type { Telegram } from '../libs/telegram';
import { getGroup, updateGroupSettings } from '../libs/db';
import { esc } from '../utils/message';

export async function handleSettings(env: Bindings, tg: Telegram, msg: TgMessage) {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (!isGroup) {
    return void (await tg.reply(
      chatId,
      '⚙️ Group settings can only be managed inside a group or supergroup.',
    ));
  }

  const userId = msg.from?.id;
  if (!userId) {
    return void (await tg.reply(chatId, 'Cannot verify sender permissions.'));
  }

  const isAdmin = await tg.isChatAdmin(chatId, userId);
  if (!isAdmin) {
    return void (await tg.reply(chatId, '⚠️ Only group administrators can view or update settings.'));
  }

  const text = (msg.text || '').trim();
  const parts = text.split(/\s+/);
  const subCommand = parts[1]?.toLowerCase();
  const subValue = parts[2]?.toLowerCase();

  // Handle toggling universal sync: /settings sync on|off
  if (subCommand === 'sync') {
    if (subValue === 'on' || subValue === 'enable' || subValue === '1') {
      await updateGroupSettings(env.DB, chatId, { universalSync: true });
      return void (await tg.reply(
        chatId,
        `✅ <b>Universal Sync is now ENABLED</b> for <b>${esc(msg.chat.title || 'this group')}</b>.\n\n` +
          `Spammer bans can be synchronized with other groups that have Universal Sync enabled.`,
      ));
    } else if (subValue === 'off' || subValue === 'disable' || subValue === '0') {
      await updateGroupSettings(env.DB, chatId, { universalSync: false });
      return void (await tg.reply(
        chatId,
        `❌ <b>Universal Sync is now DISABLED</b> for <b>${esc(msg.chat.title || 'this group')}</b>.`,
      ));
    } else {
      return void (await tg.reply(
        chatId,
        `Usage: <code>/settings sync on</code> or <code>/settings sync off</code>`,
      ));
    }
  }

  const group = await getGroup(env.DB, chatId);
  const syncStatus = group?.universalSync ? '✅ Enabled' : '❌ Disabled';

  const message =
    `⚙️ <b>Settings for ${esc(msg.chat.title || 'Group')}</b>\n\n` +
    `• <b>Universal Sync:</b> ${syncStatus}\n` +
    `• <b>Chat ID:</b> <code>${chatId}</code>\n` +
    `• <b>Type:</b> ${esc(msg.chat.type)}\n\n` +
    `<b>Available commands:</b>\n` +
    `<code>/settings sync on</code> - Enable Universal Sync\n` +
    `<code>/settings sync off</code> - Disable Universal Sync`;

  await tg.reply(chatId, message);
}
