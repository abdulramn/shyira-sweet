import { createClient } from "@supabase/supabase-js";

type AssetBinding = {
  fetch(
    input: Request | string,
    init?: RequestInit
  ): Promise<Response>;
};

interface Env {
  ASSETS: AssetBinding;

  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  DISCORD_WEBHOOK_URL?: string;
}

type InquiryPayload = {
  name?: unknown;
  contact?: unknown;
  message?: unknown;
  website?: unknown;
};

const jsonResponse = (
  status: number,
  body: Record<string, unknown>
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type":
        "application/json; charset=utf-8",

      "Cache-Control":
        "no-store, no-cache, must-revalidate",

      "X-Content-Type-Options":
        "nosniff",
    },
  });

const cleanText = (
  value: unknown,
  maximumLength: number
): string =>
  String(value || "")
    .trim()
    .slice(0, maximumLength);

async function handleInquiry(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(405, {
      error: "Method not allowed.",
    });
  }

  const contentType =
    request.headers.get("Content-Type") || "";

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    return jsonResponse(415, {
      error:
        "Content-Type must be application/json.",
    });
  }

  let payload: InquiryPayload;

  try {
    payload =
      (await request.json()) as InquiryPayload;
  } catch {
    return jsonResponse(400, {
      error: "Invalid request body.",
    });
  }

  const name = cleanText(
    payload.name,
    120
  );

  const contact = cleanText(
    payload.contact,
    200
  );

  const message = cleanText(
    payload.message,
    5000
  );

  const website = cleanText(
    payload.website,
    500
  );

  /*
    Honeypot spam protection.

    This field is hidden from real visitors.
    Automated spam tools often complete it.
  */
  if (website) {
    return jsonResponse(200, {
      ok: true,
    });
  }

  if (!name || !contact || !message) {
    return jsonResponse(400, {
      error:
        "Please complete all required fields.",
    });
  }

  const supabaseUrl =
    env.SUPABASE_URL?.trim();

  const supabaseSecretKey =
    env.SUPABASE_SECRET_KEY?.trim() ||
    env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (
    !supabaseUrl ||
    !supabaseSecretKey
  ) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY."
    );

    return jsonResponse(500, {
      error:
        "Server is not configured.",
    });
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  /*
    Save the inquiry to Supabase.

    Database defaults continue to handle
    fields such as status and source.
  */
  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      name,
      contact,
      message,
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error(
      "Supabase insert failed:",
      error
    );

    return jsonResponse(500, {
      error:
        "Could not save your inquiry.",
    });
  }

  /*
    Discord notification.

    The inquiry is already saved before
    sending Discord. A Discord failure
    will not lose the inquiry.
  */
  const discordWebhook =
    env.DISCORD_WEBHOOK_URL?.trim();

  if (discordWebhook) {
    try {
      const discordMessage =
        message.length > 1000
          ? `${message.slice(0, 997)}...`
          : message;

      const discordResponse =
        await fetch(discordWebhook, {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            username:
              "SHYIRA Sweet Website",

            avatar_url:
              "https://shiyrasweet.com/images/logo.png",

            allowed_mentions: {
              parse: [],
            },

            embeds: [
              {
                title:
                  "🍰 New Website Inquiry",

                url:
                  "https://shiyrasweet.com/?admin",

                description:
                  "A new inquiry was submitted through the **SHYIRA Sweet** website.",

                /*
                  SHYIRA Sweet green:
                  #285c50
                */
                color: 2645072,

                fields: [
                  {
                    name: "👤 Customer",
                    value: name,
                    inline: true,
                  },

                  {
                    name: "📞 Contact",
                    value: contact,
                    inline: true,
                  },

                  {
                    name: "💬 Inquiry",
                    value: discordMessage,
                    inline: false,
                  },

                  {
                    name: "📌 Status",
                    value: "🟢 New",
                    inline: true,
                  },

                  {
                    name:
                      "🔐 Admin Dashboard",

                    value:
                      "[Open SHYIRA Sweet Dashboard](https://shiyrasweet.com/?admin)",

                    inline: false,
                  },
                ],

                footer: {
                  text:
                    "SHYIRA Sweet • Website Inquiry System",

                  icon_url:
                    "https://shiyrasweet.com/images/logo.png",
                },

                timestamp:
                  data.created_at ||
                  new Date().toISOString(),
              },
            ],
          }),
        });

      if (!discordResponse.ok) {
        const discordErrorText =
          await discordResponse
            .text()
            .catch(() => "");

        console.error(
          "Discord webhook returned:",
          discordResponse.status,
          discordErrorText
        );
      }
    } catch (discordError) {
      console.error(
        "Discord notification failed:",
        discordError
      );
    }
  } else {
    console.warn(
      "DISCORD_WEBHOOK_URL is not configured."
    );
  }

  return jsonResponse(200, {
    ok: true,
    id: data.id,
  });
}

export default {
  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {
    const url = new URL(request.url);

    /*
      Website inquiry endpoint
    */
    if (
      url.pathname ===
      "/api/submit-inquiry"
    ) {
      return handleInquiry(
        request,
        env
      );
    }

    /*
      Serve React/Vite static assets.

      Most asset requests are served directly
      by Cloudflare, but this remains as a
      safe fallback.
    */
    return env.ASSETS.fetch(request);
  },
};
