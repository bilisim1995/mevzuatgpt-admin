import { API_CONFIG } from "@/constants/api";

const encoder = new TextEncoder();

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";

  const stream = new ReadableStream({
    async start(controller) {
      // İlk mesaj: işlem başladı
      controller.enqueue(
        encoder.encode("event: started\ndata: Toplu yükleme başlatıldı\n\n"),
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

        // FormData'yı al ve backend'e forward et
        const formData = await request.formData();

        // Backend API'ye istek yap
        const backendResponse = await fetch(
          `${API_CONFIG.BASE_URL}/api/admin/documents/bulk-upload`,
          {
            method: "POST",
            headers: {
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: formData,
          },
        );

        const responseText = await backendResponse.text();

        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }

        if (!backendResponse.ok) {
          // Hata durumunda error eventi gönder
          let errorPayload = responseText;
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.detail) {
              if (Array.isArray(errorData.detail)) {
                const missingFields = errorData.detail
                  .map((d: any) => d.loc.join("."))
                  .join(", ");
                errorPayload = `Eksik alanlar: ${missingFields}`;
              } else {
                errorPayload = errorData.detail;
              }
            } else if (errorData.message) {
              errorPayload = errorData.message;
            }
          } catch {
            // JSON parse edilemezse raw text kullan
          }

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
            "event: done\ndata: Toplu yükleme tamamlandı\n\n",
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
          "Toplu yükleme isteği sırasında beklenmeyen bir hata oluştu.";

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
