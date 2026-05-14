import { NextRequest } from "next/server";
import { joinQueue, leaveQueue, getNickname } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { peerId, nickname, action } = await req.json();

    if (!peerId) {
      return Response.json({ error: "peerId required" }, { status: 400 });
    }

    if (action === "leave") {
      await leaveQueue(peerId);
      return Response.json({ ok: true });
    }

    if (action === "getNick") {
      const nick = await getNickname(peerId);
      return Response.json({ nickname: nick });
    }

    const result = await joinQueue(peerId, nickname || "???");

    if (result) {
      return Response.json({
        matched: true,
        remotePeerId: result.remotePeerId,
        remoteNickname: result.remoteNickname,
        caller: result.caller,
      });
    }

    return Response.json({ matched: false, waiting: true });
  } catch (err) {
    console.error("Match API error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
