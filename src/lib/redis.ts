import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const QUEUE_KEY = "vr:queue";
const NICK_PREFIX = "vr:nick:";

export async function joinQueue(peerId: string, nickname: string): Promise<{ remotePeerId: string; remoteNickname: string } | null> {
  // Save nickname
  await redis.set(`${NICK_PREFIX}${peerId}`, nickname, { ex: 300 }); // expires in 5min

  // Try to pop someone from the queue
  const waiting = await redis.lpop(QUEUE_KEY);

  if (waiting && waiting !== peerId) {
    const remoteNick = await redis.get(`${NICK_PREFIX}${waiting}`) as string || "???";
    return { remotePeerId: waiting as string, remoteNickname: remoteNick };
  }

  // No one waiting — add ourselves
  await redis.rpush(QUEUE_KEY, peerId);
  return null;
}

export async function leaveQueue(peerId: string) {
  await redis.lrem(QUEUE_KEY, 0, peerId);
  await redis.del(`${NICK_PREFIX}${peerId}`);
}

export async function getNickname(peerId: string): Promise<string> {
  return (await redis.get(`${NICK_PREFIX}${peerId}`) as string) || "???";
}
