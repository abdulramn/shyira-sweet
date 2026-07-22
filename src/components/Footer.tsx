const WHATSAPP_LINK = "17346293442";
const INSTAGRAM_URL = "https://www.instagram.com/shyira.sweet/";
const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=100054819966994";

export default function Footer() {
  return (
    <footer className="bg-green-deep text-cream">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-5 py-10 text-center">
        <img
          src="/images/logo.png"
          alt="SHYIRA Sweet logo"
          className="h-16 w-16 rounded-full border border-gold/40 object-cover"
        />
        <div>
          <p className="font-display text-2xl font-bold tracking-wide text-cream">
            SHYIRA Sweet
          </p>
          <p className="mt-1 text-sm italic text-gold-soft">
            Handmade from our home to your table — the taste of Syria.
          </p>
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-4">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold-soft transition-colors hover:bg-gold hover:text-green-deep"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
            </svg>
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_LINK}`}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold-soft transition-colors hover:bg-gold hover:text-green-deep"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3A3 3 0 0 0 6.8 10c0 1.8 1.3 3.5 1.5 3.7.2.2 2.6 4 6.3 5.4.9.4 1.6.6 2.1.5.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.4.2-1.5s-.4-.1-.6-.2Z" />
            </svg>
          </a>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold-soft transition-colors hover:bg-gold hover:text-green-deep"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.1V12h3.3V9.5c0-3.3 2-5.1 4.9-5.1 1.4 0 2.9.2 2.9.2v3.2h-1.6c-1.6 0-2.1 1-2.1 2v2.2h3.6l-.6 2.9h-3v7A10 10 0 0 0 22 12Z" />
            </svg>
          </a>
        </div>

        <div className="mt-2 border-t border-gold/20 pt-5 text-xs text-cream/60">
          <p>Baked with love in Michigan · Home-based small business</p>
          <p className="mt-1">
            © {new Date().getFullYear()} SHYIRA Sweet. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
