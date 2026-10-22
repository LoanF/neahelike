import { createServer } from "node:http";
import type { Server } from "node:http";

/**
 * Faux Discord pour les tests de bout en bout : le site lui parle à la place de discord.com
 * (DISCORD_API_URL). Il connaît les membres de test, accepte les changements de rôle et garde
 * les messages privés envoyés, que les tests relisent sur GET /__messages.
 */
export const FAKE_DISCORD_PORT = 3199;

export interface FakeMember {
  id: string;
  username: string;
  roles: string[];
}

export interface SentMessage {
  userId: string;
  content?: string;
  embeds?: unknown[];
}

export function startFakeDiscord(members: FakeMember[]): Promise<Server> {
  const byId = new Map(members.map(member => [member.id, member]));
  const channels = new Map<string, string>();
  const messages: SentMessage[] = [];

  const server = createServer((request, response) => {
    let body = "";
    request.on("data", chunk => (body += chunk));
    request.on("end", () => {
      const send = (status: number, data?: unknown) => {
        response.writeHead(status, { "Content-Type": "application/json" });
        response.end(data === undefined ? undefined : JSON.stringify(data));
      };
      const path = request.url ?? "";
      const json = body ? JSON.parse(body) : {};

      if (request.method === "GET" && path === "/__messages") return send(200, messages);

      const member = path.match(/^\/guilds\/\d+\/members\/(\d+)$/);
      if (request.method === "GET" && member) {
        const found = byId.get(member[1]);
        if (!found) return send(404, { message: "Unknown Member" });
        return send(200, { user: { id: found.id, username: found.username, global_name: found.username, avatar: null }, roles: found.roles, nick: null });
      }

      const role = path.match(/^\/guilds\/\d+\/members\/(\d+)\/roles\/(\d+)$/);
      if (role && (request.method === "PUT" || request.method === "DELETE")) {
        const found = byId.get(role[1]);
        if (found) found.roles = request.method === "PUT" ? [...new Set([...found.roles, role[2]])] : found.roles.filter(id => id !== role[2]);
        return send(204);
      }

      if (request.method === "POST" && path === "/users/@me/channels") {
        const id = `7${String(json.recipient_id).slice(1)}`;
        channels.set(id, json.recipient_id);
        return send(200, { id });
      }

      const channel = path.match(/^\/channels\/(\d+)\/messages$/);
      if (request.method === "POST" && channel) {
        messages.push({ userId: channels.get(channel[1]) ?? "", content: json.content, embeds: json.embeds });
        return send(200, { id: String(Date.now()) });
      }

      if (request.method === "GET" && /^\/guilds\/\d+\/roles$/.test(path)) return send(200, []);

      send(404, { message: `Faux Discord : ${request.method} ${path} non prévu` });
    });
  });

  return new Promise(resolve => server.listen(FAKE_DISCORD_PORT, () => resolve(server)));
}
