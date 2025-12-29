import { API_CONFIG } from "@/constants/api";

export async function POST(request: Request) {
  const body = await request.json();

  const authHeader = request.headers.get("authorization") || "";

  try {
    // Scrapper API'ye istek yap
    const backendResponse = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mevzuatgpt/scrape-with-data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      },
    );

    const responseText = await backendResponse.text();

    if (!backendResponse.ok) {
      // Hata durumunda error response döndür
      let errorPayload;
      try {
        errorPayload = JSON.parse(responseText);
      } catch {
        errorPayload = {
          message: responseText || `API Hatası: ${backendResponse.status} - ${backendResponse.statusText}`,
        };
      }

      return Response.json(
        {
          success: false,
          message: errorPayload.message || "Bir hata oluştu",
          error: errorPayload,
        },
        { status: backendResponse.status },
      );
    }

    // Başarılı sonucu döndür
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }

    return Response.json(result, { status: 200 });
  } catch (error: any) {
    const message =
      error?.message ||
      "Scrapper API isteği sırasında beklenmeyen bir hata oluştu.";

    return Response.json(
      {
        success: false,
        message: message,
        error: error?.message,
      },
      { status: 500 },
    );
  }
}

