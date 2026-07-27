import { createClient } from "@supabase/supabase-js";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  DISCORD_WEBHOOK_URL?: string;
}

interface CloudflareContext {
  request: Request;
  env: Env;
}

const jsonResponse = (
  status: number,
  body: Record<string, unknown>
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

export async function onRequest(
  context: CloudflareContext
): Promise<Response> {
  const { request, env } = context;

  if (request.method !== "POST") {
    return jsonResponse(405, {
      error: "Method not allowed",
    });
  }

  const supabaseUrl = env.SUPABASE_URL;

  const supabaseSecretKey =
    env.SUPABASE_SECRET_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY."
    );

    return jsonResponse(500, {
      error: "Server is not configured.",
    });
  }

  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, {
      error: "Invalid request.",
    });
  }

  const name = String(payload.name || "")
    .trim()
    .slice(0, 120);

  const contact = String(payload.contact || "")
    .trim()
    .slice(0, 200);

  const message = String(payload.message || "")
    .trim()
    .slice(0, 5000);

  const website = String(payload.website || "").trim();

  /*
    Honeypot spam protection.
    Real visitors do not fill this field.
  */
  if (website) {
    return jsonResponse(200, {
      ok: true,
    });
  }

  if (!name || !contact || !message) {
    return jsonResponse(400, {
      error: "Please complete all required fields.",
    });
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  /*
    Save the inquiry to Supabase.
    Database defaults manage status/source.
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
    console.error("Supabase insert failed:", error);

    return jsonResponse(500, {
      error: "Could not save your inquiry.",
    });
  }

  /*
    Send the Discord notification.
    Discord failure must not delete or fail
    the already saved inquiry.
  */
  if (env.DISCORD_WEBHOOK_URL) {
    try {
      const discordMessage =
        message.length > 1000
          ? `${message.slice(0, 997)}...`
          : message;

      const discordResponse = await fetch(
        env.DISCORD_WEBHOOK_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "SHYIRA Sweet Website",

            avatar_url:
              "https://shiyrasweet.com/images/logo.png",

            /*
              Prevent @everyone, @here,
              and unwanted user mentions.
            */
            allowed_mentions: {
              parse: [],
            },

            embeds: [
              {
                title: "🍰 New Website Inquiry",

                url:
                  "https://shiyrasweet.com/?admin",

                description:
                  "A new inquiry was submitted through the **SHYIRA Sweet** website.",

                // Brand color #285c50
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
                    name: "🔐 Admin Dashboard",
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
  }

  return jsonResponse(200, {
    ok: true,
    id: data.id,
  });
}
