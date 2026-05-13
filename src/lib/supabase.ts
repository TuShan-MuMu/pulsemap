import { createClient } from "@supabase/supabase-js";

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  // 关键检查：确保只在浏览器环境中初始化
  if (typeof window === 'undefined') {
    return null;
  }

  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return null;
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

// 为了兼容现有代码，保留 supabase 变量但改为 getter
// 这样现有导入仍然可以工作，但不会在构建时初始化
export const supabase = new Proxy({} as any, {
  get: (_, prop) => {
    const client = getSupabaseClient();
    if (!client) {
      console.warn(`Supabase client not available. Tried to access: ${String(prop)}`);
      return undefined;
    }
    const value = client[prop as keyof typeof client];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});