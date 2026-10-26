export interface Bindings {
  AI: Ai;
  DB: D1Database;
  TELEGRAM_BOT_TOKEN: string;
  WEBHOOK_SECRET: string;
  TELEGRAM_LOG_CHANNEL?: string;
  ENVIRONMENT?: string;
}

export interface GroupSettings {
  autoDeleteSpam?: boolean;
  [key: string]: unknown;
}

export interface GroupRow {
  chat_id: number;
  title: string;
  type: string;
  username: string | null;
  status: 'active' | 'left' | 'kicked';
  universal_sync: number;
  settings: string;
  joined_at: number;
  updated_at: number;
}

export interface GroupInfo {
  chatId: number;
  title: string;
  type: string;
  username?: string;
  status: 'active' | 'left' | 'kicked';
  universalSync: boolean;
  settings: GroupSettings;
  joinedAt: number;
  updatedAt: number;
}

export interface TgUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TgChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TgChatMember {
  status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
  user: TgUser;
}

export interface TgChatMemberUpdated {
  chat: TgChat;
  from: TgUser;
  date: number;
  old_chat_member: TgChatMember;
  new_chat_member: TgChatMember;
}

export interface TgMessage {
  message_id: number;
  chat: TgChat;
  from?: TgUser;
  text?: string;
  caption?: string;
  story?: unknown;
  reply_to_message?: TgMessage;
  [key: string]: unknown;
}

export interface Update {
  update_id: number;
  message?: TgMessage;
  my_chat_member?: TgChatMemberUpdated;
  chat_member?: TgChatMemberUpdated;
}
