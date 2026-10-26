import type { GroupInfo, GroupRow, GroupSettings } from '../types/types';

function parseSettings(raw: string): GroupSettings {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function rowToGroupInfo(row: GroupRow): GroupInfo {
  return {
    chatId: row.chat_id,
    title: row.title,
    type: row.type,
    username: row.username ?? undefined,
    status: row.status,
    universalSync: row.universal_sync === 1,
    settings: parseSettings(row.settings),
    joinedAt: row.joined_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertGroup(
  db: D1Database,
  data: {
    chatId: number;
    title: string;
    type: string;
    username?: string;
    status?: 'active' | 'left' | 'kicked';
  },
): Promise<void> {
  const status = data.status ?? 'active';
  const username = data.username ?? null;

  await db
    .prepare(
      `INSERT INTO groups (chat_id, title, type, username, status, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, strftime('%s', 'now'))
       ON CONFLICT(chat_id) DO UPDATE SET
         title = excluded.title,
         type = excluded.type,
         username = excluded.username,
         status = excluded.status,
         updated_at = strftime('%s', 'now')`,
    )
    .bind(data.chatId, data.title, data.type, username, status)
    .run();
}

export async function updateGroupStatus(
  db: D1Database,
  chatId: number,
  status: 'active' | 'left' | 'kicked',
): Promise<void> {
  await db
    .prepare(
      `UPDATE groups
       SET status = ?1, updated_at = strftime('%s', 'now')
       WHERE chat_id = ?2`,
    )
    .bind(status, chatId)
    .run();
}

export async function getGroup(db: D1Database, chatId: number): Promise<GroupInfo | null> {
  const row = await db
    .prepare('SELECT * FROM groups WHERE chat_id = ?1')
    .bind(chatId)
    .first<GroupRow>();

  return row ? rowToGroupInfo(row) : null;
}

export async function updateGroupSettings(
  db: D1Database,
  chatId: number,
  updates: {
    universalSync?: boolean;
    settings?: Partial<GroupSettings>;
  },
): Promise<GroupInfo | null> {
  const existing = await getGroup(db, chatId);
  if (!existing) return null;

  const newUniversalSync =
    updates.universalSync !== undefined ? (updates.universalSync ? 1 : 0) : existing.universalSync ? 1 : 0;

  const newSettings = {
    ...existing.settings,
    ...(updates.settings || {}),
  };

  await db
    .prepare(
      `UPDATE groups
       SET universal_sync = ?1, settings = ?2, updated_at = strftime('%s', 'now')
       WHERE chat_id = ?3`,
    )
    .bind(newUniversalSync, JSON.stringify(newSettings), chatId)
    .run();

  return getGroup(db, chatId);
}

export async function listGroups(
  db: D1Database,
  filter?: {
    status?: 'active' | 'left' | 'kicked' | 'all';
    universalSyncOnly?: boolean;
    limit?: number;
    offset?: number;
  },
): Promise<GroupInfo[]> {
  const status = filter?.status ?? 'active';
  const limit = filter?.limit ?? 100;
  const offset = filter?.offset ?? 0;

  let query = 'SELECT * FROM groups';
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (filter?.universalSyncOnly) {
    conditions.push('universal_sync = 1');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const stmt = db.prepare(query);
  const { results } = await stmt.bind(...params).all<GroupRow>();

  return (results || []).map(rowToGroupInfo);
}

export async function countGroups(
  db: D1Database,
  status: 'active' | 'left' | 'kicked' | 'all' = 'active',
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM groups';
  const params: unknown[] = [];

  if (status !== 'all') {
    query += ' WHERE status = ?';
    params.push(status);
  }

  const result = await db.prepare(query).bind(...params).first<{ count: number }>();
  return result?.count ?? 0;
}
