import { NextRequest } from "next/server";
import { joinQueue, leaveQueue } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { peerId, action } = await req.json();

    if (!peerId) {
      return Response.json({ error: "peerId required" }, { status: 400 });
    }

    if (action === "leave") {
      await leaveQueue(peerId);
      return Response.json({ ok: true });
    }

    // Default: join queue and try to match
    const matched = await joinQueue(peerId);

    if (matched) {
      return Response.json({ matched: true, remotePeerId: matched });
    }

    return Response.json({ matched: false, waiting: true });
  } catch (err) {
    console.error("Match API error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
