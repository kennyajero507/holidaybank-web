'use client';

import { useEffect, useState } from 'react';
import { adminApi } from './adminApi';
import type { Category, CountryInfo, Destination, TravelArea } from '@/types';

/**
 * The lookup lists the package and destination forms need: the category tree,
 * the countries, the travel areas, and every destination (drafts included).
 */
export function useCatalogOptions() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [areas, setAreas] = useState<TravelArea[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  useEffect(() => {
    let live = true;
    Promise.all([
      adminApi.get<Category[]>('/api/categories').catch(() => []),
      adminApi.get<CountryInfo[]>('/api/countries').catch(() => []),
      adminApi.get<TravelArea[]>('/api/areas').catch(() => []),
      adminApi
        .list<Destination>('/api/admin/destinations?limit=100')
        .then(({ items }) => items)
        .catch(() => []),
    ]).then(([c, k, a, d]) => {
      if (!live) return;
      setCategories(c);
      setCountries(k);
      setAreas(a);
      setDestinations(d);
    });
    return () => {
      live = false;
    };
  }, []);

  return { categories, countries, areas, destinations };
}
