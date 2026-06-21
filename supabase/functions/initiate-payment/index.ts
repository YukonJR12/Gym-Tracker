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

  const authHeader = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" };

  try {
    // ── Step 1: InitiatePayment → discover available payment methods ────
    const initiateRes = await fetch(`${baseUrl}/v2/InitiatePayment`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({ InvoiceAmount: amount, CurrencyIso: "KWD" }),
    });

    if (!initiateRes.ok) {
      const errText = await initiateRes.text();
      console.error(`[initiate-payment] InitiatePayment ${initiateRes.status}: ${errText}`);
      return json({ error: `Payment initiation failed (${initiateRes.status}).` }, 502);
    }

    const initiateData = await initiateRes.json();
    const methods: { PaymentMethodId: number; PaymentMethodEn: string; PaymentMethodCode: string }[] =
      initiateData?.Data?.PaymentMethods ?? [];

    if (methods.length === 0) {
      console.error("[initiate-payment] No payment methods returned.");
      return json({ error: "No payment methods available for this currency." }, 502);
    }

    console.log(`[initiate-payment] available: ${methods.map(m => `${m.PaymentMethodCode}(${m.PaymentMethodId})`).join(", ")}`);

    // Prefer KNET (Kuwait national network), fall back to VISA/MASTER, then first available
    const method =
      methods.find(m => m.PaymentMethodCode === "kn") ??
      methods.find(m => m.PaymentMethodCode === "vm") ??
      methods[0];

    console.log(`[initiate-payment] selected method_id=${method.PaymentMethodId} (${method.PaymentMethodEn})`);

    // ── Step 2: ExecutePayment → get hosted KNET checkout URL ──────────
    const executeRes = await fetch(`${baseUrl}/v2/ExecutePayment`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        PaymentMethodId: method.PaymentMethodId,
        InvoiceValue: amount,
        DisplayCurrencyIso: "KWD",
        CustomerName: customerName,
        CustomerEmail: customerEmail,
        InvoiceItems: [
          { ItemName: itemName, Quantity: 1, UnitPrice: amount },
        ],
        CallBackUrl: `${appUrl}/success`,
        ErrorUrl:    `${appUrl}/error`,
        Language: "en",
        CustomerReference: `gymtracker-${Date.now()}`,
      }),
    });

    if (!executeRes.ok) {
      const errText = await executeRes.text();
      console.error(`[initiate-payment] ExecutePayment ${executeRes.status}: ${errText}`);
      return json({ error: `Payment execution failed (${executeRes.status}).` }, 502);
    }

    const executeData = await executeRes.json();
    const paymentUrl  = executeData?.Data?.PaymentURL;
    const invoiceId   = executeData?.Data?.InvoiceId;

    if (!paymentUrl) {
      console.error(`[initiate-payment] No PaymentURL: ${JSON.stringify(executeData)}`);
      return json({ error: "No payment URL returned from gateway." }, 502);
    }

    console.log(`[initiate-payment] success invoice_id=${invoiceId}`);
    return json({ paymentUrl, invoiceId });

  } catch (err) {
    console.error(`[initiate-payment] unexpected error: ${err.message}`);
    return json({ error: `Unexpected payment error: ${err.message}` }, 502);
  }
});
