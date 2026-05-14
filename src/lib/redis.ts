import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const QUEUE_KEY = "vr:queue";
const NICK_PREFIX = "vr:nick:";
const MATCH_PREFIX = "vr:match:";

interface MatchResult {
  remotePeerId: string;
  remoteNickname: string;
  caller: boolean;
}

export async function joinQueue(peerId: string, nickname: string): Promise<MatchResult | null> {
  await redis.set(`${NICK_PREFIX}${peerId}`, nickname, { ex: 300 });

  // Check if someone already matched us
  const existingMatch = await redis.get(`${MATCH_PREFIX}${peerId}`) as string | null;
  if (existingMatch) {
    await redis.del(`${MATCH_PREFIX}${peerId}`);
    await redis.lrem(QUEUE_KEY, 0, peerId);
    const remoteNick = await redis.get(`${NICK_PREFIX}${existingMatch}`) as string || "???";
    return { remotePeerId: existingMatch, remoteNickname: remoteNick, caller: false };
  }

  await redis.lrem(QUEUE_KEY, 0, peerId);

  const waiting = await redis.lpop(QUEUE_KEY) as string | null;

  if (waiting && waiting !== peerId) {
    await redis.set(`${MATCH_PREFIX}${waiting}`, peerId, { ex: 30 });
    const remoteNick = await redis.get(`${NICK_PREFIX}${waiting}`) as string || "???";
    return { remotePeerId: waiting, remoteNickname: remoteNick, caller: true };
  }

  await redis.rpush(QUEUE_KEY, peerId);
  return null;
}

export async function leaveQueue(peerId: string) {
  await redis.lrem(QUEUE_KEY, 0, peerId);
  await redis.del(`${NICK_PREFIX}${peerId}`);
  await redis.del(`${MATCH_PREFIX}${peerId}`);
}

export async function getNickname(peerId: string): Promise<string> {
  return (await redis.get(`${NICK_PREFIX}${peerId}`) as string) || "???";
}
