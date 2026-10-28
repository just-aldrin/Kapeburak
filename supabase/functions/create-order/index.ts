import { createClient } from "npm:@supabase/supabase-js@2";
import { isCreateOrderBody } from "../_shared/order-validation.ts";
import type { CreateOrderBody } from "../_shared/order-validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "Request body must be valid JSON" });
  }
  if (!isCreateOrderBody(body)) {
    return jsonResponse(400, { error: "Check the customer details and order items" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase function is missing server credentials");
    return jsonResponse(500, { error: "Order service is not configured" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc("create_store_order", {
    p_customer_name: body.customer.name,
    p_customer_email: body.customer.email,
    p_customer_phone: body.customer.phone,
    p_fulfillment: body.fulfillment,
    p_delivery_address: body.customer.address ?? null,
    p_order_note: body.customer.note ?? null,
    p_items: body.items,
  });

  if (error) {
    console.error("Order creation failed:", error.message);
    return jsonResponse(400, { error: error.message });
  }
  return jsonResponse(201, data);
});
