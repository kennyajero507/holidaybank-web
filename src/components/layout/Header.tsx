'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { telHref, secondaryNumber } from '@/lib/format';
import type { ApiImage } from '@/types';

export interface NavItem {
  href: string;
  label: string;
  /** Query fragment that marks this item active on /tours, e.g. "category=safaris". */
  match?: string;
  /** Dropdown links; a thumbnail, when set, is decorative beside the label. */
  items?: Array<{ href: string; label: string; image?: { url: string } }>;
}

/**
 * The floating pill bar from the original site: dark and translucent over the
 * hero, solid once the page scrolls. Public navigation only; /admin is
 * deliberately absent and must stay that way.
 */
export function Header({
  nav,
  phone,
  whatsapp,
  logo,
}: {
  nav: NavItem[];
  phone: string;
  whatsapp?: string;
  logo: ApiImage;
}) {
  const secondNumber = secondaryNumber(phone, whatsapp);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const pathname = usePathname();
  // Read through QuerySync so static pages need no Suspense around the whole bar.
  const [query, setQuery] = useState('');
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenu(null);
  }, [pathname, query]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const isActive = (item: NavItem) => {
    if (item.href === '/') return pathname === '/';
    if (item.match) return pathname === '/tours' && query.includes(item.match);
    const base = item.href.split('?')[0];
    return pathname.startsWith(base) && !nav.some((n) => n.match && query.includes(n.match));
  };

  const solid = scrolled || open;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
      <Suspense fallback={null}>
        <QuerySync onChange={setQuery} />
      </Suspense>
      <div
        className={`mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 rounded-full border border-white/10 pl-4 pr-2.5 transition-all duration-500 ease-soft md:h-[4.2rem] md:pl-6 md:pr-3 ${
          solid
            ? 'bg-charcoal-950/95 shadow-[0_12px_36px_-14px_rgba(0,0,0,0.6)] backdrop-blur-xl'
            : // Over a bright photograph a near-clear bar leaves white text
              // unreadable, so the resting state keeps the original's dark tint.
              'bg-charcoal-950/55 backdrop-blur-md'
        }`}
      >
        <Link href="/" className="flex shrink-0 items-center" aria-label="Holidaybank Expeditions, home">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG logo, no raster optimisation needed */}
          <img src={logo.url} alt={logo.alt} width={130} height={48} className="h-9 w-auto md:h-11" />
        </Link>

        <nav ref={navRef} className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
          {nav.map((item, index) => {
            const active = isActive(item);
            // Labels and links are admin-arranged, so neither is guaranteed unique.
            const key = `${index}-${item.label}`;
            const pill = `rounded-full px-3.5 py-2.5 text-[0.86rem] transition-colors ${
              active ? 'bg-cream-100 font-medium text-charcoal-950' : 'text-cream-100/90 hover:text-white'
            }`;

            if (!item.items) {
              return (
                <Link key={key} href={item.href} aria-current={active ? 'page' : undefined} className={pill}>
                  {item.label}
                </Link>
              );
            }

            const isOpen = menu === key;
            return (
              <div
                key={key}
                className="relative"
                onMouseEnter={() => setMenu(key)}
                onMouseLeave={() => setMenu(null)}
              >
                <button
                  type="button"
                  onClick={() => setMenu(isOpen ? null : key)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  className={`flex items-center gap-1.5 ${pill}`}
                >
                  {item.label}
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    aria-hidden
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                <div hidden={!isOpen} className="absolute left-0 top-full min-w-56 pt-2.5">
                  <ul className="overflow-hidden rounded-[10px] bg-white p-2 shadow-[0_16px_34px_rgba(0,0,0,0.22)]">
                    {item.items.map((sub, i) => (
                      <li key={`${i}-${sub.href}`}>
                        {i === 1 ? <div aria-hidden className="my-1 border-t border-cream-200" /> : null}
                        <Link
                          href={sub.href}
                          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.86rem] transition-colors hover:bg-cream-100 hover:text-leaf-700 ${
                            i === 0 ? 'font-medium text-charcoal-900' : 'text-ink'
                          }`}
                        >
                          {sub.image ? (
                            <Image
                              src={sub.image.url}
                              alt=""
                              width={40}
                              height={40}
                              className="h-10 w-10 shrink-0 rounded-md object-cover"
                            />
                          ) : null}
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          {/* The number is written out where there is room; an unlabelled phone icon alone did not say what it dials. */}
          <a
            href={`tel:${telHref(phone)}`}
            aria-label={`Call us on ${phone}`}
            title={secondNumber ? `${phone} or ${secondNumber}` : phone}
            className="flex h-10 w-10 items-center justify-center gap-2 rounded-full bg-cream-100 text-charcoal-950 transition-all duration-300 hover:bg-gold-500 md:h-11 md:w-11 2xl:w-auto 2xl:px-4"
          >
            <PhoneIcon />
            <span className="hidden text-[0.86rem] font-medium 2xl:inline">{phone}</span>
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 md:h-11 md:w-11 xl:hidden"
          >
            <span className="relative block h-4 w-5">
              <span className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${open ? 'top-2 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 top-2 block h-0.5 w-5 bg-current transition-opacity duration-300 ${open ? 'opacity-0' : 'opacity-100'}`} />
              <span className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${open ? 'top-2 -rotate-45' : 'top-4'}`} />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="mx-auto mt-2 max-h-[calc(100svh-6rem)] w-full max-w-7xl overflow-y-auto rounded-3xl bg-charcoal-900 xl:hidden"
      >
        <nav className="flex flex-col px-6 py-3" aria-label="Mobile">
          {nav.map((item, index) => (
            <div key={`${index}-${item.label}`} className="border-b border-white/5 last:border-0">
              <Link href={item.href} className="block py-3.5 text-sm text-cream-100 hover:text-gold-400">
                {item.label}
              </Link>
              {item.items && item.items.length > 1 ? (
                <ul className="-mt-1 mb-3 flex flex-wrap gap-2">
                  {item.items.slice(1).map((sub, i) => (
                    <li key={`${i}-${sub.href}`}>
                      <Link
                        href={sub.href}
                        className="block rounded-full bg-white/10 px-3 py-1 text-xs text-cream-200 hover:bg-gold-500 hover:text-charcoal-950"
                      >
                        {sub.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          <a href={`tel:${telHref(phone)}`} className="mt-3 inline-flex items-center gap-2 pb-2 text-sm text-gold-400">
            <PhoneIcon />
            {phone}
          </a>
          {secondNumber ? (
            <a href={`tel:${telHref(secondNumber)}`} className="inline-flex items-center gap-2 pb-2 text-sm text-gold-400">
              <PhoneIcon />
              {secondNumber}
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

/** Reports the current query string, for highlighting the active product line. */
function QuerySync({ onChange }: { onChange: (query: string) => void }) {
  const params = useSearchParams();
  useEffect(() => onChange(params.toString()), [params, onChange]);
  return null;
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" />
    </svg>
  );
}
