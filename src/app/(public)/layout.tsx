import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContactLauncher } from '@/components/layout/ContactLauncher';
import { apiListSafe } from '@/lib/api';
import { getSettings } from '@/lib/settings';
import { getAreas, getCategories } from '@/lib/catalog';
import { needsAreas, needsDestinations, resolveNavigation, toHeaderNav } from '@/lib/navigation';
import { TAGS } from '@/lib/tags';
import type { Destination } from '@/types';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);

  // The menu arranged in the dashboard, or the automatic one built from the
  // category tree until someone arranges it. Linked items resolve against the
  // live catalogue; each fetch carries its own tags, so renaming a category
  // or adding an area refreshes the menu too.
  const menu = resolveNavigation(settings.navigation, categories);
  const [areas, destinations] = await Promise.all([
    needsAreas(menu) ? getAreas() : [],
    needsDestinations(menu)
      ? apiListSafe<Destination>('/api/destinations?limit=100', { tags: [TAGS.destinations] }).then((r) => r.items)
      : [],
  ]);
  const nav = toHeaderNav(menu, { categories, areas, destinations });

  return (
    <div className="flex min-h-screen flex-col">
      <Header nav={nav} phone={settings.contact.phone} whatsapp={settings.contact.whatsapp} logo={settings.brand.logoCompact} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} categories={categories} />
      <ContactLauncher
        phone={settings.contact.phone}
        whatsapp={settings.contact.whatsapp}
        email={settings.contact.email}
      />
    </div>
  );
}
