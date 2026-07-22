import { useState } from "react";
import Ornament from "./Ornament";

/*
  ================= CONTACT =================
  Real contact information for SHYIRA Sweet.
  Form uses Formspree — replace the endpoint below with your own
  Formspree form ID (create free account at formspree.io).
*/

const PHONE_DISPLAY = "+1 734-629-3442";
const PHONE_LINK = "17346293442";
const INSTAGRAM_URL = "https://www.instagram.com/shyira.sweet/";
const INSTAGRAM_HANDLE = "@shyira.sweet";
const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=100054819966994";
const WHATSAPP_LINK = "17346293442";
const CITY = "Michigan, USA";

// TODO: Replace with real Formspree endpoint after creating account at https://formspree.io
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mzdnvqoq";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        setSent(true);
        form.reset();
      } else {
        setError(
          "Something went wrong. Please try WhatsApp or Instagram instead."
        );
      }
    } catch {
      setError("Network error. Please try WhatsApp or Instagram instead.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="bg-cream py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-5">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-maroon">
            Location & Orders
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-green-deep sm:text-4xl">
            Let's Make Something Sweet
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-brown-soft">
            Based in {CITY}. Place an order, ask a question, or book kunafa for
            your event — we'd love to hear from you.
          </p>
          <Ornament className="mt-6" />
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {/* Contact details */}
          <div className="rounded-2xl border border-gold/25 bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-green-deep">
              Reach Us Directly
            </h3>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-deep/10 text-green-deep">
                  📞
                </span>
                <a
                  href={`tel:+${PHONE_LINK}`}
                  className="font-semibold text-brown transition-colors hover:text-maroon"
                >
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-deep/10 text-green-deep">
                  💬
                </span>
                <a
                  href={`https://wa.me/${WHATSAPP_LINK}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brown transition-colors hover:text-maroon"
                >
                  WhatsApp us
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-deep/10 text-green-deep">
                  📷
                </span>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brown transition-colors hover:text-maroon"
                >
                  {INSTAGRAM_HANDLE}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-deep/10 text-green-deep">
                  📘
                </span>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brown transition-colors hover:text-maroon"
                >
                  Facebook page
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-deep/10 text-green-deep">
                  📍
                </span>
                <span className="font-semibold text-brown">{CITY}</span>
              </li>
            </ul>
            <p className="mt-5 rounded-lg bg-cream-deep p-3 text-xs italic text-brown-soft">
              Pickup by appointment. Local delivery may be available for larger
              orders — just ask!
            </p>
          </div>

          {/* Contact form — sends via Formspree */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gold/25 bg-white p-6 shadow-sm"
          >
            <h3 className="font-display text-xl font-semibold text-green-deep">
              Send an Order or Inquiry
            </h3>

            {sent ? (
              <div className="mt-6 rounded-xl bg-green-deep/10 p-6 text-center">
                <p className="text-3xl">🍯</p>
                <p className="mt-2 font-semibold text-green-deep">
                  Thank you! Your message was sent successfully.
                </p>
                <p className="mt-1 text-sm text-brown-soft">
                  We will contact you within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-4 text-xs font-semibold uppercase tracking-wide text-maroon underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <Field label="Your Name" id="name">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Layla"
                    className="ss-form-input"
                  />
                </Field>
                <Field label="Phone or Email" id="contact-info">
                  <input
                    id="contact-info"
                    name="contact"
                    type="text"
                    required
                    placeholder="How should we reach you?"
                    className="ss-form-input"
                  />
                </Field>
                <Field label="Your Message" id="message">
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    placeholder="Tell us what you'd like to order, or your event date and guest count…"
                    className="ss-form-input resize-none"
                  />
                </Field>

                {error && (
                  <p className="rounded-lg bg-maroon/10 p-3 text-xs text-maroon">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-full bg-maroon px-6 py-3 text-sm font-bold uppercase tracking-wide text-cream shadow-md transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Send Message"}
                </button>

                <p className="text-center text-[11px] text-brown-soft">
                  Or reach us on{" "}
                  <a
                    href={`https://wa.me/${WHATSAPP_LINK}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-green-deep underline"
                  >
                    WhatsApp
                  </a>{" "}
                  for a faster reply.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      <style>{`
        .ss-form-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(214,155,40,0.35);
          background: #faf3e6;
          padding: 0.7rem 0.9rem;
          font-size: 0.9rem;
          color: #5a3b22;
          outline: none;
          font-family: inherit;
        }
        .ss-form-input:focus {
          border-color: #7a1f2b;
          box-shadow: 0 0 0 3px rgba(122,31,43,0.12);
        }
        .ss-form-input::placeholder { color: #b09a7f; }
      `}</style>
    </section>
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
        className="mb-1 block text-xs font-bold uppercase tracking-wide text-brown-soft"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
