import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { activatePlan } from "@/lib/activatePlan";

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    // 1. WEBHOOK SIGNATURE CHECK - Razorpay nunchi ye vachinda - Leda hacker na?
    const expected = crypto.createHmac("sha256", secret).update(bodyText).digest("hex");
    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(bodyText);
    const supabase = getSupabase();

    // 2. PAYMENT CAPTURED - Plan activate Bro
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      console.log("WEBHOOK CAPTURED:", payment.id, payment.order_id, payment.amount);

      // Order DB lo lekapothe - Create cheyi Bro - Webhook ye first vachina kuda - Plan miss avvadu Bro
      const { data: existing } = await supabase.from("orders").select("id").eq("order_id", payment.order_id).single();
      if (!existing && payment.notes) {
        await supabase.from("orders").insert({
          order_id: payment.order_id,
          user_email: payment.notes.email || payment.email || "",
          plan_id: payment.notes.planId || "monthly",
          tier_id: payment.notes.tierId || "tier2",
          country: payment.notes.country || "india",
          base_price: Number(payment.notes.base_price || 0),
          fee: Number(payment.notes.fee || 0),
          total_price: Number(payment.amount) / 100,
          currency: payment.currency,
          status: "created",
        });
      }

      // Activate - Idempotency tho - Verify tho double activate avvadu Bro
      await activatePlan(supabase, payment.order_id, payment.id, payment.method);
    }

    // 3. PAYMENT FAILED - DB lo failed ani mark cheyi Bro - User ki malli try cheyamanu Bro
    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      console.log("WEBHOOK FAILED:", payment.id, payment.order_id, payment.error_description);
      await supabase.from("orders").update({ status: "failed", payment_id: payment.id, method: payment.method }).eq("order_id", payment.order_id);
    }

    // 4. REFUND - User ki refund ayithe - Plan deactivate cheyi Bro - Manaku loss ravaddu Bro
    if (event.event === "refund.processed" || event.event === "refund.created") {
      const refund = event.payload.refund?.entity || event.payload.payment?.entity;
      console.log("WEBHOOK REFUND:", refund);
      // TODO: Refund ayithe - User plan ni deactive cheyi - Manual review tho Bro
      // await supabase.from("users").update({ plan_active: false }).eq("email", ...)
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("WEBHOOK ERROR:", e);
    // Webhook lo error vachina - 200 ivvaku Bro - Razorpay malli retry chesthundi Bro
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}