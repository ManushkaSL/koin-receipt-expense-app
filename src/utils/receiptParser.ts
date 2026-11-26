import { ExpenseCategory } from '../types/expense';
import { calculateTotal } from './currency';

export interface ParsedReceiptResult {
  merchant: string;
  date: string;
  category: ExpenseCategory;
  items: Array<{ id: string; name: string; price: number }>;
  total: number;
}

/**
 * Parses raw text extracted from real receipt images via OCR into structured data.
 */
export function parseRawReceiptText(rawText: string): ParsedReceiptResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let merchant = '';
  let date = '';
  let items: Array<{ id: string; name: string; price: number }> = [];
  let explicitTotal: number | null = null;

  // 1. Detect Date
  const dateRegexes = [
    /\b([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\b/, // e.g. Nov 24, 2026 or November 24 2026
    /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/, // e.g. 24/11/2026 or 11-24-2026
    /\b(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b/, // e.g. 2026-11-24
  ];

  for (const line of lines) {
    for (const regex of dateRegexes) {
      const match = line.match(regex);
      if (match && !date) {
        date = match[1];
        break;
      }
    }
    if (date) break;
  }

  if (!date) {
    date = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // 2. Detect Merchant (First prominent non-meta line)
  const metaKeywords = [
    'receipt',
    'tax invoice',
    'invoice',
    'welcome',
    'tel',
    'phone',
    'cashier',
    'order #',
    'date',
    'time',
    'table',
    'gst',
    'vat',
    'http',
    'www',
  ];

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const lineLower = lines[i].toLowerCase();
    const isMeta = metaKeywords.some((kw) => lineLower.includes(kw));
    // If it's not a meta line and contains letters
    if (!isMeta && /[a-zA-Z]{3,}/.test(lines[i])) {
      merchant = cleanMerchantName(lines[i]);
      break;
    }
  }

  if (!merchant && lines.length > 0) {
    merchant = cleanMerchantName(lines[0]);
  }
  if (!merchant) {
    merchant = 'Scanned Merchant';
  }

  // 3. Detect Line Items & Total
  // Matches line like: "Avocado Toast 14.00" or "Avocado Toast $14.00" or "2x Latte 9.00"
  const priceRegex = /[$€£¥]?\s*(\d{1,4}\.\d{2})\b/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    // Check for Total lines
    if (
      lineLower.includes('total') ||
      lineLower.includes('amount due') ||
      lineLower.includes('balance') ||
      lineLower.includes('grand total')
    ) {
      const match = line.match(priceRegex);
      if (match) {
        const parsedPrice = parseFloat(match[1]);
        if (!isNaN(parsedPrice) && parsedPrice > 0) {
          explicitTotal = parsedPrice;
        }
      }
      continue;
    }

    // Skip subtotal, tax, cash, change lines
    if (
      lineLower.includes('subtotal') ||
      lineLower.includes('sub-total') ||
      lineLower.includes('tax') ||
      lineLower.includes('cash') ||
      lineLower.includes('change') ||
      lineLower.includes('card') ||
      lineLower.includes('visa') ||
      lineLower.includes('mastercard')
    ) {
      continue;
    }

    // Try to extract item name and price
    const match = line.match(priceRegex);
    if (match && match.index !== undefined) {
      const priceStr = match[1];
      const price = parseFloat(priceStr);
      const namePart = line.substring(0, match.index).trim();
      const cleanName = cleanItemName(namePart);

      if (cleanName.length >= 2 && !isNaN(price) && price > 0) {
        items.push({
          id: `item_${Date.now()}_${items.length}`,
          name: cleanName,
          price,
        });
      }
    }
  }

  // If no items were detected from lines, try to find any prices and make generic items
  if (items.length === 0) {
    const allPrices = rawText.match(/[$]?\s*(\d{1,3}\.\d{2})\b/g) || [];
    const validPrices = allPrices
      .map((p) => parseFloat(p.replace(/[^0-9.]/g, '')))
      .filter((p) => !isNaN(p) && p > 0);

    if (validPrices.length > 0) {
      // Pick up to top 3 prices
      validPrices.slice(0, 3).forEach((price, idx) => {
        items.push({
          id: `item_${Date.now()}_${idx}`,
          name: `Item #${idx + 1}`,
          price,
        });
      });
    } else {
      // Fallback placeholder item
      items.push({
        id: `item_${Date.now()}_0`,
        name: 'Scanned Purchase',
        price: explicitTotal && explicitTotal > 0 ? explicitTotal : 15.00,
      });
    }
  }

  // Determine final total
  const calculatedTotal = calculateTotal(items);
  const total = explicitTotal && explicitTotal >= calculatedTotal ? explicitTotal : calculatedTotal;

  // Infer Category
  const category = inferCategory(merchant, items);

  return {
    merchant,
    date,
    category,
    items,
    total,
  };
}

function cleanMerchantName(str: string): string {
  return str
    .replace(/^[^a-zA-Z0-9]+/, '')
    .replace(/[^a-zA-Z0-9\s&'-]/g, '')
    .trim()
    .substring(0, 30);
}

function cleanItemName(str: string): string {
  return str
    .replace(/^[0-9xX*•\-\s]+/, '')
    .replace(/[^a-zA-Z0-9\s&'/()-]/g, '')
    .trim();
}

function inferCategory(
  merchant: string,
  items: Array<{ name: string }>
): ExpenseCategory {
  const combined = `${merchant} ${items.map((i) => i.name).join(' ')}`.toLowerCase();

  if (
    combined.includes('cafe') ||
    combined.includes('coffee') ||
    combined.includes('restaurant') ||
    combined.includes('bakery') ||
    combined.includes('pizza') ||
    combined.includes('burger') ||
    combined.includes('toast') ||
    combined.includes('pancake') ||
    combined.includes('diner') ||
    combined.includes('food')
  ) {
    return 'Food & Dining';
  }

  if (
    combined.includes('super') ||
    combined.includes('market') ||
    combined.includes('grocery') ||
    combined.includes('mart') ||
    combined.includes('keells') ||
    combined.includes('walmart') ||
    combined.includes('whole foods')
  ) {
    return 'Groceries';
  }

  if (
    combined.includes('uber') ||
    combined.includes('lyft') ||
    combined.includes('taxi') ||
    combined.includes('cab') ||
    combined.includes('gas') ||
    combined.includes('fuel') ||
    combined.includes('petrol') ||
    combined.includes('transport')
  ) {
    return 'Transportation';
  }

  if (
    combined.includes('store') ||
    combined.includes('shop') ||
    combined.includes('apparel') ||
    combined.includes('clothing') ||
    combined.includes('mall')
  ) {
    return 'Shopping';
  }

  if (
    combined.includes('electric') ||
    combined.includes('water') ||
    combined.includes('telecom') ||
    combined.includes('power')
  ) {
    return 'Utilities';
  }

  if (
    combined.includes('cinema') ||
    combined.includes('theater') ||
    combined.includes('ticket') ||
    combined.includes('movie')
  ) {
    return 'Entertainment';
  }

  if (
    combined.includes('pharmacy') ||
    combined.includes('health') ||
    combined.includes('clinic') ||
    combined.includes('dental')
  ) {
    return 'Health';
  }

  return 'Food & Dining';
}
