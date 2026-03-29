import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (client) return client;

  // createBrowserClient を使うことでセッションをCookieに保存し、
  // サーバーサイドAPIルートとセッションを共有できる（SSR対応）。
  // かつ、Web Locks APIのバイパス関数を渡してlocalhost(HTTP)でのフリーズを防ぐ。
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Web Locks API を完全バイパス（localhost HTTP で動かない問題の修正）
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<string | null>) => {
          return await fn();
        },
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      }
    }
  );
  
  return client;
}
