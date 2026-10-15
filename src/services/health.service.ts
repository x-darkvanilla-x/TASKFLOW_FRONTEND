/**
 * Service to ping and verify backend server health and readiness
 */

export interface HealthData {
  status: string;
  uptime?: number;
  database?: 'connected' | 'connecting' | 'disconnected' | string;
  timestamp?: string;
  service?: string;
}

export interface HealthCheckResult {
  ok: boolean;
  data?: HealthData;
  error?: string;
  latencyMs: number;
}

export const healthService = {
  async checkHealth(timeoutMs = 4000): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const targetUrl = `${apiUrl.replace(/\/+$/, '')}/health`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(targetUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        return {
          ok: false,
          error: `HTTP ${res.status}: ${res.statusText || 'Server Error'}`,
          latencyMs,
        };
      }

      const body = await res.json();
      const data: HealthData = body?.data || body;
      return {
        ok: true,
        data,
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      const message = err instanceof Error ? err.message : 'Connection failed';
      return {
        ok: false,
        error: message,
        latencyMs,
      };
    }
  },
};
