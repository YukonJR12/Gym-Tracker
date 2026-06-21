import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed. Use POST." }, 405);
  }

  // ── Secrets ────────────────────────────────────────────────────────────
  const apiKey  = Deno.env.get("MYFATOORAH_API_KEY");
  const baseUrl = Deno.env.get("MYFATOORAH_BASE_URL");
  const appUrl  = Deno.env.get("APP_URL") ?? "http://localhost:5173";

  if (!apiKey || !baseUrl) {
    console.error("[initiate-payment] Missing secret: MYFATOORAH_API_KEY or MYFATOORAH_BASE_URL");
    return json({ error: "Payment gateway not configured." }, 500);
  }

  console.log(`[initiate-payment] base_url=${baseUrl} app_url=${appUrl}`);

  // ── Parse body ─────────────────────────────────────────────────────────
  let body: {
    amount?: number;
    customerName?: string;
    customerEmail?: string;
    itemName?: string;
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const { amount, customerName, customerEmail, itemName } = body;

  if (!amount || !customerName || !customerEmail || !itemName) {
    return json(
      { error: "Missing required fields: amount, customerName, customerEmail, itemName" },
      400
    );
  }

  console.log(`[initiate-payment] amount=${amount} KWD item="${itemName}" customer=${customerEmail}`);

  try {
    // ── v3 Create Payment (single step) ────────────────────────────────
    // Omitting PaymentMethod so MyFatoorah shows all available methods.
    const res = await fetch(`${baseUrl}/v3/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Order: {
          Amount: amount,
          Currency: "KWD",
          ExternalIdentifier: `gymtracker-${Date.now()}`,
        },
        Customer: {
          Name: customerName,
          Email: customerEmail,
        },
        IntegrationUrls: {
          Redirection: `${appUrl}/success`,
        },
        Language: "EN",
      }),
    });

    const resText = await res.text();

    if (!res.ok) {
      console.error(`[initiate-payment] v3/payments ${res.status}: ${resText}`);
      return json({ error: `Payment failed (${res.status}).` }, 502);
    }

    const data = JSON.parse(resText);
    const paymentUrl = data?.Data?.PaymentURL;
    const invoiceId  = data?.Data?.InvoiceId;

    if (!paymentUrl) {
      console.error(`[initiate-payment] No PaymentURL: ${resText}`);
      return json({ error: "No payment URL returned from gateway." }, 502);
    }

    console.log(`[initiate-payment] success invoice_id=${invoiceId}`);
    return json({ paymentUrl, invoiceId });

  } catch (err) {
    console.error(`[initiate-payment] unexpected error: ${err.message}`);
    return json({ error: `Unexpected payment error: ${err.message}` }, 502);
  }
});
