/**
 * Auto-generated Supabase Database types for the Álbum de Recuerdos schema.
 *
 * These types mirror the SQL tables defined in supabase/schema.sql and give
 * full type-safety when using the Supabase JS client.
 */

export type ScrapbookItemType = 'photo' | 'video' | 'flower' | 'note' | 'tape' | 'stamp';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          narrative: string | null;
          font_family: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          narrative?: string | null;
          font_family?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          narrative?: string | null;
          font_family?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scrapbook_items_page_id_fkey';
            columns: ['id'];
            isOneToOne: false;
            referencedRelation: 'scrapbook_items';
            referencedColumns: ['page_id'];
          },
        ];
      };
      scrapbook_items: {
        Row: {
          id: string;
          page_id: string;
          type: string;
          url: string | null;
          caption: string | null;
          rotation: number;
          x: number;
          y: number;
          properties: Json;
        };
        Insert: {
          id?: string;
          page_id: string;
          type: string;
          url?: string | null;
          caption?: string | null;
          rotation?: number;
          x?: number;
          y?: number;
          properties?: Json;
        };
        Update: {
          id?: string;
          page_id?: string;
          type?: string;
          url?: string | null;
          caption?: string | null;
          rotation?: number;
          x?: number;
          y?: number;
          properties?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'scrapbook_items_page_id_fkey';
            columns: ['page_id'];
            isOneToOne: false;
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      scrapbook_item_type: ScrapbookItemType;
    };
    CompositeTypes: Record<string, never>;
  };
}
