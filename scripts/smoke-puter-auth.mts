import "dotenv/config";

type ApiResult = {
  success?: boolean;
  error?: string;
  message?: string;
  data?: unknown;
};

function logStep(title: string) {
  console.log(`\n=== ${title} ===`);
}

async function callApi(
  baseUrl: string,
  cookieHeader: string,
  method: "GET" | "POST" | "DELETE",
  body?: unknown,
) {
  const res = await fetch(`${baseUrl}/api/puter-auth`, {
    method,
    headers: {
      Cookie: cookieHeader,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json: ApiResult | null = null;
  try {
    json = (await res.json()) as ApiResult;
  } catch {
    json = null;
  }

  return { status: res.status, json };
}

async function main() {
  const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
  const cookieHeader = process.env.SMOKE_AUTH_COOKIE;

  if (!cookieHeader) {
    console.error(
      "SMOKE_AUTH_COOKIE belum diisi. Contoh:\n" +
        'SMOKE_AUTH_COOKIE="authjs.session-token=...; __Secure-authjs.session-token=..." pnpm smoke:puter-auth',
    );
    process.exit(1);
  }

  console.log(`Base URL: ${baseUrl}`);

  logStep("GET /api/puter-auth (harus authenticated)");
  const getRes = await callApi(baseUrl, cookieHeader, "GET");
  console.log("Status:", getRes.status);
  console.log("Body:", JSON.stringify(getRes.json));
  if (getRes.status !== 200) {
    throw new Error("GET gagal: pastikan cookie valid dan server dev berjalan.");
  }

  logStep("POST /api/puter-auth dengan token dummy");
  const postRes = await callApi(baseUrl, cookieHeader, "POST", {
    token: "dummy-invalid-token",
  });
  console.log("Status:", postRes.status);
  console.log("Body:", JSON.stringify(postRes.json));
  if (postRes.status !== 401) {
    throw new Error("POST expected 401 (token invalid), tapi status berbeda.");
  }
  if (postRes.json?.error === "Unauthorized") {
    throw new Error("POST masih unauthorized: cookie tidak terbaca di request.");
  }

  logStep("DELETE /api/puter-auth");
  const deleteRes = await callApi(baseUrl, cookieHeader, "DELETE");
  console.log("Status:", deleteRes.status);
  console.log("Body:", JSON.stringify(deleteRes.json));
  if (deleteRes.status !== 200) {
    throw new Error("DELETE gagal.");
  }

  console.log("\nSmoke test /api/puter-auth selesai: PASS");
}

main().catch((err) => {
  console.error("\nSmoke test gagal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
