import { translations, type Locale } from './translations';

/** Pairs for services stored in Bulgarian (or other DB-entered names). */
const SERVICE_CATALOG: { bg: string; en: string }[] = [
  { bg: 'Мъжко подстригване', en: "Men's Haircut" },
  { bg: 'Оформяне на брада', en: 'Beard Trim & Shape' },
  { bg: 'Подстригване + оформяне на брада', en: 'Haircut + Beard Trim' },
  { bg: 'Класически бръснене + гореща кърпа', en: 'Classic Shave + Hot Towel' },
  { bg: 'Боядисване на брада', en: 'Beard Dye' },
  { bg: 'Бръснене на глава', en: 'Head Shave' },
  { bg: 'Почистване на уши', en: 'Ear Cleaning' },
  { bg: 'Премахване на косми от носа', en: 'Nose Hair Removal' },
  { bg: 'Почистване на носа', en: 'Nose Grooming' },
  { bg: 'Оформяне на вежди', en: 'Eyebrow Grooming' },
];

/** Shop names, hero text, addresses, bios entered in the admin panel. */
const CONTENT_CATALOG: { bg: string; en: string }[] = [
  { bg: 'Клуб Мъжки Свят', en: "Men's World Club" },
  { bg: 'Клуб мъжки свят', en: "Men's World Club" },
  {
    bg: 'Бръснарница Клуб мъжки свят - заповядайте при нас!',
    en: "Men's World Club barbershop — welcome!",
  },
  {
    bg: 'Бръснарница Клуб мъжки свят – заповядайте при нас!',
    en: "Men's World Club barbershop — welcome!",
  },
  {
    bg: 'Бръснарница Клуб мъжки свят — заповядайте при нас!',
    en: "Men's World Club barbershop — welcome!",
  },
  { bg: 'Йосиф Младенов', en: 'Yosif Mladenov' },
  { bg: "Ловеч, ул '22-ри август'", en: 'Lovech, 22 August St.' },
  { bg: 'Ловеч, ул. "22-ри август"', en: 'Lovech, 22 August St.' },
  { bg: 'Ловеч, ул. 22-ри август', en: 'Lovech, 22 August St.' },
  { bg: 'Ловеч', en: 'Lovech' },
  {
    bg: 'Йосиф Младенов е нашият топ бръснар с над 5 години опит.',
    en: 'Yosif Mladenov is our top barber with over 5 years of experience.',
  },
  {
    bg: 'Йосиф Младенов е нашият топ бръснар с над 5 години опит в класически и модерни мъжки прически.',
    en: 'Yosif Mladenov is our top barber with over 5 years of experience in classic and modern men\'s cuts.',
  },
  {
    bg: 'Йосиф Тачев е нашият топ бръснар с над 5 години опит.',
    en: 'Yosif Tachev is our top barber with over 5 years of experience.',
  },
  {
    bg: 'Йосиф Тачев е нашият топ бръснар с над 5 години опит в класически и модерни мъжки прически.',
    en: 'Yosif Tachev is our top barber with over 5 years of experience in classic and modern men\'s cuts.',
  },
];

function normalizeText(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u2013\u2014−–—]/g, '-')
    .replace(/[""''']/g, '"')
    .toLowerCase();
}

function buildPairLookup(pairs: { bg: string; en: string }[]) {
  const bgToEn = new Map<string, string>();
  const enToBg = new Map<string, string>();

  for (const { bg, en } of pairs) {
    bgToEn.set(normalizeText(bg), en);
    enToBg.set(normalizeText(en), bg);
  }

  return { bgToEn, enToBg };
}

function buildLegacyServicePairs(): { bg: string; en: string }[] {
  const enMap = translations.en.serviceNames;
  const bgMap = translations.bg.serviceNames;
  const pairs: { bg: string; en: string }[] = [];

  for (const [englishKey, englishLabel] of Object.entries(enMap)) {
    const bgLabel = bgMap[englishKey as keyof typeof bgMap];
    if (typeof bgLabel === 'string' && typeof englishLabel === 'string') {
      pairs.push({ bg: bgLabel, en: englishLabel });
      pairs.push({ bg: englishKey, en: englishLabel });
    }
  }

  return pairs;
}

const serviceLookup = buildPairLookup([...SERVICE_CATALOG, ...buildLegacyServicePairs()]);
const contentLookup = buildPairLookup(CONTENT_CATALOG);

function translateWithLookup(
  text: string,
  locale: Locale,
  lookup: ReturnType<typeof buildPairLookup>
): string {
  const normalized = normalizeText(text);
  if (locale === 'en') {
    return lookup.bgToEn.get(normalized) ?? lookup.enToBg.get(normalized) ?? text;
  }
  if (lookup.bgToEn.has(normalized)) {
    return text;
  }
  return lookup.enToBg.get(normalized) ?? text;
}

export function translateServiceName(name: string, locale: Locale): string {
  return translateWithLookup(name, locale, serviceLookup);
}

/** Translate free-text shop fields (name, hero, address, bio) when a mapping exists. */
export function translateDbContent(text: string | undefined | null, locale: Locale): string | undefined {
  if (!text?.trim()) return undefined;

  const exact = translateWithLookup(text, locale, contentLookup);
  if (locale === 'bg') {
    return exact;
  }
  if (exact !== text) {
    return exact;
  }

  const normalizedInput = normalizeText(text);
  let best: { bg: string; en: string } | null = null;

  for (const entry of CONTENT_CATALOG) {
    const normalizedBg = normalizeText(entry.bg);
    if (normalizedInput.includes(normalizedBg)) {
      if (!best || entry.bg.length > best.bg.length) {
        best = entry;
      }
    }
  }

  if (best) {
    if (text.includes(best.bg)) {
      return text.replace(best.bg, best.en);
    }
    if (normalizedInput === normalizeText(best.bg)) {
      return best.en;
    }
  }

  if (/[\u0400-\u04FF]/.test(text) && /бръснарница|заповядайте/i.test(text)) {
    return "Men's World Club barbershop — welcome!";
  }

  return text;
}
