import { supabase } from './supabase'

export type PlanType = 'free' | 'pro' | 'business'

export async function getActivePlan(userId: string): Promise<PlanType> {
  if (!userId) return 'free'

  const { data, error } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .single()

  if (error || !data) return 'free'

  // Expiry ayithe - free ki pampinchu
  if (data.plan_expires_at && new Date(data.plan_expires_at) < new Date()) {
    return 'free'
  }

  if (data.plan === 'pro' || data.plan === 'business') {
    return data.plan
  }

  return 'free'
}

export async function getCurrentUserPlan(): Promise<PlanType> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'free'
  return getActivePlan(user.id)
}