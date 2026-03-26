import Ably from "ably";

export const dynamic = "force-dynamic";

function buildCapability(roomId?: string, role: "host" | "player" = "player") {
  const room = (roomId || "").toUpperCase().trim();
  if (!room) {
    return JSON.stringify({ "quiz:*": ["subscribe"] });
  }

  const hostCaps = {
    [`quiz:${room}:state`]: ["publish", "subscribe", "history"],
    [`quiz:${room}:answers`]: ["subscribe", "history"],
    [`quiz:${room}:presence`]: ["presence", "subscribe", "history"],
  };

  const playerCaps = {
    [`quiz:${room}:state`]: ["subscribe", "history"],
    [`quiz:${room}:answers`]: ["publish"],
    [`quiz:${room}:presence`]: ["presence", "subscribe", "history"],
  };

  return JSON.stringify({
    ...(role === "host" ? hostCaps : playerCaps),
  });
}

export async function GET(request: Request) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing ABLY_API_KEY" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId") || undefined;
  const role =
    url.searchParams.get("role") === "host" ? "host" : "player";
  const clientId =
    url.searchParams.get("clientId") ||
    `${role}-${Math.random().toString(36).slice(2, 10)}`;

  const rest = new Ably.Rest({ key: apiKey });
  const tokenRequest = await rest.auth.createTokenRequest({
    clientId,
    ttl: 1000 * 60 * 60,
    capability: buildCapability(roomId, role),
  });

  return Response.json(tokenRequest);
}
