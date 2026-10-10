import { apiGet } from './api';
import { TAGS } from './tags';
import type { ApiImage, SiteSettings } from '@/types';

const img = (file: string, alt: string): ApiImage => ({ url: `/images/${file}`, alt });

/**
 * Used only when the API is unreachable, so the shell still renders with the
 * company's own details rather than an error page. Mirrors the defaults in
 * apps/content/defaults.py; the API is the source of truth.
 */
const FALLBACK: SiteSettings = {
  brand: {
    name: 'Holidaybank Expeditions',
    tagline: 'Travel in Style',
    logo: { url: '/brand/logo.svg', alt: 'Holidaybank Expeditions: Travel in Style' },
    logoCompact: { url: '/brand/logo-compact.svg', alt: 'Holidaybank Expeditions' },
    logoOnLight: { url: '/brand/logo-on-light.svg', alt: 'Holidaybank Expeditions: Travel in Style' },
    mark: { url: '/brand/logo-mark.svg', alt: 'Holidaybank Expeditions' },
  },
  hero: {
    eyebrow: 'Feel The Experience',
    title: "Discover East Africa's Wild Beauty",
    subtitle:
      'Kenyan getaways, safari adventures across East Africa, and handpicked international escapes — planned by people who know the road, the reserve, and the runway.',
    backgroundImage: img('naivasha-hippos-pelicans.jpg', 'Hippos and pelicans on Lake Naivasha'),
    primaryCta: { label: 'Explore Safaris', href: '/tours?category=safaris' },
    secondaryCta: { label: 'View Kenyan Packages', href: '/tours?category=kenyan-packages' },
  },
  heroSlides: [
    img('naivasha-hippos-pelicans.jpg', 'Hippos and pelicans on Lake Naivasha'),
    img('diani-beach-palms.jpg', 'Palm trees and white sand at Diani Beach'),
    img('mara-leopard-branch.jpg', 'A leopard resting along a branch in the Maasai Mara'),
    img('santorini-oia-lane.jpg', 'A flower-lined lane in Oia, Santorini'),
  ],
  values: [],
  contact: {
    phone: '+254 700 000 000',
    whatsapp: '+254 700010013',
    email: 'hello@holidaybankexpeditions.com',
    addressLine: '',
    city: 'Nairobi, Kenya',
    supportHours: 'Tell us your dates and budget and we will come back with options',
  },
  socials: {},
  video: {},
  newsletter: {
    heading: 'Travel notes',
    blurb: 'Occasional updates on new packages, safari seasons and European departures.',
  },
  footerBlurb:
    'Holidaybank Expeditions plans Kenyan getaways, East African safaris, and international travel for people who want it done properly.',
  seo: {
    defaultTitle: 'Holidaybank Expeditions',
    defaultDescription:
      'Kenyan getaways, safari adventures across East Africa, and handpicked international escapes, planned from Nairobi.',
  },
  promo: {
    eyebrow: 'Safaris',
    title: 'Follow the herds across the border.',
    body: 'Mara River crossings from July to October, the Serengeti across the border, and gorilla treks in Uganda and Rwanda. Tell us your month and we will match the route to the herds.',
    cta: { label: 'See safari packages', href: '/tours?category=safaris' },
    image: img('mara-wildebeest-migration.jpg', 'Wildebeest climbing out of a riverbed in the Maasai Mara'),
  },
  about: {
    title: 'About Holidaybank Expeditions',
    intro: 'Travel in Style',
    heading: 'Kenyan getaways, East African safaris and international travel',
    paragraphs: [
      'Holidaybank Expeditions plans Kenyan getaways, East African safaris, and international travel for people who want it done properly.',
    ],
    images: [],
    pillars: [],
  },
  home: {
    packagesEyebrow: 'Hand-picked',
    packagesTitle: 'Popular packages',
    destinationsEyebrow: 'Where we go',
    destinationsTitle: 'From the Mara to the Mediterranean',
    testimonialsImage: img('mara-cheetah.jpg', 'A cheetah looking back over its shoulder in the Maasai Mara'),
    ctaTitle: 'Tell us where you want to go',
    ctaBody: 'Share your dates, who is travelling and a rough budget, and we will put the options together.',
    ctaImage: img('zanzibar-boats-sunset.jpg', 'Boats moored off a palm-lined Zanzibar shore at sunset'),
  },
  pages: {
    tours: { title: 'Packages & Safaris', subtitle: '', image: img('mara-leopard-branch.jpg', 'A leopard on a branch') },
    destinations: { title: 'Where we travel', subtitle: '', image: img('amboseli-elephant-kilimanjaro.jpg', 'An elephant with Kilimanjaro behind') },
    services: { title: 'What we do', subtitle: '', image: img('ol-pejeta-rhinos-game-drive.jpg', 'Rhinos beside a safari vehicle') },
    about: { title: 'About Holidaybank Expeditions', subtitle: 'Travel in Style', image: img('nairobi-giraffe-skyline.jpg', 'A giraffe with the Nairobi skyline behind') },
    contact: { title: 'Plan your trip', subtitle: '', image: img('kenya-coast-sunset.jpg', 'Sunset on the Kenyan coast') },
    blog: { title: 'Travel Journal', subtitle: '', image: img('santorini-oia-lane.jpg', 'A lane in Oia, Santorini') },
    credits: { title: 'Photo credits', subtitle: '', image: img('swiss-alps-red-train.jpg', 'A red train in the Swiss Alps') },
  },
  // While the API is down we cannot know whether the admin has switched the
  // pricing notice off, so the cautious choice is to show it.
  notice: { enabled: true, text: 'Prices are per person and subject to availability at the time of booking.' },
  navigation: [],
  // Mirrors the API default; the phone above is the fallback number.
  whatsappWidget: {
    enabled: true,
    number: '',
    greeting: 'Hi there 👋 Tell us where you would like to go and we will reply on WhatsApp.',
    quickReplies: ['Inquire about a Safari package', 'Custom itinerary quote', 'Kenyan beach holiday', 'Visa and flights for Europe'],
  },
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const live = await apiGet<Partial<SiteSettings>>('/api/settings', { tags: [TAGS.settings] });
    // Sections an older API does not send fall back rather than crash the page.
    return { ...FALLBACK, ...live, pages: { ...FALLBACK.pages, ...(live.pages ?? {}) } } as SiteSettings;
  } catch (err) {
    console.error('[settings] falling back to defaults:', (err as Error).message);
    return FALLBACK;
  }
}
