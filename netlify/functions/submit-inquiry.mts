import { createClient } from "@supabase/supabase-js";

const json = (
  status: number,
  body: Record<string, unknown>
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

export default async (request: Request) => {
  // Allow POST requests only
  if (request.method !== "POST") {
    return json(405, {
      error: "Method not allowed",
    });
  }

  // Supabase environment variables
  const supabaseUrl =
    process.env.SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY."
    );

    return json(500, {
      error: "Server is not configured.",
    });
  }

  // Read submitted form data
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return json(400, {
      error: "Invalid request.",
    });
  }

  // Clean and limit submitted values
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

  // Honeypot spam field
  const website = String(
    payload.website || ""
  ).trim();

  // Silently accept spam submissions
  if (website) {
    return json(200, {
      ok: true,
    });
  }

  // Required field validation
  if (!name || !contact || !message) {
    return json(400, {
      error:
        "Please complete all required fields.",
    });
  }

  // Create secure Supabase server client
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
    Save inquiry to Supabase.

    We do not send status/source because
    database defaults handle those fields.
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

    return json(500, {
      error: "Could not save your inquiry.",
    });
  }

  /*
    =============================================
    DISCORD NOTIFICATION
    =============================================
  */

  const discordWebhook =
    process.env.DISCORD_WEBHOOK_URL;

  if (discordWebhook) {
    try {
      /*
        Discord embed field values have size
        limits, so keep the customer message
        safely below the maximum.
      */
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
            // Name displayed above the Discord message
            username:
              "SHYIRA Sweet Website",

            // SHYIRA Sweet logo
            avatar_url:
              "https://shyia.netlify.app/images/logo.png",

            /*
              Prevent customer-submitted content
              from triggering @everyone, @here,
              or user mentions.
            */
            allowed_mentions: {
              parse: [],
            },

            embeds: [
              {
                // Main notification title
                title:
                  "🍰 New Website Inquiry",

                // Current Admin Dashboard
                url:
                  "https://shyia.netlify.app/?admin",

                description:
                  "A new inquiry was submitted through the **SHYIRA Sweet** website.",

                /*
                  SHYIRA Sweet brand green
                  HEX: #285c50
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
                    value:
                      discordMessage,
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
                      "[Open SHYIRA Sweet Dashboard](https://shyia.netlify.app/?admin)",
                    inline: false,
                  },
                ],

                footer: {
                  text:
                    "SHYIRA Sweet • Website Inquiry System",
                  icon_url:
                    "https://shyia.netlify.app/images/logo.png",
                },

                timestamp:
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
      /*
        Important:
        Discord failure should NOT prevent
        the inquiry from being saved.
      */
      console.error(
        "Discord notification failed:",
        discordError
      );
    }
  }

  /*
    Inquiry saved successfully.
  */
  return json(200, {
    ok: true,
    id: data.id,
  });
};
