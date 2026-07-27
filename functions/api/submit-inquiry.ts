import { createClient } from "@supabase/supabase-js";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  DISCORD_WEBHOOK_URL?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

type RequestPayload = {
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

      "X-Content-Type-Options": "nosniff",
    },
  });

export async function onRequest(
  context: PagesContext
): Promise<Response> {
  const { request, env } = context;

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

  const supabaseUrl =
    env.SUPABASE_URL?.trim();

  const supabaseSecretKey =
    env.SUPABASE_SECRET_KEY?.trim() ||
    env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY."
    );

    return jsonResponse(500, {
      error: "Server is not configured.",
    });
  }

  let payload: RequestPayload;

  try {
    payload =
      (await request.json()) as RequestPayload;
  } catch {
    return jsonResponse(400, {
      error: "Invalid request body.",
    });
  }

  const name = String(
    payload.name || ""
  )
    .trim()
    .slice(0, 120);

  const contact = String(
    payload.contact || ""
  )
    .trim()
    .slice(0, 200);

  const message = String(
    payload.message || ""
  )
    .trim()
    .slice(0, 5000);

  const website = String(
    payload.website || ""
  ).trim();

  /*
    Honeypot spam protection.

    Return success silently so automated
    spam systems do not learn that they
    were blocked.
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
    Save inquiry in Supabase.

    The database defaults continue to manage
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
      error: "Could not save your inquiry.",
    });
  }

  /*
    Discord notification.

    The inquiry has already been saved.
    Therefore Discord failure will be logged
    but will not cause the customer form to fail.
  */
  const discordWebhook =
    env.DISCORD_WEBHOOK_URL?.trim();

  if (discordWebhook) {
    try {
      const discordMessage =
        message.length > 1000
          ? `${message.slice(0, 997)}...`
          : message;

      const discordResponse = await fetch(
        discordWebhook,
        {
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
        }
      );

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
