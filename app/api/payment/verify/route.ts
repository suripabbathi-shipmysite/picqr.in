import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { activatePlan } from '@/lib/activatePlan';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // 1. Signature verify chey - Razorpay
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Supabase client create chey
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Razorpay nunchi payment details tesukovali ante - optional
    // Manam direct ga payment method ni 'razorpay' ga pettestham
    // Leka pothe Razorpay API nunchi fetch cheyochu
    let paymentMethod = 'razorpay';
    try {
      const keyId = process.env.RAZORPAY_KEY_ID || '';
      const auth = Buffer.from(`${keyId}:${secret}`).toString('base64');
      const res = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (res.ok) {
        const payment: any = await res.json();
        if (payment?.method) paymentMethod = payment.method;
      }
    } catch (e) {
      console.log('Razorpay fetch note:', e);
    }

    // 4. Plan activate chey - lib nunchi
    const result = await activatePlan(supabase, razorpay_order_id, razorpay_payment_id, paymentMethod);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, planId: result.planId });
  } catch (e: any) {
    console.error('verify error:', e);
    return NextResponse.json({ error: e?.message || 'Verify failed' }, { status: 500 });
  }
}