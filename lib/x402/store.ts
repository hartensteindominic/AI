/**
 * Pluggable one-use license store.
 *
 * V1 default: in-memory (fine for single-instance / mock).
 * Set LICENSE_STORE=redis + UPSTASH_REDIS_REST_URL / TOKEN for durable store.
 * Interface is intentionally small so on-chain or Postgres adapters can be dropped in later.
 */

import { randomBytes } from 'crypto';
import { getX402Config } from './config';

export interface LicenseRecord {
  token: string;
  assetId: string;
  issuedAt: number;
  expiresAt: number;
  consumed: boolean;
  paymentRef?: string;
}

export interface LicenseStore {
  issue(assetId: string, paymentRef?: string): Promise<LicenseRecord>;
  peek(token: string): Promise<LicenseRecord | null>;
  consume(token: string): Promise<LicenseRecord | null>;
  stats(): Promise<{ active: number; consumed: number; totalTracked: number }>;
}

function newToken(): string {
  return `lic_${randomBytes(24).toString('hex')}`;
}

// ---------- In-memory ----------
class MemoryStore implements LicenseStore {
  private map = new Map<string, LicenseRecord>();

  async issue(assetId: string, paymentRef?: string): Promise<LicenseRecord> {
    const { licenseTtlMs } = getX402Config();
    const now = Date.now();
    const record: LicenseRecord = {
      token: newToken(),
      assetId,
      issuedAt: now,
      expiresAt: now + licenseTtlMs,
      consumed: false,
      paymentRef,
    };
    this.map.set(record.token, record);
    return record;
  }

  async peek(token: string): Promise<LicenseRecord | null> {
    const record = this.map.get(token);
    if (!record) return null;
    if (record.expiresAt < Date.now()) {
      this.map.delete(token);
      return null;
    }
    return { ...record };
  }

  async consume(token: string): Promise<LicenseRecord | null> {
    const record = this.map.get(token);
    if (!record || record.expiresAt < Date.now() || record.consumed) {
      if (record && record.expiresAt < Date.now()) this.map.delete(token);
      return null;
    }
    record.consumed = true;
    this.map.set(token, record);
    return { ...record };
  }

  async stats() {
    let active = 0;
    let consumed = 0;
    const now = Date.now();
    for (const r of this.map.values()) {
      if (r.expiresAt < now) continue;
      if (r.consumed) consumed += 1;
      else active += 1;
    }
    return { active, consumed, totalTracked: this.map.size };
  }
}

// ---------- Upstash Redis (REST) ----------
class UpstashStore implements LicenseStore {
  constructor(
    private url: string,
    private token: string,
  ) {}

  private async cmd(...args: (string | number)[]): Promise<unknown> {
    const res = await fetch(`${this.url.replace(/\/$/, '')}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}`);
    const body = await res.json();
    return body.result;
  }

  async issue(assetId: string, paymentRef?: string): Promise<LicenseRecord> {
    const { licenseTtlMs } = getX402Config();
    const now = Date.now();
    const record: LicenseRecord = {
      token: newToken(),
      assetId,
      issuedAt: now,
      expiresAt: now + licenseTtlMs,
      consumed: false,
      paymentRef,
    };
    const key = `lic:${record.token}`;
    const ttlSec = Math.ceil(licenseTtlMs / 1000);
    await this.cmd('SET', key, JSON.stringify(record), 'EX', ttlSec);
    return record;
  }

  async peek(token: string): Promise<LicenseRecord | null> {
    const raw = (await this.cmd('GET', `lic:${token}`)) as string | null;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LicenseRecord;
    } catch {
      return null;
    }
  }

  async consume(token: string): Promise<LicenseRecord | null> {
    const key = `lic:${token}`;
    // Simple get-modify-set; for high contention use a Lua script later
    const raw = (await this.cmd('GET', key)) as string | null;
    if (!raw) return null;
    let record: LicenseRecord;
    try {
      record = JSON.parse(raw);
    } catch {
      return null;
    }
    if (record.consumed || record.expiresAt < Date.now()) return null;
    record.consumed = true;
    const ttlSec = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
    await this.cmd('SET', key, JSON.stringify(record), 'EX', ttlSec);
    return record;
  }

  async stats() {
    // Approximate — SCAN would be needed for exact counts; keep light for V1
    return { active: -1, consumed: -1, totalTracked: -1 };
  }
}

let singleton: LicenseStore | null = null;

export function getLicenseStore(): LicenseStore {
  if (singleton) return singleton;

  const kind = (process.env.LICENSE_STORE || 'memory').toLowerCase();
  const url = process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';

  if (kind === 'redis' && url && token) {
    singleton = new UpstashStore(url, token);
  } else {
    singleton = new MemoryStore();
  }
  return singleton;
}
