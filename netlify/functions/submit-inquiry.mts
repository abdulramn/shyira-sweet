import { createClient } from "@supabase/supabase-js";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

export default async (request: Request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error("Missing Supabase server environment variables.");
    return json(500, { error: "Server is not configured." });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Invalid request." });
  }

  const name = String(payload.name || "").trim().slice(0, 120);
  const contact = String(payload.contact || "").trim().slice(0, 200);
  const message = String(payload.message || "").trim().slice(0, 5000);
  const website = String(payload.website || "").trim();

  // Honeypot: silently accept likely bot submissions without saving them.
  if (website) return json(200, { ok: true });

  if (!name || !contact || !message) {
    return json(400, { error: "Please complete all required fields." });
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("inquiries")
    .insert({ name, contact, message, status: "New" })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("Supabase insert failed:", error);
    return json(500, { error: "Could not save your inquiry." });
  }

  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (discordWebhook) {
    try {
      await fetch(discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "SHYIRA Sweet Website",
          embeds: [
            {
              title: "New Website Inquiry",
              description: message.slice(0, 3500),
              fields: [
                { name: "Name", value: name, inline: true },
                { name: "Contact", value: contact, inline: true },
              ],
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    } catch (discordError) {
      // The inquiry is already saved; Discord failure should not fail the form.
      console.error("Discord notification failed:", discordError);
    }
  }

  return json(200, { ok: true, id: data.id });
};
