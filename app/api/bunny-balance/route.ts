const BUNNY_BALANCE_URL =
  "https://api.bunny.net/statistics?loadUserBalanceHistory=true";

export async function GET() {
  const apiKey = process.env.BUNNY_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "BUNNY_API_KEY ortam değişkeni tanımlı değil." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(BUNNY_BALANCE_URL, {
      method: "GET",
      headers: {
        AccessKey: apiKey,
        Accept: "application/json",
      },
    });

    const responseBody = await response.text();

    if (!response.ok) {
      return Response.json(
        {
          error: "Bunny.net balance alınırken hata oluştu.",
          status: response.status,
          details: responseBody || response.statusText,
        },
        { status: response.status }
      );
    }

    return new Response(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Bunny.net balance isteği başarısız oldu.";

    return Response.json({ error: message }, { status: 500 });
  }
}
