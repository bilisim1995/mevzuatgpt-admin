const DEEPSEEK_BALANCE_URL = "https://api.deepseek.com/user/balance";

export async function GET() {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "DEEPSEEK_API_KEY ortam değişkeni tanımlı değil." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(DEEPSEEK_BALANCE_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const responseBody = await response.text();

    if (!response.ok) {
      return Response.json(
        {
          error: "DeepSeek balance alınırken hata oluştu.",
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
        : "DeepSeek balance isteği başarısız oldu.";

    return Response.json({ error: message }, { status: 500 });
  }
}
