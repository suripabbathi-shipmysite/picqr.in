export function getPlanExpiry(planId: string) {
  const now = new Date();
  const p = (planId || '').toLowerCase();
  if (p.includes('year') || p.includes('365') || p.includes('annual')) {
    now.setDate(now.getDate() + 365);
  } else if (p.includes('lifetime') || p.includes('life')) {
    now.setFullYear(now.getFullYear() + 10);
  } else if (p.includes('quarter') || p.includes('90') || p.includes('3month')) {
    now.setDate(now.getDate() + 90);
  } else if (p.includes('week') || p.includes('7')) {
    now.setDate(now.getDate() + 7);
  } else {
    // default - monthly plan
    now.setDate(now.getDate() + 30);
  }
  return now.toISOString();
}

export async function activatePlan(supabase: any, orderId: string, paymentId: string, method: string) {
  try {
    // 1. Order ni find chey
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .single();

    if (orderError || !order) {
      console.error('activatePlan - order not found:', orderId, orderError);
      return { ok: false, error: 'Order not found' };
    }

    // 2. Already activated ayithe - malli cheyaku
    if (order.status === 'paid' && order.plan_active) {
      return { ok: true, planId: order.plan_id };
    }

    const planExpiry = getPlanExpiry(order.plan_id);

    // 3. Orders table update chey
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        razorpay_payment_id: paymentId,
        payment_method: method,
        plan_active: true,
        plan_expiry: planExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', orderId);

    if (updateOrderError) {
      console.error('activatePlan - order update failed:', updateOrderError);
      return { ok: false, error: 'Order update failed' };
    }

    // 4. User profile / users table lo plan activate chey
    // Nee table peru 'profiles' ayithe idi work avthundi
    // 'users' ayithe kindha line lo 'profiles' ni 'users' ga marchu
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan: order.plan_id,
        plan_active: true,
        plan_expiry: planExpiry,
      })
      .eq('email', order.user_email);

    if (profileError) {
      // profiles lo lekapothe - error ni ignore chey - order ayipoyindi kabatti ok
      console.log('activatePlan - profile update note:', profileError.message);
    }

    return { ok: true, planId: order.plan_id };
  } catch (e: any) {
    console.error('activatePlan error:', e);
    return { ok: false, error: e?.message || 'activatePlan failed' };
  }
}