import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageBanner } from '@/components/ui/PageBanner';
import { PackageCard } from '@/components/tours/PackageCard';
import { TourFilters } from '@/components/tours/TourFilters';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { CardGridSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { apiListSafe } from '@/lib/api';
import { getSettings } from '@/lib/settings';
import { flattenCategories, getAreas, getCategories, getCountries } from '@/lib/catalog';
import { TAGS } from '@/lib/tags';
import type { Category, Tour, TravelArea } from '@/types';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Query = Record<string, string | string[] | undefined>;

const one = (sp: Query, key: string) => (Array.isArray(sp[key]) ? sp[key][0] : sp[key]) as string | undefined;

const findArea = (areas: TravelArea[], slug?: string) =>
  slug ? areas.flatMap((g) => [g, ...(g.children ?? [])]).find((a) => a.slug === slug) : undefined;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const slug = one(sp, 'category');
  const category = slug ? flattenCategories(await getCategories()).find((c) => c.slug === slug) : undefined;
  const area = category ? undefined : findArea(await getAreas(), one(sp, 'area'));
  return {
    title: category ? category.name : area ? `${area.name} packages` : 'Packages & Safaris',
    description:
      category?.description ||
      'Kenyan getaways, safari adventures across East Africa, and handpicked international escapes from Holidaybank Expeditions.',
  };
}

/**
 * The banner renders straight away; only the listing waits on the tours
 * request, behind its own skeleton. This used to be a route-level loading.tsx,
 * but that boundary also wrapped /tours/[slug] and made its 404s answer 200.
 */
export default async function ToursPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const [settings, categories, areas] = await Promise.all([getSettings(), getCategories(), getAreas()]);

  // A filtered view takes its banner from the category (or area) itself.
  const category = flattenCategories(categories).find((c) => c.slug === one(sp, 'category'));
  const area = findArea(areas, one(sp, 'area'));
  const banner = settings.pages.tours;

  const page = Math.max(1, Number(one(sp, 'page') ?? 1) || 1);
  const query = new URLSearchParams({ page: String(page), limit: '12' });
  for (const key of ['category', 'country', 'area', 'sort', 'q'] as const) {
    const value = one(sp, key);
    if (value) query.set(key, value);
  }

  return (
    <>
      <PageBanner
        eyebrow={category?.eyebrow ?? area?.parent?.name}
        title={category ? category.name : area ? area.name : banner.title}
        subtitle={category?.description || area?.description || banner.subtitle}
        image={category?.heroImage ?? banner.image}
        crumbs={[
          { href: '/', label: 'Home' },
          { href: '/tours', label: 'Packages' },
          ...(category ? [{ href: `/tours?category=${category.slug}`, label: category.name }] : []),
          ...(!category && area ? [{ href: `/tours?area=${area.slug}`, label: area.name }] : []),
        ]}
      />

      <section className="bg-cream-100 py-14 md:py-20">
        <div className="container-page">
          {/* Keyed on the query so a filter change shows the skeleton again
              rather than leaving stale cards on screen. */}
          <Suspense key={query.toString()} fallback={<ListingSkeleton />}>
            <TourListing query={query} categories={categories} area={area} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function TourListing({
  query,
  categories,
  area,
}: {
  query: URLSearchParams;
  categories: Category[];
  area?: TravelArea;
}) {
  const [{ items, meta }, countries] = await Promise.all([
    apiListSafe<Tour>(`/api/tours?${query.toString()}`, { tags: [TAGS.tours] }),
    getCountries(),
  ]);

  return (
    <>
      <TourFilters total={meta?.total ?? items.length} categories={categories} countries={countries} area={area} />

      {items.length === 0 ? (
        <EmptyState
          title="No packages match those filters"
          message="Try widening your search, or tell us your dates and budget and we will put a trip together."
          action={<ButtonLink href="/contact">Plan a custom trip</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((tour, i) => (
              <PackageCard key={tour._id} tour={tour} priority={i < 4} />
            ))}
          </div>

          {meta && meta.totalPages > 1 ? (
            <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((n) => {
                const next = new URLSearchParams(query);
                next.set('page', String(n));
                next.delete('limit');
                return (
                  <Link
                    key={n}
                    href={`/tours?${next.toString()}`}
                    aria-current={n === meta.page ? 'page' : undefined}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors ${
                      n === meta.page
                        ? 'bg-charcoal-900 text-cream-50'
                        : 'border border-cream-300 text-charcoal-900 hover:border-charcoal-900'
                    }`}
                  >
                    {n}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </>
      )}
    </>
  );
}

function ListingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading packages">
      <div className="mb-10 space-y-6">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-11 w-36 rounded-full" />
          ))}
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <CardGridSkeleton count={9} />
    </div>
  );
}
