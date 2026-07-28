import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

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

  /*
    The exact email address of the main owner account.
    Add this as a Text runtime variable in Cloudflare.
  */
  OWNER_ADMIN_EMAIL?: string;
}

type InquiryPayload = {
  name?: unknown;
  contact?: unknown;
  message?: unknown;
  website?: unknown;
};

type CreateAdminPayload = {
  fullName?: unknown;
  email?: unknown;
  password?: unknown;
};

type UpdateAdminPayload = {
  fullName?: unknown;
  password?: unknown;
  active?: unknown;
};


type SiteSettingsPayload = {
  phone_display?: unknown;
  phone_link?: unknown;
  whatsapp_link?: unknown;
  city?: unknown;
  instagram_url?: unknown;
  instagram_handle?: unknown;
  facebook_url?: unknown;
  footer_tagline?: unknown;
  footer_rights_text?: unknown;
};

type AuthorizedAdmin = {
  supabase: SupabaseClient;
  user: User;
  isOwner: boolean;
};

const jsonResponse = (
  status: number,
  body: Record<string, unknown>
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
    },
  });

const cleanText = (
  value: unknown,
  maximumLength: number
): string =>
  String(value || "")
    .trim()
    .slice(0, maximumLength);

const normalizeEmail = (value: unknown): string =>
  cleanText(value, 254).toLowerCase();

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (password: string): boolean =>
  password.length >= 12 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

const getServerConfiguration = (
  env: Env
): {
  supabaseUrl: string;
  supabaseSecretKey: string;
} | null => {
  const supabaseUrl = env.SUPABASE_URL?.trim();

  const supabaseSecretKey =
    env.SUPABASE_SECRET_KEY?.trim() ||
    env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseSecretKey,
  };
};

const createServerSupabase = (
  env: Env
): SupabaseClient | null => {
  const configuration = getServerConfiguration(env);

  if (!configuration) {
    return null;
  }

  return createClient(
    configuration.supabaseUrl,
    configuration.supabaseSecretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
};

const getBearerToken = (
  request: Request
): string | null => {
  const authorization =
    request.headers.get("Authorization") || "";

  const match = authorization.match(
    /^Bearer\s+(.+)$/i
  );

  return match?.[1]?.trim() || null;
};

const requireJsonRequest = (
  request: Request
): Response | null => {
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

  return null;
};

async function authorizeAdmin(
  request: Request,
  env: Env,
  ownerRequired = false
): Promise<
  | { ok: true; value: AuthorizedAdmin }
  | { ok: false; response: Response }
> {
  const supabase = createServerSupabase(env);

  if (!supabase) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY."
    );

    return {
      ok: false,
      response: jsonResponse(500, {
        error: "Server is not configured.",
      }),
    };
  }

  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      response: jsonResponse(401, {
        error: "Authentication is required.",
      }),
    };
  }

  /*
    getUser(token) performs a request to Supabase Auth
    and verifies that the access token belongs to a
    real current user.
  */
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return {
      ok: false,
      response: jsonResponse(401, {
        error:
          "Your session is invalid or has expired.",
      }),
    };
  }

  /*
    Every account that can open the SHIYRA dashboard
    must also exist in public.admin_users.
  */
  const {
    data: adminRecord,
    error: adminError,
  } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminRecord) {
    return {
      ok: false,
      response: jsonResponse(403, {
        error:
          "This account is not authorized for the admin dashboard.",
      }),
    };
  }

  const ownerEmail = normalizeEmail(
    env.OWNER_ADMIN_EMAIL
  );

  const isOwner =
    Boolean(ownerEmail) &&
    normalizeEmail(user.email) === ownerEmail;

  if (ownerRequired && !ownerEmail) {
    return {
      ok: false,
      response: jsonResponse(500, {
        error:
          "OWNER_ADMIN_EMAIL is not configured in Cloudflare.",
      }),
    };
  }

  if (ownerRequired && !isOwner) {
    return {
      ok: false,
      response: jsonResponse(403, {
        error:
          "Only the main owner can manage dashboard accounts.",
      }),
    };
  }

  return {
    ok: true,
    value: {
      supabase,
      user,
      isOwner,
    },
  };
}

const mapAdminUser = (
  user: User,
  activeUserIds: Set<string>,
  ownerEmail: string
) => {
  const email = normalizeEmail(user.email);
  const isOwner =
    Boolean(ownerEmail) && email === ownerEmail;

  return {
    id: user.id,
    fullName: cleanText(
      user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "",
      120
    ),
    email,
    role: isOwner ? "owner" : "admin",
    active: isOwner || activeUserIds.has(user.id),
    isOwner,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at || null,
    emailConfirmed:
      Boolean(user.email_confirmed_at),
  };
};

async function handleAdminSession(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "GET") {
    return jsonResponse(405, {
      error: "Method not allowed.",
    });
  }

  const authorization = await authorizeAdmin(
    request,
    env
  );

  if ("response" in authorization) {
    return authorization.response;
  }

  const { user, isOwner } =
    authorization.value;

  return jsonResponse(200, {
    ok: true,
    user: {
      id: user.id,
      email: normalizeEmail(user.email),
      fullName: cleanText(
        user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "",
        120
      ),
      role: isOwner ? "owner" : "admin",
      canManageUsers: isOwner,
    },
  });
}

async function handleAdminUsersCollection(
  request: Request,
  env: Env
): Promise<Response> {
  const authorization = await authorizeAdmin(
    request,
    env,
    true
  );

  if ("response" in authorization) {
    return authorization.response;
  }

  const { supabase } = authorization.value;
  const ownerEmail = normalizeEmail(
    env.OWNER_ADMIN_EMAIL
  );

  if (request.method === "GET") {
    const [
      usersResult,
      adminRecordsResult,
    ] = await Promise.all([
      supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      }),
      supabase
        .from("admin_users")
        .select("user_id"),
    ]);

    if (usersResult.error) {
      console.error(
        "Could not list Supabase users:",
        usersResult.error
      );

      return jsonResponse(500, {
        error:
          "Could not load dashboard accounts.",
      });
    }

    if (adminRecordsResult.error) {
      console.error(
        "Could not list admin_users:",
        adminRecordsResult.error
      );

      return jsonResponse(500, {
        error:
          "Could not load account access records.",
      });
    }

    const activeUserIds = new Set<string>(
      (adminRecordsResult.data || []).map(
        (record) => String(record.user_id)
      )
    );

    const visibleUsers =
      usersResult.data.users
        .filter((user) => {
          const email = normalizeEmail(
            user.email
          );

          return (
            email === ownerEmail ||
            activeUserIds.has(user.id) ||
            user.app_metadata
              ?.managed_by ===
              "shiyra-sweet"
          );
        })
        .map((user) =>
          mapAdminUser(
            user,
            activeUserIds,
            ownerEmail
          )
        )
        .sort((a, b) => {
          if (a.isOwner) return -1;
          if (b.isOwner) return 1;

          return a.email.localeCompare(
            b.email
          );
        });

    return jsonResponse(200, {
      ok: true,
      users: visibleUsers,
    });
  }

  if (request.method === "POST") {
    const contentTypeError =
      requireJsonRequest(request);

    if (contentTypeError) {
      return contentTypeError;
    }

    let payload: CreateAdminPayload;

    try {
      payload =
        (await request.json()) as CreateAdminPayload;
    } catch {
      return jsonResponse(400, {
        error: "Invalid request body.",
      });
    }

    const fullName = cleanText(
      payload.fullName,
      120
    );

    const email = normalizeEmail(
      payload.email
    );

    const password = String(
      payload.password || ""
    );

    if (!fullName) {
      return jsonResponse(400, {
        error: "Full name is required.",
      });
    }

    if (!isValidEmail(email)) {
      return jsonResponse(400, {
        error:
          "Enter a valid email address.",
      });
    }

    if (!isStrongPassword(password)) {
      return jsonResponse(400, {
        error:
          "Password must contain at least 12 characters, including uppercase, lowercase, a number, and a symbol.",
      });
    }

    /*
      createUser is an admin server operation.
      email_confirm: true means no invitation or
      confirmation email is sent. The account can
      sign in immediately with the password supplied
      by the owner.
    */
    const {
      data: createResult,
      error: createError,
    } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
        app_metadata: {
          role: "admin",
          managed_by: "shiyra-sweet",
        },
      });

    if (
      createError ||
      !createResult.user
    ) {
      console.error(
        "Could not create auth user:",
        createError
      );

      const message =
        createError?.message ||
        "Could not create the account.";

      return jsonResponse(400, {
        error: message,
      });
    }

    const createdUser =
      createResult.user;

    /*
      Add the new Auth user to admin_users because
      the existing dashboard authorization checks
      this table before granting access.
    */
    const {
      error: accessError,
    } = await supabase
      .from("admin_users")
      .insert({
        user_id: createdUser.id,
      });

    if (accessError) {
      console.error(
        "Could not add admin access:",
        accessError
      );

      /*
        Roll back the Auth user so there is not a
        partially created account that cannot log in.
      */
      await supabase.auth.admin.deleteUser(
        createdUser.id
      );

      return jsonResponse(500, {
        error:
          "The account could not be authorized. No account was kept.",
      });
    }

    const activeUserIds = new Set([
      createdUser.id,
    ]);

    return jsonResponse(201, {
      ok: true,
      user: mapAdminUser(
        createdUser,
        activeUserIds,
        ownerEmail
      ),
    });
  }

  return jsonResponse(405, {
    error: "Method not allowed.",
  });
}

async function handleAdminUserItem(
  request: Request,
  env: Env,
  userId: string
): Promise<Response> {
  const authorization = await authorizeAdmin(
    request,
    env,
    true
  );

  if ("response" in authorization) {
    return authorization.response;
  }

  const {
    supabase,
    user: currentUser,
  } = authorization.value;

  const ownerEmail = normalizeEmail(
    env.OWNER_ADMIN_EMAIL
  );

  const {
    data: targetResult,
    error: targetError,
  } =
    await supabase.auth.admin.getUserById(
      userId
    );

  const targetUser =
    targetResult?.user || null;

  if (targetError || !targetUser) {
    return jsonResponse(404, {
      error: "Account not found.",
    });
  }

  const targetIsOwner =
    normalizeEmail(targetUser.email) ===
    ownerEmail;

  if (request.method === "PATCH") {
    const contentTypeError =
      requireJsonRequest(request);

    if (contentTypeError) {
      return contentTypeError;
    }

    let payload: UpdateAdminPayload;

    try {
      payload =
        (await request.json()) as UpdateAdminPayload;
    } catch {
      return jsonResponse(400, {
        error: "Invalid request body.",
      });
    }

    const updateAttributes: {
      password?: string;
      user_metadata?: Record<
        string,
        unknown
      >;
      app_metadata?: Record<
        string,
        unknown
      >;
    } = {};

    if (payload.fullName !== undefined) {
      const fullName = cleanText(
        payload.fullName,
        120
      );

      if (!fullName) {
        return jsonResponse(400, {
          error:
            "Full name cannot be empty.",
        });
      }

      updateAttributes.user_metadata = {
        ...(targetUser.user_metadata ||
          {}),
        full_name: fullName,
      };
    }

    if (payload.password !== undefined) {
      const password = String(
        payload.password || ""
      );

      if (!isStrongPassword(password)) {
        return jsonResponse(400, {
          error:
            "Password must contain at least 12 characters, including uppercase, lowercase, a number, and a symbol.",
        });
      }

      updateAttributes.password =
        password;
    }

    /*
      Preserve the server-controlled admin role.
      app_metadata cannot be safely changed by the
      user from the browser.
    */
    if (!targetIsOwner) {
      updateAttributes.app_metadata = {
        ...(targetUser.app_metadata ||
          {}),
        role: "admin",
        managed_by: "shiyra-sweet",
      };
    }

    if (
      Object.keys(updateAttributes)
        .length > 0
    ) {
      const {
        error: updateError,
      } =
        await supabase.auth.admin.updateUserById(
          userId,
          updateAttributes
        );

      if (updateError) {
        console.error(
          "Could not update admin user:",
          updateError
        );

        return jsonResponse(400, {
          error:
            updateError.message ||
            "Could not update the account.",
        });
      }
    }

    if (
      payload.active !== undefined
    ) {
      if (targetIsOwner) {
        return jsonResponse(400, {
          error:
            "The main owner account cannot be disabled.",
        });
      }

      if (payload.active === true) {
        const {
          error: enableError,
        } = await supabase
          .from("admin_users")
          .upsert(
            {
              user_id: userId,
            },
            {
              onConflict: "user_id",
            }
          );

        if (enableError) {
          return jsonResponse(500, {
            error:
              "Could not enable dashboard access.",
          });
        }
      } else if (
        payload.active === false
      ) {
        const {
          error: disableError,
        } = await supabase
          .from("admin_users")
          .delete()
          .eq("user_id", userId);

        if (disableError) {
          return jsonResponse(500, {
            error:
              "Could not disable dashboard access.",
          });
        }
      }
    }

    const [
      refreshedUserResult,
      accessResult,
    ] = await Promise.all([
      supabase.auth.admin.getUserById(
        userId
      ),
      supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const refreshedUser =
      refreshedUserResult.data.user;

    if (!refreshedUser) {
      return jsonResponse(500, {
        error:
          "The account was updated but could not be reloaded.",
      });
    }

    const activeUserIds = new Set<string>();

    if (
      accessResult.data ||
      targetIsOwner
    ) {
      activeUserIds.add(userId);
    }

    return jsonResponse(200, {
      ok: true,
      user: mapAdminUser(
        refreshedUser,
        activeUserIds,
        ownerEmail
      ),
    });
  }

  if (request.method === "DELETE") {
    if (
      targetIsOwner ||
      targetUser.id === currentUser.id
    ) {
      return jsonResponse(400, {
        error:
          "The main owner account cannot be deleted.",
      });
    }

    const {
      error: accessDeleteError,
    } = await supabase
      .from("admin_users")
      .delete()
      .eq("user_id", userId);

    if (accessDeleteError) {
      return jsonResponse(500, {
        error:
          "Could not remove dashboard access.",
      });
    }

    const {
      error: userDeleteError,
    } =
      await supabase.auth.admin.deleteUser(
        userId
      );

    if (userDeleteError) {
      /*
        Restore access if Auth deletion fails so the
        database does not end in a half-deleted state.
      */
      await supabase
        .from("admin_users")
        .upsert(
          {
            user_id: userId,
          },
          {
            onConflict: "user_id",
          }
        );

      return jsonResponse(500, {
        error:
          userDeleteError.message ||
          "Could not delete the account.",
      });
    }

    return jsonResponse(200, {
      ok: true,
    });
  }

  return jsonResponse(405, {
    error: "Method not allowed.",
  });
}


async function handleAdminSettings(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "PATCH") {
    return jsonResponse(405, {
      error: "Method not allowed.",
    });
  }

  const authorization = await authorizeAdmin(
    request,
    env
  );

  if ("response" in authorization) {
    return authorization.response;
  }

  const contentTypeError =
    requireJsonRequest(request);

  if (contentTypeError) {
    return contentTypeError;
  }

  let payload: SiteSettingsPayload;

  try {
    payload =
      (await request.json()) as SiteSettingsPayload;
  } catch {
    return jsonResponse(400, {
      error: "Invalid request body.",
    });
  }

  const {
    supabase,
    isOwner,
  } = authorization.value;

  const {
    data: currentSettings,
    error: currentSettingsError,
  } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (
    currentSettingsError ||
    !currentSettings
  ) {
    console.error(
      "Could not load site settings:",
      currentSettingsError
    );

    return jsonResponse(500, {
      error:
        "Could not load the current website settings.",
    });
  }

  const nextCopyrightText =
    isOwner
      ? cleanText(
          payload.footer_rights_text,
          300
        )
      : cleanText(
          currentSettings.footer_rights_text,
          300
        );

  if (
    isOwner &&
    !nextCopyrightText
  ) {
    return jsonResponse(400, {
      error:
        "Copyright / rights text cannot be empty.",
    });
  }

  const updatePayload = {
    phone_display: cleanText(
      payload.phone_display ??
        currentSettings.phone_display,
      80
    ),
    phone_link: cleanText(
      payload.phone_link ??
        currentSettings.phone_link,
      40
    ),
    whatsapp_link: cleanText(
      payload.whatsapp_link ??
        currentSettings.whatsapp_link,
      40
    ),
    city: cleanText(
      payload.city ??
        currentSettings.city,
      120
    ),
    instagram_url: cleanText(
      payload.instagram_url ??
        currentSettings.instagram_url,
      500
    ),
    instagram_handle: cleanText(
      payload.instagram_handle ??
        currentSettings.instagram_handle,
      120
    ),
    facebook_url: cleanText(
      payload.facebook_url ??
        currentSettings.facebook_url,
      500
    ),
    footer_tagline: cleanText(
      payload.footer_tagline ??
        currentSettings.footer_tagline,
      300
    ),
    footer_rights_text:
      nextCopyrightText,
    updated_at:
      new Date().toISOString(),
  };

  const {
    data: updatedSettings,
    error: updateError,
  } = await supabase
    .from("site_settings")
    .update(updatePayload)
    .eq("id", 1)
    .select("*")
    .single();

  if (
    updateError ||
    !updatedSettings
  ) {
    console.error(
      "Could not update site settings:",
      updateError
    );

    return jsonResponse(500, {
      error:
        updateError?.message ||
        "Could not save the website settings.",
    });
  }

  return jsonResponse(200, {
    ok: true,
    settings: updatedSettings,
    copyrightEditable: isOwner,
  });
}

async function handleInquiry(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(405, {
      error: "Method not allowed.",
    });
  }

  const contentTypeError =
    requireJsonRequest(request);

  if (contentTypeError) {
    return contentTypeError;
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

  const supabase =
    createServerSupabase(env);

  if (!supabase) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY."
    );

    return jsonResponse(500, {
      error: "Server is not configured.",
    });
  }

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

    if (
      url.pathname ===
      "/api/submit-inquiry"
    ) {
      return handleInquiry(request, env);
    }

    if (
      url.pathname ===
      "/api/admin/session"
    ) {
      return handleAdminSession(
        request,
        env
      );
    }

    if (
      url.pathname ===
      "/api/admin/settings"
    ) {
      return handleAdminSettings(
        request,
        env
      );
    }

    if (
      url.pathname ===
      "/api/admin/users"
    ) {
      return handleAdminUsersCollection(
        request,
        env
      );
    }

    const adminUserMatch =
      url.pathname.match(
        /^\/api\/admin\/users\/([0-9a-f-]{36})$/i
      );

    if (adminUserMatch) {
      return handleAdminUserItem(
        request,
        env,
        adminUserMatch[1]
      );
    }

    return env.ASSETS.fetch(request);
  },
};
