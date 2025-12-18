import { API_CONFIG } from "@/constants/api";

const encoder = new TextEncoder();

export async function POST(request: Request) {
  const { kurumId, detsis, type } = await request.json();

  const authHeader = request.headers.get("authorization") || "";

  const stream = new ReadableStream({
    async start(controller) {
      // İlk mesaj: işlem başladı
      controller.enqueue(
        encoder.encode("event: started\ndata: Tarama başlatıldı\n\n"),
      );

      let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

      try {
        // Her 20 saniyede bir keep-alive eventi gönder
        keepAliveInterval = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(
                "event: keepalive\ndata: still-working\n\n",
              ),
            );
          } catch {
            // Stream kapanmış olabilir, interval'i durdur
            if (keepAliveInterval) {
              clearInterval(keepAliveInterval);
              keepAliveInterval = null;
            }
          }
        }, 20000);

        // Scrapper API'ye istek yap
        const backendResponse = await fetch(
          `${API_CONFIG.SCRAPPER_BASE_URL}/api/kurum/portal-scan`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({
              id: kurumId,
              ...(detsis !== undefined ? { detsis } : {}),
              ...(type !== undefined ? { type } : {}),
            }),
          },
        );

        const responseText = await backendResponse.text();

        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }

        if (!backendResponse.ok) {
          // Hata durumunda error eventi gönder
          const errorPayload =
            responseText ||
            `API Hatası: ${backendResponse.status} - ${backendResponse.statusText}`;

          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify(errorPayload)}\n\n`,
            ),
          );
          controller.close();
          return;
        }

        // Başarılı sonucu result eventi olarak gönder
        controller.enqueue(
          encoder.encode(
            `event: result\ndata: ${responseText}\n\n`,
          ),
        );

        // İşlem bitti
        controller.enqueue(
          encoder.encode(
            "event: done\ndata: Tarama tamamlandı\n\n",
          ),
        );
        controller.close();
      } catch (error: any) {
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }

        const message =
          error?.message ||
          "Scrapper API isteği sırasında beklenmeyen bir hata oluştu.";

        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify(message)}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

