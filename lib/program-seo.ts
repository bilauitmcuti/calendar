import { getProgramDisplayName } from '@/lib/route-utils'

const siteBase = 'https://bilauitmcuti.com'

/** Distinct meta descriptions for main program grid routes (sitelink snippets). */
const PROGRAM_DESCRIPTION_BY_SLUG: Partial<Record<string, string>> = {
  'foundation-professional':
    'Kalendar akademik UiTM 2027 untuk pelajar Foundation dan Professional. Semak tarikh pendaftaran, minggu orientasi, jadual kuliah, peperiksaan, dan cuti semester.',
  diploma:
    'Kalendar akademik UiTM 2027 untuk Diploma penuh masa. Jadual pendaftaran, kuliah, peperiksaan akhir semester, dan tempoh cuti mengikut sesi akademik.',
  bachelor:
    'Kalendar akademik UiTM 2027 untuk Sarjana Muda (Bachelor). Tarikh pendaftaran, minggu aktiviti kampus, kuliah, peperiksaan, dan cuti antara semester.',
  master:
    'Kalendar akademik UiTM 2027 untuk Sarjana (Master). Ikuti tarikh pendaftaran, sesi kuliah, peperiksaan, dan cuti untuk pelajar siswazah.',
  phd:
    'Kalendar akademik UiTM 2027 untuk Doktor Falsafah (PhD). Rujuk pendaftaran, jadual akademik, penilaian, dan cuti mengikut kalendar UiTM.',
  'pre-diploma':
    'Kalendar akademik UiTM 2027 untuk Pra-Diploma. Lihat tarikh pendaftaran, kuliah, peperiksaan, dan cuti semester.',
  'diploma-part-time':
    'Kalendar akademik UiTM 2027 untuk Diploma Separuh Masa. Jadual sesi, peperiksaan, dan cuti untuk program separuh masa.',
  'bachelor-part-time':
    'Kalendar akademik UiTM 2027 untuk Sarjana Muda Separuh Masa. Tarikh penting pendaftaran, kuliah, peperiksaan, dan cuti.',
}

export function getProgramSeoDescription(programSlug: string): string {
  const custom = PROGRAM_DESCRIPTION_BY_SLUG[programSlug]
  if (custom) return custom
  const name = getProgramDisplayName(programSlug)
  return `Kalendar akademik UiTM 2027 untuk ${name}. Lihat tarikh pendaftaran, jadual kuliah, tempoh peperiksaan, dan cuti.`
}

/** List-view meta description (differs from grid program routes). */
export function getProgramListSeoDescription(programSlug: string): string {
  const name = getProgramDisplayName(programSlug)
  return `Senarai kalendar akademik UiTM 2027 ${name}. Jadual tarikh pendaftaran, kuliah, peperiksaan, dan cuti semester dalam paparan senarai.`
}

export function getProgramPageTitle(programSlug: string): string {
  return `${getProgramDisplayName(programSlug)} - Kalendar Akademik`
}

export function getProgramListPageTitle(programSlug: string): string {
  return `${getProgramDisplayName(programSlug)} - Senarai Kalendar Akademik`
}

export function getProgramCanonicalUrl(programSlug: string): string {
  return `${siteBase}/${programSlug}`
}

export function getProgramListCanonicalUrl(programSlug: string): string {
  return `${siteBase}/${programSlug}/list`
}
