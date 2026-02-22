/**
 * Auto Internal Link System
 * 
 * Scans blog/page content and automatically links keywords to relevant pages.
 * This boosts internal linking density — a key ranking factor.
 * 
 * Usage: import { autoLinkText } from '../../utils/autoLinker';
 *        const enhanced = autoLinkText(rawText);
 */

/**
 * Keyword → internal page mapping.
 * Order matters: longer/more specific phrases should come first.
 */
const LINK_MAP = [
  // Brand + City combos (most specific first)
  { keywords: ['kyocera copier tirunelveli', 'kyocera dealer tirunelveli', 'kyocera tirunelveli'], url: '/kyocera-copier-tirunelveli', label: 'Kyocera Copier Tirunelveli' },
  { keywords: ['canon printer tirunelveli', 'canon dealer tirunelveli', 'canon tirunelveli'], url: '/canon-printer-tirunelveli', label: 'Canon Printer Tirunelveli' },
  { keywords: ['ricoh copier tirunelveli', 'ricoh dealer tirunelveli', 'ricoh tirunelveli'], url: '/ricoh-copier-tirunelveli', label: 'Ricoh Copier Tirunelveli' },
  { keywords: ['printer rental tirunelveli', 'copier rental tirunelveli', 'rent copier tirunelveli'], url: '/printer-rental-tirunelveli', label: 'Printer Rental Tirunelveli' },
  { keywords: ['copier amc tirunelveli', 'amc tirunelveli', 'maintenance contract tirunelveli'], url: '/copier-amc-tirunelveli', label: 'Copier AMC Tirunelveli' },
  { keywords: ['copier repair tirunelveli', 'printer repair tirunelveli', 'photocopier repair tirunelveli'], url: '/photocopier-repair-tirunelveli', label: 'Copier Repair Tirunelveli' },
  
  // City location pages
  { keywords: ['copier service tirunelveli', 'printer service tirunelveli', 'copier tirunelveli'], url: '/copier-service-tirunelveli', label: 'Copier Service Tirunelveli' },
  { keywords: ['copier tenkasi', 'printer tenkasi', 'service tenkasi'], url: '/printer-service-tenkasi', label: 'Printer Service Tenkasi' },
  { keywords: ['copier nagercoil', 'printer nagercoil', 'dealer nagercoil'], url: '/copier-dealer-nagercoil', label: 'Copier Dealer Nagercoil' },
  { keywords: ['copier thoothukudi', 'printer thoothukudi', 'xerox thoothukudi'], url: '/xerox-machine-thoothukudi', label: 'Xerox Machine Thoothukudi' },

  // Brand pages
  { keywords: ['kyocera ecosys', 'kyocera taskalfa', 'kyocera copier', 'kyocera printer'], url: '/kyocera-copier-tirunelveli', label: 'Kyocera Copiers' },
  { keywords: ['canon imagerunner', 'canon imageclass', 'canon pixma', 'canon copier', 'canon printer'], url: '/canon-printer-tirunelveli', label: 'Canon Printers' },
  { keywords: ['ricoh im', 'ricoh mp', 'ricoh copier'], url: '/ricoh-copier-tirunelveli', label: 'Ricoh Copiers' },

  // Service pages
  { keywords: ['printer rental', 'copier rental', 'rent a copier', 'rent copier'], url: '/printer-rental-tirunelveli', label: 'Copier Rental' },
  { keywords: ['annual maintenance', 'amc plan', 'amc contract', 'maintenance contract'], url: '/copier-amc-tirunelveli', label: 'AMC Plans' },
  { keywords: ['copier repair', 'printer repair', 'photocopier repair'], url: '/photocopier-repair-tirunelveli', label: 'Repair Service' },

  // Main pages
  { keywords: ['our products', 'browse products', 'product catalog', 'view products'], url: '/products', label: 'Our Products' },
  { keywords: ['book service', 'service request', 'book repair'], url: '/services', label: 'Book Service' },
  { keywords: ['contact us', 'get in touch'], url: '/contact', label: 'Contact Us' },

  // Long-tail micro-intent pages
  { keywords: ['printer for school', 'school printer', 'college printer', 'school copier'], url: '/office-printer-for-school-tirunelveli', label: 'School Printer Guide' },
  { keywords: ['a3 copier', 'a3 printer', 'a3 machine', 'large format copier'], url: '/a3-copier-machine-tirunelveli', label: 'A3 Copier Guide' },
  { keywords: ['color copier rental', 'color photocopier rental', 'colour copier rent'], url: '/color-photocopier-rental-tirunelveli', label: 'Color Copier Rental' },
  { keywords: ['printer repair near me', 'copier repair near me', 'repair near me'], url: '/printer-repair-near-me-tirunelveli', label: 'Printer Repair Near Me' },

  // Case study pages
  { keywords: ['school installation', 'copier installation school'], url: '/kyocera-installation-school-tirunelveli', label: 'School Installation Case Study' },
  { keywords: ['hospital printer', 'hospital copier', 'clinic printer'], url: '/printer-rental-for-hospital-tirunelveli', label: 'Hospital Printer Case Study' },

  // Blog articles
  { keywords: ['photocopier for small office', 'best copier small office', 'office copier guide'], url: '/blog/best-photocopier-machine-for-small-office-tirunelveli', label: 'Best Copier Guide' },
  { keywords: ['kyocera vs canon', 'canon vs kyocera', 'printer comparison'], url: '/blog/kyocera-vs-canon-printer-comparison-2026', label: 'Kyocera vs Canon' },
  { keywords: ['rental vs buying', 'rent or buy', 'renting vs buying'], url: '/blog/printer-rental-vs-buying-which-is-better', label: 'Rental vs Buying Guide' },
  { keywords: ['reduce printing cost', 'save printing cost', 'lower printing cost'], url: '/blog/how-to-reduce-printing-cost-office', label: 'Reduce Costs' },
];

/**
 * Given raw text (from blog content), returns text with keywords replaced 
 * as markdown links. Only links each keyword once (first occurrence).
 * 
 * @param {string} text - Raw content string
 * @param {string} currentPath - Current page path (to avoid self-links)
 * @param {number} maxLinks - Maximum links to insert (default 5)
 * @returns {string} Text with markdown links inserted
 */
export function autoLinkMarkdown(text, currentPath = '', maxLinks = 5) {
  let result = text;
  let linksInserted = 0;
  const usedUrls = new Set();

  for (const entry of LINK_MAP) {
    if (linksInserted >= maxLinks) break;
    if (entry.url === currentPath) continue;
    if (usedUrls.has(entry.url)) continue;

    for (const kw of entry.keywords) {
      // Case-insensitive search, only link first occurrence, not already inside a markdown link
      const regex = new RegExp(`(?<!\\[)(?<!\\]\\()\\b(${escapeRegex(kw)})\\b(?![^\\[]*\\])`, 'i');
      const match = result.match(regex);
      if (match) {
        result = result.replace(regex, `[${match[1]}](${entry.url})`);
        usedUrls.add(entry.url);
        linksInserted++;
        break;
      }
    }
  }

  return result;
}

/**
 * React-friendly version: returns array of React elements with Link components.
 * Use this for inline text that needs React Router Links.
 * 
 * @param {string} text
 * @param {string} currentPath
 * @returns {{ text: string, linkedKeywords: Array<{keyword: string, url: string}> }}
 */
export function findAutoLinks(text, currentPath = '') {
  const results = [];
  const usedUrls = new Set();
  const lowerText = text.toLowerCase();

  for (const entry of LINK_MAP) {
    if (entry.url === currentPath) continue;
    if (usedUrls.has(entry.url)) continue;

    for (const kw of entry.keywords) {
      const idx = lowerText.indexOf(kw);
      if (idx !== -1) {
        results.push({ keyword: text.slice(idx, idx + kw.length), url: entry.url, label: entry.label });
        usedUrls.add(entry.url);
        break;
      }
    }
  }

  return results;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default LINK_MAP;
