import fs from 'fs';
import path from 'path';

export type CommercialEventKind = 'redirect' | 'lead';

export type CommercialEvent = {
  kind: CommercialEventKind;
  ts: string;
  [key: string]: unknown;
};

export type RecordEventResult = {
  jsonl: boolean;
  webhook: boolean;
};

export type EventLogIo = {
  appendFile?: (file: string, line: string) => void;
  log?: (line: string) => void;
  postWebhook?: (url: string, body: unknown) => Promise<void>;
  webhookUrl?: string;
  cwd?: string;
};

function jsonlPath(kind: CommercialEventKind, cwd: string): string {
  if (kind === 'lead') return path.join(cwd, 'data', 'leads', 'leads.jsonl');
  return path.join(cwd, 'data', 'redirects.jsonl');
}

function defaultAppendFile(file: string, line: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, line, 'utf-8');
}

async function defaultPostWebhook(url: string, body: unknown) {
  await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Dual-write commercial events: local JSONL (dev), stdout (Vercel logs),
 * optional METRICS_WEBHOOK_URL. Never throws; callers decide HTTP status.
 */
export async function recordEvent(
  entry: CommercialEvent,
  io: EventLogIo = {}
): Promise<RecordEventResult> {
  const line = `${JSON.stringify(entry)}\n`;
  const log = io.log ?? ((msg: string) => console.log(msg));
  log(`homes.event ${line.trim()}`);

  let jsonl = false;
  try {
    const append = io.appendFile ?? defaultAppendFile;
    append(jsonlPath(entry.kind, io.cwd ?? process.cwd()), line);
    jsonl = true;
  } catch {
    jsonl = false;
  }

  const webhookUrl = io.webhookUrl ?? process.env.METRICS_WEBHOOK_URL;
  let webhook = false;
  if (webhookUrl) {
    try {
      const post = io.postWebhook ?? defaultPostWebhook;
      await post(webhookUrl, entry);
      webhook = true;
    } catch {
      webhook = false;
    }
  }

  return { jsonl, webhook };
}
