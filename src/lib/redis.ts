import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const QUEUE_KEY = "vr:queue";

export async function joinQueue(peerId: string): Promise<string | null> {
  // Try to pop someone from the queue
  const waiting = await redis.lpop(QUEUE_KEY);

  if (waiting && waiting !== peerId) {
    return waiting as string; // matched!
  }

  // No one waiting — add ourselves to queue
  await redis.rpush(QUEUE_KEY, peerId);
  // Auto-expire our entry after 30 seconds (cleanup stale entries)
  // We re-join every few seconds via polling anyway
  return null;
}

export async function leaveQueue(peerId: string) {
  await redis.lrem(QUEUE_KEY, 0, peerId);
}
