-- =============================================================
-- Álbum de Recuerdos — Supabase Database Schema
-- =============================================================
-- Run this SQL in the Supabase SQL Editor to create the tables.
-- =============================================================

-- Enum type for scrapbook item kinds
CREATE TYPE scrapbook_item_type AS ENUM (
  'photo',
  'video',
  'flower',
  'note',
  'tape',
  'stamp'
);

-- -----------------------------------------------
-- Table: pages
-- -----------------------------------------------
-- Stores each memory page in the album.
CREATE TABLE pages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  title       TEXT,
  narrative   TEXT,
  font_family TEXT CHECK (font_family IN ('serif', 'handwriting', 'sans')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX idx_pages_user_id ON pages (user_id);

-- -----------------------------------------------
-- Table: scrapbook_items
-- -----------------------------------------------
-- Stores individual items (photos, stickers, notes, etc.) placed on a page.
CREATE TABLE scrapbook_items (
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
CREATE INDEX idx_scrapbook_items_page_id ON scrapbook_items (page_id);

-- -----------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrapbook_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pages
CREATE POLICY "Users can view their own pages"
  ON pages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pages"
  ON pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pages"
  ON pages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pages"
  ON pages FOR DELETE
  USING (auth.uid() = user_id);

-- Users can only manage items on their own pages
CREATE POLICY "Users can view items on their own pages"
  ON scrapbook_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pages WHERE pages.id = scrapbook_items.page_id AND pages.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert items on their own pages"
  ON scrapbook_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM pages WHERE pages.id = scrapbook_items.page_id AND pages.user_id = auth.uid()
  ));

CREATE POLICY "Users can update items on their own pages"
  ON scrapbook_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM pages WHERE pages.id = scrapbook_items.page_id AND pages.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items on their own pages"
  ON scrapbook_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM pages WHERE pages.id = scrapbook_items.page_id AND pages.user_id = auth.uid()
  ));
