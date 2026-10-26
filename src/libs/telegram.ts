export class Telegram {
  constructor(private token: string) {}

  async call(method: string, body: Record<string, unknown>) {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { ok: boolean; description?: string };
    if (!json.ok) throw new Error(`${method} failed: ${json.description}`);
    return json;
  }

  reply(chatId: number, text: string, replyTo?: number) {
    return this.call('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_parameters: replyTo ? { message_id: replyTo } : undefined,
    });
  }

  deleteMessage(chatId: number, messageId: number) {
    return this.call('deleteMessage', { chat_id: chatId, message_id: messageId });
  }

  ban(chatId: number, userId: number) {
    return this.call('banChatMember', { chat_id: chatId, user_id: userId });
  }

  async getChatMember(chatId: number, userId: number) {
    const res = await this.call('getChatMember', { chat_id: chatId, user_id: userId });
    return (res as any).result as {
      status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
      user: { id: number; is_bot: boolean; first_name: string; username?: string };
    };
  }

  async isChatAdmin(chatId: number, userId: number): Promise<boolean> {
    try {
      const member = await this.getChatMember(chatId, userId);
      return member.status === 'creator' || member.status === 'administrator';
    } catch {
      return false;
    }
  }
}
