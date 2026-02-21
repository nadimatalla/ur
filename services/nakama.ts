import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client, Session, Socket } from "@heroiclabs/nakama-js";

import { getNakamaConfig } from "../config/nakama";

const SESSION_STORAGE_KEY = "nakama.session";
const DEVICE_ID_STORAGE_KEY = "nakama.deviceId";

type ConnectRetryOptions = {
  attempts?: number;
  retryDelayMs?: number;
  createStatus?: boolean;
};

export type StoredSession = {
  token: string;
  refreshToken: string;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export class NakamaService {
  private client: Client | null = null;
  private session: Session | null = null;
  private socket: Socket | null = null;

  getClient(): Client {
    if (!this.client) {
      const config = getNakamaConfig();
      const host = config.host;
      const port = config.port;
      const useSSL = config.useSSL;
      this.client = new Client(
        config.serverKey,
        host,
        port,
        useSSL,
        config.timeoutMs
      );
    }
    return this.client;
  }

  async authenticateEmail(email: string, password: string, create = false, username?: string): Promise<Session> {
    const session = await this.getClient().authenticateEmail(email, password, create, username);
    this.session = session;
    await this.persistSession(session);
    return session;
  }

  async authenticateDevice(deviceId: string, create = true, username?: string): Promise<Session> {
    const session = await this.getClient().authenticateDevice(deviceId, create, username);
    this.session = session;
    await this.persistSession(session);
    return session;
  }

  async ensureAuthenticatedDevice(username?: string): Promise<Session> {
    const existing = await this.loadSession();
    if (existing) {
      return existing;
    }

    const deviceId = await this.getOrCreateDeviceId();
    return this.authenticateDevice(deviceId, true, username);
  }

  async loadSession(): Promise<Session | null> {
    if (this.session) {
      return this.session;
    }

    const rawSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    try {
      const stored = JSON.parse(rawSession) as StoredSession;
      if (!stored.token || !stored.refreshToken) {
        return null;
      }

      const restored = Session.restore(stored.token, stored.refreshToken);
      if (restored.isexpired(Date.now() / 1000) && restored.refresh_token) {
        const refreshed = await this.getClient().sessionRefresh(restored);
        this.session = refreshed;
        await this.persistSession(refreshed);
        return refreshed;
      }

      this.session = restored;
      return restored;
    } catch {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  async connectSocket(createStatus = true): Promise<Socket> {
    const session = await this.loadSession();
    if (!session) {
      throw new Error("No Nakama session available. Authenticate first.");
    }

    if (this.socket) {
      return this.socket;
    }

    const config = getNakamaConfig();
    const socket = this.getClient().createSocket(config.useSSL, false);
    await socket.connect(session, createStatus);
    this.socket = socket;
    return socket;
  }

  async connectSocketWithRetry(options?: ConnectRetryOptions): Promise<Socket> {
    const attempts = options?.attempts ?? 3;
    const retryDelayMs = options?.retryDelayMs ?? 1_200;
    const createStatus = options?.createStatus ?? true;

    let lastError: unknown = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.connectSocket(createStatus);
      } catch (error) {
        lastError = error;
        this.disconnectSocket(false);
        if (attempt < attempts) {
          await delay(retryDelayMs);
        }
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error("Unable to connect to Nakama socket.");
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getSession(): Session | null {
    return this.session;
  }

  disconnectSocket(fireDisconnectEvent = true): void {
    this.socket?.disconnect(fireDisconnectEvent);
    this.socket = null;
  }

  async clearSession(): Promise<void> {
    this.disconnectSocket(true);
    this.session = null;
    this.client = null;
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  }

  private async getOrCreateDeviceId(): Promise<string> {
    const existing = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    return deviceId;
  }

  private async persistSession(session: Session): Promise<void> {
    const stored: StoredSession = {
      token: session.token,
      refreshToken: session.refresh_token,
    };
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
  }
}

export const nakamaService = new NakamaService();
