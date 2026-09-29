import { Fragment } from 'react';
import { Hero } from '@/components/home/Hero';
import { CredentialsStrip } from '@/components/home/CredentialsStrip';
import { CategorySection } from '@/components/home/CategorySection';
import { KenyanAreasGrid } from '@/components/home/KenyanAreasGrid';
import { WhyUs } from '@/components/home/WhyUs';
import { VideoSection } from '@/components/home/VideoSection';
import { CountriesGrid } from '@/components/home/CountriesGrid';
import { PromoBand } from '@/components/home/PromoBand';
import { TestimonialCarousel } from '@/components/home/TestimonialCarousel';
import { FaqBlock } from '@/components/home/FaqBlock';
import { BlogCard } from '@/components/blog/BlogCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { ParallaxSection } from '@/components/ui/ParallaxSection';

import { apiListSafe } from '@/lib/api';
import { getSettings } from '@/lib/settings';
import { getAreas, getCategories } from '@/lib/catalog';
import { TAGS } from '@/lib/tags';
import type { Tour, Destination, Testimonial, Faq, BlogPost } from '@/types';

/*
 * Section headings from the original homepage, keyed by category slug. The
 * menu uses the shorter category names ("International", "Safaris").
 */
const SECTION_TITLES: Record<string, string> = {
  'kenyan-packages': 'Kenyan Packages',
  international: 'International Destinations',
  safaris: 'Safari Packages',
};

/* International sits on the charcoal block, as it did on the original. */
const DARK_SECTIONS = new Set(['international']);

/* This line's section shows the Kenyan travel areas as portrait cards ("Where we go")
   rather than listing its own category's tours. */
const AREAS_SECTION = 'kenyan-packages';
const KENYAN_AREAS = 'kenyan';

export default async function HomePage() {
  const [settings, categories, areas, destinations, testimonials, faqs, posts] = await Promise.all([
    getSettings(),
    getCategories(),
    getAreas(),
    apiListSafe<Destination>('/api/destinations?featured=true&limit=5', { tags: [TAGS.destinations, TAGS.home] }),
    apiListSafe<Testimonial>('/api/testimonials?limit=8', { tags: [TAGS.testimonials, TAGS.home] }),
    apiListSafe<Faq>('/api/faqs?limit=6', { tags: [TAGS.faqs, TAGS.home] }),
    apiListSafe<BlogPost>('/api/blog?limit=3', { tags: [TAGS.blog, TAGS.home] }),
  ]);

  // One request per product line, in the order the menu shows them.
  const lines = await Promise.all(
    categories.map((group) =>
      apiListSafe<Tour>(`/api/tours?category=${group.slug}&limit=12`, { tags: [TAGS.tours, TAGS.home] }).then(
        ({ items }) => ({ group, tours: items })
      )
    )
  );
  const kenyanAreas = areas.find((region) => region.slug === KENYAN_AREAS);

  return (
    <>
      <Hero hero={settings.hero} slides={settings.heroSlides} socials={settings.socials} />
      <CredentialsStrip />

      {/* Why Holidaybank follows the first product line, so the reasons to book
          come before the second and third sets of cards rather than after all of them. */}
      {lines.map(({ group, tours }, i) => (
        <Fragment key={group.slug}>
          {/* Without the Kenyan areas (or with the API down) the section
              falls back to its plain category listing. */}
          {group.slug === AREAS_SECTION && kenyanAreas?.children?.length ? (
            <KenyanAreasGrid id={group.slug} region={kenyanAreas} group={group} title={SECTION_TITLES[group.slug]} />
          ) : (
            <CategorySection
              id={group.slug}
              group={group}
              tours={tours}
              title={SECTION_TITLES[group.slug]}
              tone={DARK_SECTIONS.has(group.slug) ? 'dark' : 'light'}
            />
          )}
          {i === 0 ? <WhyUs values={settings.values} about={settings.about} phone={settings.contact.phone} /> : null}
        </Fragment>
      ))}
      {lines.length === 0 ? (
        <WhyUs values={settings.values} about={settings.about} phone={settings.contact.phone} />
      ) : null}
      <VideoSection youtubeId={settings.video?.youtubeId} />
      <CountriesGrid
        destinations={destinations.items}
        eyebrow={settings.home.destinationsEyebrow}
        title={settings.home.destinationsTitle}
      />
      <PromoBand promo={settings.promo} />

      {testimonials.items.length > 0 ? (
        // The darkest overlay keeps the photograph behind the white cards
        // rather than competing with them.
        <ParallaxSection image={settings.home.testimonialsImage} overlay="darker" className="py-16 md:py-24">
          <div className="container-page">
            <SectionHeading eyebrow="Traveller stories" title="What travellers say" tone="light" />
            <TestimonialCarousel testimonials={testimonials.items} />
          </div>
        </ParallaxSection>
      ) : null}

      <FaqBlock faqs={faqs.items} />

      {posts.items.length > 0 ? (
        <section className="bg-white py-16 md:py-24">
          <div className="container-page">
            <SectionHeading
              eyebrow="Travel journal"
              title="Planning guides and seasonal notes"
              action={
                <ButtonLink href="/blog" variant="outline">
                  View all posts →
                </ButtonLink>
              }
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {posts.items.map((post, i) => (
                <Reveal key={post._id} delay={i * 90}>
                  <BlogCard post={post} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ParallaxSection image={settings.home.ctaImage} overlay="darker" className="py-16 md:py-28">
        <div className="container-page text-center">
          <h2 className="mx-auto max-w-2xl text-3xl text-white md:text-4xl">{settings.home.ctaTitle}</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-balance text-cream-50">{settings.home.ctaBody}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/contact" size="lg">
              Plan my trip
            </ButtonLink>
            <ButtonLink href="/tours" variant="outline-light" size="lg">
              Browse all packages
            </ButtonLink>
          </div>
        </div>
      </ParallaxSection>
    </>
  );
}
