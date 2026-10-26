import type { Telegram } from '../libs/telegram';
import type { TgMessage } from '../types/types';

const DOC = `🤖 <b>Filter.AI - Spam Detection Bot</b>

AI-powered spam detection for Telegram groups.

<b>How to use:</b>
Reply to any message with <code>/report</code>. If it's spam, the user is banned.

<b>Requirements:</b>
• Bot must be admin with ban + delete permissions
• Only text/caption messages can be analyzed

<b>Commands:</b>
/start - Show this help
/report - Report a message (reply to it)
/settings - View or toggle group settings (e.g. Universal Sync)
/groups - Show connected groups

<b>Logs:</b> @filterAiLogs
<b>Source:</b> https://github.com/iput-object/Filter.Ai (open for contribution)`;

export const handleStart = (tg: Telegram, msg: TgMessage) =>
  tg.reply(msg.chat.id, DOC);
