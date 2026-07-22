import { supabase } from "./supabase";

export type SiteSettings = {
  id: number;
  phone_display: string;
  phone_link: string;
  whatsapp_link: string;
  instagram_url: string;
  instagram_handle: string;
  facebook_url: string;
  city: string;
  footer_tagline: string;
  footer_rights_text: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 1,
  phone_display: "+1 734-629-3442",
  phone_link: "17346293442",
  whatsapp_link: "17346293442",
  instagram_url: "https://www.instagram.com/shyira.sweet/",
  instagram_handle: "@shyira.sweet",
  facebook_url: "https://www.facebook.com/profile.php?id=100054819966994",
  city: "Michigan, USA",
  footer_tagline: "Handmade from our home to your table — the taste of Syria.",
  footer_rights_text: "SHYIRA Sweet. All rights reserved.",
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (!supabase) return DEFAULT_SITE_SETTINGS;

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_SITE_SETTINGS;
  return { ...DEFAULT_SITE_SETTINGS, ...data } as SiteSettings;
}
