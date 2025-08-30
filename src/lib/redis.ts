import { Redis } from '@upstash/redis';

// Define an interface that includes all methods we use from Upstash Redis
// This helps ensure our mock client is type-safe.
interface IRedis {
  get<TData>(key: string): Promise<TData | null>;
  set<TData>(key: string, value: TData, opts?: any): Promise<TData | "OK" | null>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  del(...keys: string[]): Promise<number>;
  scan(cursor: number, options?: { match?: string; count?: number }): Promise<[string, string[]]>;
  pipeline(): any; // The pipeline type is complex, so we'll keep it as any for the mock
}

let redis: IRedis;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
} else {
  console.warn("Redis environment variables not set. Using mock Redis client.");
  // Provide a mock client for build purposes that adheres to the IRedis interface
  redis = {
    get: async <TData>(_key: string): Promise<TData | null> => Promise.resolve(null),
    set: async <TData>(_key: string, _value: TData, _opts?: any): Promise<"OK"> => Promise.resolve("OK"),
    incr: async (_key: string): Promise<number> => Promise.resolve(0),
    decr: async (_key: string): Promise<number> => Promise.resolve(0),
    del: async (..._keys: string[]): Promise<number> => Promise.resolve(0),
    scan: async (_cursor: number, _options?: { match?: string; count?: number }): Promise<[string, string[]]> => Promise.resolve(["0", []]),
    pipeline: () => ({
      incr: () => {},
      expire: () => {},
      exec: () => Promise.resolve([]),
    }),
  };
}

export { redis };
