import { PackageCard } from '@/components/tours/PackageCard';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import type { Category, Tour } from '@/types';

/**
 * One product line on the homepage, laid out like the original site's
 * sections: eyebrow, heading and intro, then a grid of package cards. When the
 * line has more than one child (Safaris), each child gets its own sub-heading
 * with a rule, as the original did for "Kenyan Safaris" and
 * "Kenya · Tanzania · Uganda · Rwanda"; `flat` keeps the line as one grid
 * instead (International).
 */
export function CategorySection({
  group,
  tours,
  tone = 'light',
  id,
  title,
  flat = false,
  limit = 4,
  href,
}: {
  title?: string;
  flat?: boolean;
  /** Cards shown when the line is one grid. */
  limit?: number;
  /** Where "View all" leads, when not to the line's own category. */
  href?: string;
  group: Category;
  tours: Tour[];
  tone?: 'light' | 'dark';
  id?: string;
}) {
  if (!tours.length) return null;
  const dark = tone === 'dark';
  const children = group.children ?? [];
  const subgroups =
    !flat && children.length > 1
      ? children
          .map((child) => ({ child, items: tours.filter((t) => t.category === child.slug) }))
          .filter((s) => s.items.length > 0)
      : [];

  return (
    <section id={id} className={`py-16 md:py-24 ${dark ? 'bg-charcoal-900 text-cream-200' : 'bg-cream-100'}`}>
      <div className="container-page">
        <div className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className={`eyebrow ${dark ? 'text-gold-400' : 'text-gold-700'}`}>
              {group.eyebrow || group.name}
            </p>
            <h2 className={`mt-2 text-[clamp(1.8rem,3.6vw,2.6rem)] leading-tight ${dark ? 'text-white' : ''}`}>
              {title ?? group.name}
            </h2>
            {group.description ? (
              <p className={`mt-3.5 leading-relaxed ${dark ? 'text-[#b8b2a0]' : 'text-muted'}`}>{group.description}</p>
            ) : null}
          </div>
          <ButtonLink href={href ?? `/tours?category=${group.slug}`} variant={dark ? 'outline-light' : 'outline'} className="shrink-0 self-start md:self-auto">
            View all {group.tourCount ? `${group.tourCount} ` : ''}
            {group.kind === 'safari' ? 'safaris' : 'packages'} →
          </ButtonLink>
        </div>

        {subgroups.length > 0 ? (
          subgroups.map(({ child, items }, index) => (
            <div key={child.slug} className={index > 0 ? 'mt-14' : ''}>
              <div className="mb-6 flex items-center gap-3.5">
                <h3 className="text-[1.35rem]">{child.name}</h3>
                <span aria-hidden className={`h-px flex-1 ${dark ? 'bg-[#40424a]' : 'bg-cream-300'}`} />
              </div>
              <Grid tours={items.slice(0, 4)} tone={tone} />
            </div>
          ))
        ) : (
          // One row per line on the homepage; "View all" leads to the rest.
          <Grid tours={tours.slice(0, limit)} tone={tone} />
        )}
      </div>
    </section>
  );
}

function Grid({ tours, tone }: { tours: Tour[]; tone: 'light' | 'dark' }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {tours.map((tour, i) => (
        <Reveal key={tour._id} delay={(i % 4) * 70}>
          <PackageCard tour={tour} tone={tone} />
        </Reveal>
      ))}
    </div>
  );
}
