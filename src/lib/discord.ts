import "server-only";
import { env } from "./env";

const API = "https://discord.com/api/v10";

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  banner?: string | null;
}

export interface GuildMember {
  user: DiscordUser;
  roles: string[];
  nick: string | null;
}

export class DiscordError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RETRY_WAIT_MS = 5_000;

async function call<T>(path: string, init: RequestInit = {}, attempt = 0): Promise<T | null> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${env().DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
    // Discord qui ne répond pas ne doit jamais bloquer une page : on abandonne au bout de 8 s.
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  // Limite de débit : on attend le délai indiqué par Discord, une seule fois et jamais plus de 5 s.
  if (response.status === 429 && attempt === 0) {
    const body = (await response.json().catch(() => ({}))) as { retry_after?: number };
    const wait = Math.ceil((body.retry_after ?? 1) * 1000);
    if (wait > MAX_RETRY_WAIT_MS) throw new DiscordError(429, `Discord ${init.method ?? "GET"} ${path} → limite de débit (${wait} ms)`);
    await new Promise(resolve => setTimeout(resolve, wait));
    return call<T>(path, init, attempt + 1);
  }
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new DiscordError(response.status, `Discord ${init.method ?? "GET"} ${path} → ${response.status}`);
  }
  if (response.status === 204) return null;
  return (await response.json()) as T;
}

export interface GuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

/** Rôles du serveur (nom, couleur, ordre), pour la page des permissions. */
export async function getGuildRoles() {
  return (await call<GuildRole[]>(`/guilds/${env().DISCORD_GUILD_ID}/roles`)) ?? [];
}

/** Profil public d'un utilisateur Discord, ou `null` s'il n'existe pas. */
export function getUser(userId: string) {
  return call<DiscordUser>(`/users/${userId}`);
}

/** Le membre sur le serveur Néa Hélikè, ou `null` s'il n'en fait pas partie. */
export function getMember(userId: string) {
  return call<GuildMember>(`/guilds/${env().DISCORD_GUILD_ID}/members/${userId}`);
}

export async function addRole(userId: string, roleId: string, reason: string) {
  await call(`/guilds/${env().DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`, {
    method: "PUT",
    headers: { "X-Audit-Log-Reason": encodeURIComponent(reason) },
  });
}

export async function removeRole(userId: string, roleId: string, reason: string) {
  await call(`/guilds/${env().DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`, {
    method: "DELETE",
    headers: { "X-Audit-Log-Reason": encodeURIComponent(reason) },
  });
}

/** Envoie un message privé. Renvoie `false` si les MP du joueur sont fermés. */
export async function sendDirectMessage(userId: string, payload: { content?: string; embeds?: unknown[] }) {
  const channel = await call<{ id: string }>("/users/@me/channels", {
    method: "POST",
    body: JSON.stringify({ recipient_id: userId }),
  });
  if (!channel) return false;
  try {
    await call(`/channels/${channel.id}/messages`, { method: "POST", body: JSON.stringify(payload) });
    return true;
  } catch (error) {
    // 50007 : impossible d'envoyer un MP à cet utilisateur.
    if (error instanceof DiscordError && error.status === 403) return false;
    throw error;
  }
}
