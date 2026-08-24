/**
 * memoriesService.ts
 *
 * CRUD operations for pages and scrapbook_items against Supabase.
 * Each function returns `{ data, error }` following the Supabase convention.
 */

import { supabase } from './supabaseClient';
import type { Database } from './database.types';

// ---------------------------------------------------------------------------
// Type aliases for convenience
// ---------------------------------------------------------------------------
type PageRow = Database['public']['Tables']['pages']['Row'];
type PageInsert = Database['public']['Tables']['pages']['Insert'];
type PageUpdate = Database['public']['Tables']['pages']['Update'];
type ItemRow = Database['public']['Tables']['scrapbook_items']['Row'];
type ItemInsert = Database['public']['Tables']['scrapbook_items']['Insert'];
type ItemUpdate = Database['public']['Tables']['scrapbook_items']['Update'];

/** A page with its nested scrapbook items. */
export interface PageWithItems extends PageRow {
  scrapbook_items: ItemRow[];
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

/** Fetch all pages for a given user, including their scrapbook items. */
export async function fetchPages(userId: string) {
  const { data, error } = await supabase
    .from('pages')
    .select('*, scrapbook_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  return { data: data as unknown as PageWithItems[] | null, error };
}

/** Fetch a single page by ID, including its scrapbook items. */
export async function fetchPageById(pageId: string) {
  const { data, error } = await supabase
    .from('pages')
    .select('*, scrapbook_items(*)')
    .eq('id', pageId)
    .single();

  return { data: data as unknown as PageWithItems | null, error };
}

/** Create a new page. */
export async function createPage(page: PageInsert) {
  const { data, error } = await supabase
    .from('pages')
    .insert(page)
    .select()
    .single();

  return { data: data as PageRow | null, error };
}

/** Update an existing page. */
export async function updatePage(pageId: string, updates: PageUpdate) {
  const { data, error } = await supabase
    .from('pages')
    .update(updates)
    .eq('id', pageId)
    .select()
    .single();

  return { data: data as PageRow | null, error };
}

/** Delete a page (cascades to its scrapbook_items). */
export async function deletePage(pageId: string) {
  return supabase
    .from('pages')
    .delete()
    .eq('id', pageId);
}

// ---------------------------------------------------------------------------
// Scrapbook Items
// ---------------------------------------------------------------------------

/** Add one or more scrapbook items to a page. */
export async function createItems(items: ItemInsert[]) {
  const { data, error } = await supabase
    .from('scrapbook_items')
    .insert(items)
    .select();

  return { data: data as ItemRow[] | null, error };
}

/** Update an existing scrapbook item. */
export async function updateItem(itemId: string, updates: ItemUpdate) {
  const { data, error } = await supabase
    .from('scrapbook_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  return { data: data as ItemRow | null, error };
}

/** Delete a scrapbook item. */
export async function deleteItem(itemId: string) {
  return supabase
    .from('scrapbook_items')
    .delete()
    .eq('id', itemId);
}

// ---------------------------------------------------------------------------
// Batch save helper: create a page with its items in one go
// ---------------------------------------------------------------------------

/** Create a page and its items together. Returns the page with nested items. */
export async function savePageWithItems(
  page: PageInsert,
  items: Omit<ItemInsert, 'page_id'>[],
) {
  // 1. Create the page
  const { data: createdPage, error: pageError } = await createPage(page);
  if (pageError || !createdPage) {
    return { data: null, error: pageError };
  }

  // 2. Create items linked to the new page
  if (items.length > 0) {
    const itemsWithPageId: ItemInsert[] = items.map((item) => ({
      ...item,
      page_id: createdPage.id,
    }));
    const { error: itemsError } = await createItems(itemsWithPageId);
    if (itemsError) {
      return { data: createdPage as PageWithItems, error: itemsError };
    }
  }

  // 3. Re-fetch the full page with items
  return fetchPageById(createdPage.id);
}

// Re-export types for external use
export type { PageRow, PageInsert, PageUpdate, ItemRow, ItemInsert, ItemUpdate };
