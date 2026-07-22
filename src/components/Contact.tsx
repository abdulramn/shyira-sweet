import { useEffect, useState } from "react";
import Ornament from "./Ornament";
import {
  DEFAULT_SITE_SETTINGS,
  fetchSiteSettings,
  type SiteSettings,
} from "../lib/siteSettings";
import { supabase } from "../lib/supabase";

export default function Contact() {
  const [settings, setSettings] =
    useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSiteSettings().then(setSettings);
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setSending(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      contact: String(
        formData.get("contact") || ""
      ).trim(),
      message: String(
        formData.get("message") || ""
      ).trim(),
      website: String(
        formData.get("website") || ""
      ).trim(),
    };

    if (
      !payload.name ||
      !payload.contact ||
      !payload.message
    ) {
      setError(
        "Please complete all required fields."
      );
      setSending(false);
      return;
    }

    /*
      Honeypot spam protection.
      Real visitors will never fill this field.
    */
    if (payload.website) {
      setSent(true);
      form.reset();
      setSending(false);
      return;
    }

    let saved = false;
    let lastError = "";

    /*
      Primary path:
      Netlify Function

      This saves the inquiry to Supabase
      and sends the Discord notification.
    */
    try {
      const response = await fetch(
        "/.netlify/functions/submit-inquiry",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        saved = true;
      } else {
        const result = await response
          .json()
          .catch(() => ({}));

        lastError =
          result.error ||
          `Server error (${response.status})`;
      }
    } catch (functionError) {
      lastError =
        functionError instanceof Error
          ? functionError.message
          : "Network error";
    }

    /*
      Safety fallback:
      If Netlify Function fails,
      still try to save the inquiry directly
      to Supabase.
    */
    if (!saved && supabase) {
      const { error: insertError } =
        await supabase
          .from("inquiries")
          .insert({
            name: payload.name,
            contact: payload.contact,
            message: payload.message,
          });

      if (!insertError) {
        saved = true;
      } else {
        lastError = insertError.message;
      }
    }

    if (saved) {
      setSent(true);
      form.reset();
    } else {
      console.error(
        "Could not save inquiry:",
        lastError
      );

      setError(
        "Could not send your inquiry. Please try again in a moment, call us, or contact us on Instagram."
      );
    }

    setSending(false);
  };

  return (
    <section
      id="contact"
      className="bg-cream py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-5">

        {/* SECTION HEADING */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-maroon">
            Contact SHYIRA Sweet
          </p>

          <h2 className="mt-2 font-display text-3xl font-bold text-green-deep sm:text-4xl">
            Let's Create Something Sweet
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-brown-soft sm:text-base">
            Have a question about our sweets,
            availability, or an upcoming event?
            Send us an inquiry and we'll personally
            get back to you.
          </p>

          <Ornament className="mt-6" />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">

          {/* ==================================================
              DIRECT CONTACT CARD
             ================================================== */}

          <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-white shadow-[0_20px_60px_rgba(90,59,34,0.08)]">

            {/* Decorative top area */}
            <div className="bg-green-deep px-7 py-8 text-cream sm:px-8">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-soft">
                Reach Us Directly
              </p>

              <h3 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
                We're Here to Help
              </h3>

              <p className="mt-3 max-w-md text-sm leading-6 text-cream/75">
                Questions about our sweets,
                availability, or special events?
                Reach out through any of the options
                below.
              </p>
            </div>

            <div className="space-y-3 p-5 sm:p-7">

              {/* PHONE */}
              <ContactCard
                href={`tel:+${settings.phone_link}`}
                title="Call Us"
                value={settings.phone_display}
                helper="Tap to call SHYIRA Sweet"
                icon={<PhoneIcon />}
              />

              {/* INSTAGRAM */}
              <ContactCard
                href={settings.instagram_url}
                title="Instagram"
                value={settings.instagram_handle}
                helper="See our latest creations"
                icon={<InstagramIcon />}
                external
              />

              {/* FACEBOOK */}
              <ContactCard
                href={settings.facebook_url}
                title="Facebook"
                value="Visit our Facebook page"
                helper="Follow SHYIRA Sweet"
                icon={<FacebookIcon />}
                external
              />

              {/* LOCATION */}
              <div className="flex items-center gap-4 rounded-2xl border border-gold/15 bg-cream/60 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-deep text-cream">
                  <MapPinIcon />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-brown-soft">
                    Based In
                  </p>

                  <p className="mt-1 font-semibold text-brown">
                    {settings.city}
                  </p>
                </div>
              </div>

              {/* MESSAGE */}
              <div className="mt-5 rounded-2xl border border-gold/20 bg-cream-deep/70 p-5">
                <p className="font-display text-lg font-semibold text-green-deep">
                  Planning something sweet?
                </p>

                <p className="mt-2 text-sm leading-6 text-brown-soft">
                  Tell us what you have in mind using
                  the inquiry form. We'll personally
                  reach out to discuss availability
                  and details.
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              INQUIRY FORM
             ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-gold/25 bg-white p-6 shadow-[0_20px_60px_rgba(90,59,34,0.08)] sm:p-8"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-maroon">
                Get In Touch
              </p>

              <h3 className="mt-2 font-display text-2xl font-semibold text-green-deep">
                Send an Inquiry
              </h3>

              <p className="mt-2 text-sm leading-6 text-brown-soft">
                Share your question, event details,
                or what you're interested in and
                we'll get back to you directly.
              </p>
            </div>

            {sent ? (
              <div className="mt-8 rounded-2xl border border-green-deep/10 bg-green-deep/10 p-8 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-deep text-2xl text-cream">
                  ✓
                </div>

                <p className="mt-4 font-display text-xl font-semibold text-green-deep">
                  Thank You!
                </p>

                <p className="mt-2 text-sm leading-6 text-brown-soft">
                  Your inquiry was sent
                  successfully. We'll contact you as
                  soon as possible.
                </p>

                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-5 text-xs font-bold uppercase tracking-wide text-maroon underline underline-offset-4"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <div className="mt-7 space-y-5">

                <Field
                  label="Your Name"
                  id="name"
                >
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Layla"
                    className="ss-form-input"
                  />
                </Field>

                <Field
                  label="Phone or Email"
                  id="contact-info"
                >
                  <input
                    id="contact-info"
                    name="contact"
                    type="text"
                    required
                    placeholder="How should we reach you?"
                    className="ss-form-input"
                  />
                </Field>

                <Field
                  label="Your Message"
                  id="message"
                >
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    placeholder="Tell us what you're interested in, your event date, or any questions you have..."
                    className="ss-form-input resize-none"
                  />
                </Field>

                {/* SPAM HONEYPOT */}
                <div
                  className="absolute left-[-9999px]"
                  aria-hidden="true"
                >
                  <label htmlFor="website">
                    Website
                  </label>

                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-maroon/10 bg-maroon/10 p-4 text-sm text-maroon">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-full bg-maroon px-6 py-4 text-sm font-bold uppercase tracking-[0.12em] text-cream shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending
                    ? "Sending..."
                    : "Send Inquiry"}
                </button>

                <p className="text-center text-xs leading-5 text-brown-soft">
                  We review every inquiry personally
                  and will contact you using the
                  phone number or email you provide.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      <style>{`
        .ss-form-input {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid rgba(214,155,40,.35);
          background: #faf3e6;
          padding: .85rem 1rem;
          font-size: .95rem;
          color: #5a3b22;
          outline: none;
          font-family: inherit;
          transition:
            border-color .2s ease,
            box-shadow .2s ease,
            background-color .2s ease;
        }

        .ss-form-input:focus {
          border-color: #7a1f2b;
          background: #fff;
          box-shadow:
            0 0 0 3px rgba(122,31,43,.10);
        }

        .ss-form-input::placeholder {
          color: #a88f75;
        }
      `}</style>
    </section>
  );
}

/* ==================================================
   CONTACT CARD
   ================================================== */

function ContactCard({
  href,
  title,
  value,
  helper,
  icon,
  external = false,
}: {
  href: string;
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex items-center gap-4 rounded-2xl border border-gold/15 bg-cream/40 p-4 transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:bg-cream hover:shadow-md"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-deep text-cream transition-transform group-hover:scale-105">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-brown-soft">
          {title}
        </p>

        <p className="mt-1 truncate font-semibold text-brown group-hover:text-maroon">
          {value}
        </p>

        <p className="mt-0.5 text-xs text-brown-soft">
          {helper}
        </p>
      </div>

      <span className="text-lg text-gold transition-transform group-hover:translate-x-1">
        →
      </span>
    </a>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-brown-soft"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

/* ==================================================
   ICONS
   ================================================== */

function PhoneIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
      />

      <circle
        cx="17.5"
        cy="6.5"
        r="1"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v2H6v4h3v7h4v-7h3.2l.8-4H13V9c0-.7.3-1 1-1z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z" />

      <circle
        cx="12"
        cy="10"
        r="3"
      />
    </svg>
  );
}
