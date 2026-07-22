import { useEffect, useState } from "react";
import Ornament from "./Ornament";
import {
  DEFAULT_SITE_SETTINGS,
  fetchSiteSettings,
  type SiteSettings,
} from "../lib/siteSettings";

export default function Contact() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSiteSettings().then(setSettings);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/.netlify/functions/submit-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          contact: formData.get("contact"),
          message: formData.get("message"),
          website: formData.get("website"),
        }),
      });

      if (response.ok) {
        setSent(true);
        form.reset();
      } else {
        const result = await response.json().catch(() => ({}));
        setError(result.error || "Something went wrong. Please try WhatsApp or Instagram instead.");
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
            Contact & Inquiries
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-green-deep sm:text-4xl">
            Let's Make Something Sweet
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-brown-soft">
            Based in {settings.city}. Send us your details, ask a question, or tell us about your event and we'll get back to you.
          </p>
          <Ornament className="mt-6" />
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-gold/25 bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-green-deep">
              Reach Us Directly
            </h3>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-deep/10 text-green-deep">📞</span>
                <a href={`tel:+${settings.phone_link}`} className="font-semibold text-brown transition-colors hover:text-maroon">
                  {settings.phone_display}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-deep/10 text-green-deep">💬</span>
                <a href={`https://wa.me/${settings.whatsapp_link}`} target="_blank" rel="noreferrer" className="font-semibold text-brown transition-colors hover:text-maroon">
                  WhatsApp us
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-deep/10 text-green-deep">📷</span>
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="font-semibold text-brown transition-colors hover:text-maroon">
                  {settings.instagram_handle}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-deep/10 text-green-deep">📘</span>
                <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="font-semibold text-brown transition-colors hover:text-maroon">
                  Facebook page
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-deep/10 text-green-deep">📍</span>
                <span className="font-semibold text-brown">{settings.city}</span>
              </li>
            </ul>
            <p className="mt-5 rounded-lg bg-cream-deep p-3 text-xs italic text-brown-soft">
              This website collects inquiries and showcases our work. We will contact you directly to discuss details and availability.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-gold/25 bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-green-deep">
              Send an Inquiry
            </h3>

            {sent ? (
              <div className="mt-6 rounded-xl bg-green-deep/10 p-6 text-center">
                <p className="text-3xl">🍯</p>
                <p className="mt-2 font-semibold text-green-deep">Thank you! Your inquiry was sent successfully.</p>
                <p className="mt-1 text-sm text-brown-soft">We will contact you as soon as possible.</p>
                <button type="button" onClick={() => setSent(false)} className="mt-4 text-xs font-semibold uppercase tracking-wide text-maroon underline">
                  Send another inquiry
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <Field label="Your Name" id="name">
                  <input id="name" name="name" type="text" required placeholder="e.g. Layla" className="ss-form-input" />
                </Field>
                <Field label="Phone or Email" id="contact-info">
                  <input id="contact-info" name="contact" type="text" required placeholder="How should we reach you?" className="ss-form-input" />
                </Field>
                <Field label="Your Message" id="message">
                  <textarea id="message" name="message" rows={4} required placeholder="Tell us what you're interested in, your event date, or any questions you have…" className="ss-form-input resize-none" />
                </Field>

                <div className="absolute left-[-9999px]" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                </div>

                {error && <p className="rounded-lg bg-maroon/10 p-3 text-xs text-maroon">{error}</p>}

                <button type="submit" disabled={sending} className="w-full rounded-full bg-maroon px-6 py-3 text-sm font-bold uppercase tracking-wide text-cream shadow-md transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                  {sending ? "Sending…" : "Send Inquiry"}
                </button>

                <p className="text-center text-[11px] text-brown-soft">
                  Or reach us on <a href={`https://wa.me/${settings.whatsapp_link}`} target="_blank" rel="noreferrer" className="font-semibold text-green-deep underline">WhatsApp</a> for a faster reply.
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

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-bold uppercase tracking-wide text-brown-soft">{label}</label>
      {children}
    </div>
  );
}
