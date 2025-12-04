/**
 * Cloudflare D1 Type Definitions
 * Provides TypeScript types for D1 database bindings
 */

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: {
    changed_db: boolean;
    changes: number;
    duration: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// Pricing data types matching database schema
export interface SizeCategory {
  id: string;
  label: string;
  min_price: number;
  max_price: number;
  description: string | null;
  sort_order: number;
}

export interface Style {
  id: string;
  label: string;
  multiplier: number;
  description: string | null;
  recommended_color_type: string | null;
  sort_order: number;
}

export interface ColorProfile {
  id: string;
  label: string;
  multiplier: number;
  description: string | null;
  sort_order: number;
}

// Cloudflare Workers environment with D1 binding
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  [key: string]: unknown;
}

// Augment the global CloudflareEnv from @opennextjs/cloudflare
declare global {
  interface CloudflareEnv {
    DB?: D1Database;
    CACHE?: KVNamespace;
    REALTIME?: Fetcher;
  }
}
