import { connect as netConnect, type Socket } from "node:net";
import { connect as tlsConnect, type TLSSocket } from "node:tls";
import { loadRepoEnv } from "@flyte/db";

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
};

export type SmtpMessage = {
  to: string;
  subject: string;
  text: string;
};

type SmtpSocket = Socket | TLSSocket;

export function loadSmtpConfig(): SmtpConfig | null {
  loadRepoEnv();
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  const from = process.env.SMTP_FROM?.trim();
  if (!host || !user || !password || !from) return null;
  const portRaw = process.env.SMTP_PORT?.trim() ?? "587";
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) return null;
  return { host, port, user, password, from };
}

export function isSmtpConfigured(): boolean {
  return loadSmtpConfig() !== null;
}

/**
 * Send a plaintext mail over SMTP. Does not log the message body (magic-link
 * URLs must not appear in logs). Implicit TLS on 465; STARTTLS otherwise.
 */
export async function sendSmtpMail(message: SmtpMessage): Promise<void> {
  const cfg = loadSmtpConfig();
  if (!cfg) {
    throw new Error("SMTP is not configured.");
  }
  await send(cfg, message);
}

async function send(cfg: SmtpConfig, message: SmtpMessage): Promise<void> {
  const implicitTls = cfg.port === 465;
  let active: SmtpSocket = implicitTls
    ? tlsConnect({ host: cfg.host, port: cfg.port, servername: cfg.host })
    : netConnect(cfg.port, cfg.host);

  try {
    await expectCode(active, 220);
    await command(active, `EHLO ${cfg.host}`, 250);
    if (!implicitTls) {
      await command(active, "STARTTLS", 220);
      active = await upgradeTls(active, cfg.host);
      await command(active, `EHLO ${cfg.host}`, 250);
    }
    await authenticateAndDeliver(active, cfg, message);
  } finally {
    active.end();
  }
}

function upgradeTls(socket: SmtpSocket, host: string): Promise<TLSSocket> {
  return new Promise((resolve, reject) => {
    const secure = tlsConnect({ socket, host, servername: host }, () => {
      resolve(secure);
    });
    secure.once("error", reject);
  });
}

async function authenticateAndDeliver(
  socket: SmtpSocket,
  cfg: SmtpConfig,
  message: SmtpMessage,
): Promise<void> {
  await command(socket, "AUTH LOGIN", 334);
  await command(socket, Buffer.from(cfg.user).toString("base64"), 334);
  await command(socket, Buffer.from(cfg.password).toString("base64"), 235);
  await command(socket, `MAIL FROM:<${cfg.from}>`, 250);
  await command(socket, `RCPT TO:<${message.to}>`, 250);
  await command(socket, "DATA", 354);
  const payload = [
    `From: ${cfg.from}`,
    `To: ${message.to}`,
    `Subject: ${message.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    message.text,
    ".",
  ].join("\r\n");
  await command(socket, payload, 250);
  await command(socket, "QUIT", 221);
}

async function command(socket: SmtpSocket, line: string, expected: number): Promise<void> {
  socket.write(`${line}\r\n`);
  await expectCode(socket, expected);
}

async function expectCode(socket: SmtpSocket, expected: number): Promise<void> {
  const reply = await readReply(socket);
  const code = Number(reply.slice(0, 3));
  if (code !== expected) {
    throw new Error("SMTP send failed.");
  }
}

function readReply(socket: SmtpSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buf = "";
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("SMTP send failed."));
    }, 15_000);
    const onData = (chunk: Buffer) => {
      buf += chunk.toString("utf8");
      if (isCompleteReply(buf)) {
        cleanup();
        resolve(buf);
      }
    };
    const onError = () => {
      cleanup();
      reject(new Error("SMTP send failed."));
    };
    const cleanup = () => {
      clearTimeout(timeout);
      socket.off("data", onData);
      socket.off("error", onError);
    };
    socket.on("data", onData);
    socket.once("error", onError);
  });
}

function isCompleteReply(buf: string): boolean {
  const lines = buf
    .replaceAll("\r", "")
    .split("\n")
    .filter((line) => line.length > 0);
  const last = lines.at(-1);
  return Boolean(last && /^\d{3} /.test(last));
}
