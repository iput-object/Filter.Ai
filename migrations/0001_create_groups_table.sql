-- Migration: 0001_create_groups_table.sql
-- Create table for storing groups and group-specific settings

CREATE TABLE IF NOT EXISTS groups (
  chat_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  username TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  universal_sync INTEGER NOT NULL DEFAULT 0,
  settings TEXT NOT NULL DEFAULT '{}',
  joined_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_universal_sync ON groups(universal_sync) WHERE status = 'active';
