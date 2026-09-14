-- =============================================================
-- Álbum de Recuerdos — Supabase Database Schema
-- =============================================================
-- Run this SQL in the Supabase SQL Editor.
-- This script is IDEMPOTENT: you can run it on a fresh project or on
-- an existing one to apply the shared-album (anonymous) access setup.
-- =============================================================

-- Enum type for scrapbook item kinds
DO $$
BEGIN
  CREATE TYPE scrapbook_item_type AS ENUM (
    'photo',
    'video',
    'flower',
    'note',
    'tape',
    'stamp'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------
-- Table: pages
-- -----------------------------------------------
-- Stores each memory page in the album.
CREATE TABLE IF NOT EXISTS pages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  title       TEXT,
  narrative   TEXT,
  font_family TEXT CHECK (font_family IN ('serif', 'handwriting', 'sans')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Type of page leaf: 'story' (text + song) or 'photo_caption' (image collage)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS page_type TEXT NOT NULL DEFAULT 'story';

-- Spotify embed URL for the story (text) page
ALTER TABLE pages ADD COLUMN IF NOT EXISTS spotify_url TEXT;

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages (user_id);

-- -----------------------------------------------
-- Table: scrapbook_items
-- -----------------------------------------------
-- Stores individual items (photos, stickers, notes, etc.) placed on a page.
CREATE TABLE IF NOT EXISTS scrapbook_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id    UUID NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
  type       scrapbook_item_type NOT NULL,
  url        TEXT,
  caption    TEXT,
  rotation   REAL DEFAULT 0,
  x          REAL DEFAULT 0,
  y          REAL DEFAULT 0,
  properties JSONB DEFAULT '{}'::jsonb
);

-- Index for fast lookups by page
CREATE INDEX IF NOT EXISTS idx_scrapbook_items_page_id ON scrapbook_items (page_id);

-- -----------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------
-- The album is SHARED and publicly editable (no login), so all anon
-- requests are allowed to read and write the album tables.
-- ------------------------------------------------------------------
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrapbook_items ENABLE ROW LEVEL SECURITY;

-- Drop the old per-user policies (auth-based) if they exist
DROP POLICY IF EXISTS "Users can view their own pages" ON pages;
DROP POLICY IF EXISTS "Users can insert their own pages" ON pages;
DROP POLICY IF EXISTS "Users can update their own pages" ON pages;
DROP POLICY IF EXISTS "Users can delete their own pages" ON pages;
DROP POLICY IF EXISTS "Users can view items on their own pages" ON scrapbook_items;
DROP POLICY IF EXISTS "Users can insert items on their own pages" ON scrapbook_items;
DROP POLICY IF EXISTS "Users can update items on their own pages" ON scrapbook_items;
DROP POLICY IF EXISTS "Users can delete items on their own pages" ON scrapbook_items;

-- Shared album: everyone can read the pages
CREATE POLICY "Shared album - read pages"
  ON pages FOR SELECT USING (true);

-- Shared album: everyone can add pages
CREATE POLICY "Shared album - insert pages"
  ON pages FOR INSERT WITH CHECK (true);

-- Shared album: everyone can update pages
CREATE POLICY "Shared album - update pages"
  ON pages FOR UPDATE USING (true);

-- Shared album: everyone can delete pages
CREATE POLICY "Shared album - delete pages"
  ON pages FOR DELETE USING (true);

-- Shared album: everyone can read items
CREATE POLICY "Shared album - read items"
  ON scrapbook_items FOR SELECT USING (true);

-- Shared album: everyone can add items
CREATE POLICY "Shared album - insert items"
  ON scrapbook_items FOR INSERT WITH CHECK (true);

-- Shared album: everyone can update items
CREATE POLICY "Shared album - update items"
  ON scrapbook_items FOR UPDATE USING (true);

-- Shared album: everyone can delete items
CREATE POLICY "Shared album - delete items"
  ON scrapbook_items FOR DELETE USING (true);

-- ------------------------------------------------------------------
-- Grants (in case the project's default privileges are not applied)
-- ------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE scrapbook_items TO anon, authenticated;

-- =============================================================
-- Storage: bucket for photos & videos
-- =============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('album-media', 'album-media', true)
ON CONFLICT (id) DO NOTHING;

-- Make the storage policies idempotent
DROP POLICY IF EXISTS "Public media read" ON storage.objects;
DROP POLICY IF EXISTS "Public media insert" ON storage.objects;
DROP POLICY IF EXISTS "Public media update" ON storage.objects;
DROP POLICY IF EXISTS "Public media delete" ON storage.objects;

-- Anyone can view the media of the shared album
CREATE POLICY "Public media read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'album-media');

-- Anyone can upload photos/videos to the shared album
CREATE POLICY "Public media insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'album-media');

-- Anyone can overwrite existing media
CREATE POLICY "Public media update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'album-media');

-- Anyone can remove media
CREATE POLICY "Public media delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'album-media');