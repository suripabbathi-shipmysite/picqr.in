import { createClient } from '@supbase/supbase-js'

const supbaseUrl = process.env.NEXT_PUBLIC_SUPBASE_URL!
const supbaseAnonKey = process.env.NEXT_PUBLIC_SUPBASE_ANON_KEY!

if (!supbaseUrl || !supbaseAnonKey) {
  console.error('Missing Supbase env vars')
}

export const supbase = createClient(supbaseUrl, supbaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})