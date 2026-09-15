import { describe, it, expect } from 'vitest';
import { recordEvent } from './event-log';

describe('recordEvent', () => {
  it('writes a JSONL line and a stdout line even without a webhook', async () => {
    const appended: string[] = [];
    const logs: string[] = [];
    const result = await recordEvent(
      { kind: 'redirect', ts: '2026-09-15T12:00:00.000Z', url: 'https://example.com' },
      {
        appendFile: (_file, line) => appended.push(line),
        log: (line) => logs.push(line),
        cwd: '/tmp',
      }
    );
    expect(result.jsonl).toBe(true);
    expect(result.webhook).toBe(false);
    expect(appended).toHaveLength(1);
    expect(JSON.parse(appended[0])).toMatchObject({ kind: 'redirect', url: 'https://example.com' });
    expect(logs[0]).toContain('homes.event');
    expect(logs[0]).toContain('redirect');
  });

  it('still records to stdout when the filesystem is read-only', async () => {
    const logs: string[] = [];
    const result = await recordEvent(
      { kind: 'lead', ts: '2026-09-15T12:00:00.000Z', email: 'a@b.co' },
      {
        appendFile: () => {
          throw new Error('EROFS');
        },
        log: (line) => logs.push(line),
      }
    );
    expect(result.jsonl).toBe(false);
    expect(logs[0]).toContain('homes.event');
  });

  it('POSTs to METRICS_WEBHOOK_URL when provided', async () => {
    const posted: unknown[] = [];
    const result = await recordEvent(
      { kind: 'redirect', ts: '2026-09-15T12:00:00.000Z', url: 'https://example.com' },
      {
        appendFile: () => {},
        log: () => {},
        webhookUrl: 'https://metrics.example/ingest',
        postWebhook: async (url, body) => {
          posted.push({ url, body });
        },
      }
    );
    expect(result.webhook).toBe(true);
    expect(posted).toEqual([
      {
        url: 'https://metrics.example/ingest',
        body: { kind: 'redirect', ts: '2026-09-15T12:00:00.000Z', url: 'https://example.com' },
      },
    ]);
  });
});
