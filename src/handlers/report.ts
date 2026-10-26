import type { Bindings, TgMessage } from '../types';
import type { Telegram } from '../libs/telegram';
import { classify } from '../libs/classifier';
import { getGroup, listGroups } from '../libs/db';
import { esc, getKind, getText } from '../utils/message';

export async function handleReport(env: Bindings, tg: Telegram, msg: TgMessage) {
  const chatId = msg.chat.id;
  const target = msg.reply_to_message;

  if (!target) {
    return void (await tg.reply(chatId, 'Please reply to a message with /report to report it.'));
  }

  const text = getText(target);
  if (!text) {
    const kind = getKind(target);
    console.log('Unanalyzable message:', kind);
    return void (await tg.reply(
      chatId,
      kind === 'story'
        ? "I can't analyze Telegram stories yet. Telegram only sends a story reference, not its text."
        : `I can only analyze messages that contain text or a caption. Detected: ${kind}.`,
    ));
  }

  let verdict;
  try {
    verdict = await classify(env, text);
  } catch (e) {
    console.error('Analysis error:', e instanceof Error ? e.message : JSON.stringify(e));
    return void (await tg.reply(chatId, 'An error occurred while analyzing the message.'));
  }

  console.log('verdict:', verdict);

  if (!verdict.isSpam) {
    return void (await tg.reply(chatId, 'Message seems safe.'));
  }

  const user = target.from;
  if (!user) return void (await tg.reply(chatId, 'Spam, but I cannot identify the sender.'));

  try {
    await tg.deleteMessage(chatId, target.message_id);
    await tg.ban(chatId, user.id);
    await tg.reply(
      chatId,
      `Message analyzed as spam (${esc(verdict.category)}). User ${esc(user.first_name)} has been banned.`,
    );
  } catch (e) {
    console.error('Ban failed:', e instanceof Error ? e.message : e);
    return void (await tg.reply(
      chatId,
      `Message analyzed as spam, but I couldn't ban the user. Make sure I am an admin.`,
    ));
  }

  // Universal Sync: propagate ban to other groups with universal sync enabled
  try {
    const currentGroup = await getGroup(env.DB, chatId);
    if (currentGroup?.universalSync) {
      const syncGroups = await listGroups(env.DB, { status: 'active', universalSyncOnly: true });
      for (const group of syncGroups) {
        if (group.chatId !== chatId) {
          tg.ban(group.chatId, user.id).catch((err) =>
            console.error(`Universal sync ban failed for group ${group.chatId}:`, err),
          );
        }
      }
    }
  } catch (err) {
    console.error('Universal sync error:', err);
  }

  await logBan(env, tg, user, verdict.category, text);
}

async function logBan(
  env: Bindings,
  tg: Telegram,
  user: NonNullable<TgMessage['from']>,
  reason: string,
  text: string,
) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  if (!env.TELEGRAM_LOG_CHANNEL) {
    console.log('BAN', { id: user.id, username: user.username, reason, text });
    return;
  }
  try {
    await tg.call('sendMessage', {
      chat_id: env.TELEGRAM_LOG_CHANNEL,
      parse_mode: 'HTML',
      text:
        `User Banned Alert\n` +
        `User: <a href="tg://user?id=${user.id}">${esc(name)}</a>\n` +
        `Reason: ${esc(reason)}\n` +
        `Message: ${esc(text)}`,
    });
  } catch (e) {
    console.error('Log channel failed:', e instanceof Error ? e.message : e);
  }
}
