import Image from 'next/image';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import type { Category, TravelArea } from '@/types';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * "Where we go": the homepage's Kenyan Packages section as portrait cards, one
 * per Kenyan area (Diani, Watamu/Malindi, Maasai Mara, Amboseli, Tsavo), each
 * with its tag, teaser and a count of places and packages. Everything comes
 * from the Kenyan travel-area group in the API, so an area added or renamed
 * there appears here without a deploy.
 *
 * An area with no package yet still shows, as the business sells trips there
 * on request; its card leads to the enquiry form instead of an empty listing.
 */
export function KenyanAreasGrid({
  id,
  region,
  group,
  title,
}: {
  id?: string;
  /** The "kenyan" travel-area group, with its areas as children. */
  region: TravelArea;
  /** The Kenyan Packages category, for the section's intro. */
  group?: Category;
  title?: string;
}) {
  const areas = region.children ?? [];
  if (!areas.length) return null;

  return (
    <section id={id} className="bg-cream-100 py-16 md:py-24">
      <div className="container-page">
        <div className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow text-gold-700">Where we go</p>
            <h2 className="mt-2 text-[clamp(1.8rem,3.6vw,2.6rem)] leading-tight">{title ?? group?.name ?? region.name}</h2>
            {group?.description ? <p className="mt-3.5 leading-relaxed text-muted">{group.description}</p> : null}
          </div>
          <ButtonLink href={`/tours?area=${region.slug}`} variant="outline" className="shrink-0 self-start md:self-auto">
            View all {region.tourCount ? `${region.tourCount} ` : ''}Kenyan packages →
          </ButtonLink>
        </div>

        {/* A swipeable row on phones, a grid from small tablets up. */}
        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5">
          {areas.map((area, i) => (
            <li key={area.slug} className="w-[72%] shrink-0 snap-start sm:w-auto">
              <AreaCard area={area} priority={i < 2} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AreaCard({ area, priority }: { area: TravelArea; priority: boolean }) {
  const packages = area.tourCount ?? 0;
  const href = packages ? `/tours?area=${area.slug}` : '/contact';
  const counter = [
    area.placeCount ? plural(area.placeCount, 'place', 'places') : null,
    packages ? plural(packages, 'package', 'packages') : 'Packages on request',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={href}
      className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-card bg-charcoal-900 text-white shadow-card transition-shadow duration-500 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
    >
      {area.image?.url ? (
        <Image
          src={area.image.url}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 72vw"
          className="object-cover transition-transform duration-700 ease-soft group-hover:scale-105"
        />
      ) : null}
      {/* Darkens the lower half so white text holds on bright beach photographs. */}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-charcoal-950/95 via-charcoal-950/45 to-charcoal-950/0" />

      <div className="relative p-5">
        {area.tag ? <p className="text-[0.66rem] font-medium uppercase tracking-[0.2em] text-gold-400">{area.tag}</p> : null}
        <h3 className="mt-1.5 text-2xl font-semibold leading-tight text-white">{area.name}</h3>
        {area.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-cream-100/85">{area.description}</p>
        ) : null}
        <p className="mt-4 text-xs font-medium tracking-wide text-cream-50">
          {counter}{' '}
          <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </p>
      </div>
    </Link>
  );
}
