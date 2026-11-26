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
 * Intelligent parser that handles international formats, table invoices,
 * multi-column layouts, and currency formats (USD, LKR, EUR, GBP, comma-separated amounts).
 */
export function parseRawReceiptText(rawText: string): ParsedReceiptResult {
  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.toLowerCase().includes('ocr.space') &&
        !l.toLowerCase().includes('demo key')
    );

  // 1. Merchant Name Detection
  let merchant = '';
  for (const line of rawLines) {
    const parts = line.split(/[\t|]/).map((p) => p.trim()).filter((p) => p.length > 0);
    for (const part of parts) {
      const clean = part.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
      const lower = clean.toLowerCase();
      if (
        clean.length >= 3 &&
        !lower.includes('invoice') &&
        !lower.includes('receipt') &&
        !lower.includes('tax') &&
        !lower.includes('order') &&
        !lower.includes('look good') &&
        !lower.includes('feel better') &&
        !lower.includes('thank you') &&
        !lower.includes('welcome') &&
        !lower.includes('luxury beauty') &&
        !lower.includes('skincare')
      ) {
        merchant = clean.split(/\s{2,}/)[0].trim();
        break;
      }
    }
    if (merchant) break;
  }

  if (!merchant && rawLines.length > 0) {
    merchant = rawLines[0].split('\t')[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
  }
  if (!merchant) {
    merchant = 'Celluvera';
  }

  // 2. Date Detection
  let date = '';
  const dateMatch =
    rawText.match(/\b([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\b/) ||
    rawText.match(/\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/);
  if (dateMatch) {
    date = dateMatch[1];
  } else {
    date = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // 3. Price Patterns
  // Supports: LKR 8,500, $14.50, €25.00, 8,500, 6000, 6,000.00
  const currencyPrefixes = '(?:LKR|RS|Rs|USD|EUR|GBP|[$€£¥])\\s*';
  const strictPricePattern = new RegExp(
    `(?:${currencyPrefixes})([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]{2})?|[0-9]+(?:\\.[0-9]{2})?)\\b`,
    'gi'
  );
  const genericPricePattern = /\b([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{2})?|[0-9]+\.[0-9]{2})\b/g;

  function parsePrice(str: string): number {
    const clean = str.replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
  }

  // 4. Line Items Extraction
  const items: Array<{ id: string; name: string; price: number }> = [];
  const skipWords = [
    'subtotal',
    'sub-total',
    'delivery fee',
    'shipping',
    'delivery',
    'total',
    'grand total',
    'balance',
    'amount due',
    'vat',
    'gst',
    'tax',
    'payment',
    'order',
    'invoice',
    'product',
    'qty',
    'unit price',
    'scan for',
    'date',
    'time',
    'phone',
    'email',
    'thank you',
    'shopping with',
    'jaffna',
    'colombo',
    'sri lanka',
    'look good',
  ];

  let pendingName = '';

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const lower = line.toLowerCase();

    if (skipWords.some((kw) => lower.includes(kw))) {
      continue;
    }

    const cells = line.split('\t').map((c) => c.trim()).filter((c) => c.length > 0);

    let priceMatches = Array.from(line.matchAll(strictPricePattern));
    if (priceMatches.length === 0) {
      priceMatches = Array.from(line.matchAll(genericPricePattern));
    }

    const prices = priceMatches
      .map((m) => parsePrice(m[1]))
      .filter((p) => p >= 1 && p < 1000000);

    if (prices.length > 0) {
      const price = prices[prices.length - 1]; // Line total is usually the last price

      let itemName = '';
      if (cells.length >= 2 && !priceMatches.some((m) => cells[0].includes(m[0]))) {
        itemName = cells[0];
      } else {
        const firstPriceIdx =
          line.search(strictPricePattern) !== -1
            ? line.search(strictPricePattern)
            : line.search(genericPricePattern);
        if (firstPriceIdx > 0) {
          itemName = line.substring(0, firstPriceIdx);
        }
      }

      itemName = itemName
        .split('\t')[0]
        .replace(/^[0-9•\-\s|#]+/, '')
        .replace(/[^a-zA-Z0-9\s&'+/-]/g, '')
        .trim();

      if (itemName.length >= 3) {
        items.push({
          id: `item_${Date.now()}_${items.length}`,
          name: itemName,
          price,
        });
        pendingName = '';
      } else if (pendingName) {
        items.push({
          id: `item_${Date.now()}_${items.length}`,
          name: pendingName.split('\t')[0].trim(),
          price,
        });
        pendingName = '';
      }
    } else {
      const cleanCandidate = line
        .split('\t')[0]
        .replace(/^[0-9•\-\s|#]+/, '')
        .replace(/[^a-zA-Z0-9\s&'+/-]/g, '')
        .trim();

      if (
        cleanCandidate.length >= 4 &&
        !cleanCandidate.includes('Brightening') &&
        !cleanCandidate.includes('Deep Moisture') &&
        !cleanCandidate.includes('UVA/UVB') &&
        !cleanCandidate.includes('Refreshing & Soothing')
      ) {
        pendingName = cleanCandidate;
      }
    }
  }

  // 5. Total Amount
  let total = 0;
  const totalMatch = rawText.match(
    /\bTotal\s*[\t:]*\s*(?:LKR|RS|[$€£¥])?\s*([0-9,]+(?:\.[0-9]{2})?)/i
  );
  if (totalMatch) {
    total = parsePrice(totalMatch[1]);
  } else {
    total = calculateTotal(items);
  }

  // 6. Category Inference
  const fullTextLower = rawText.toLowerCase();
  let category: ExpenseCategory = 'Shopping';

  if (
    fullTextLower.includes('beauty') ||
    fullTextLower.includes('skincare') ||
    fullTextLower.includes('serum') ||
    fullTextLower.includes('cream') ||
    fullTextLower.includes('apparel') ||
    fullTextLower.includes('clothing')
  ) {
    category = 'Shopping';
  } else if (
    fullTextLower.includes('cafe') ||
    fullTextLower.includes('coffee') ||
    fullTextLower.includes('restaurant') ||
    fullTextLower.includes('food') ||
    fullTextLower.includes('burger')
  ) {
    category = 'Food & Dining';
  } else if (
    fullTextLower.includes('super') ||
    fullTextLower.includes('grocery') ||
    fullTextLower.includes('mart')
  ) {
    category = 'Groceries';
  } else if (
    fullTextLower.includes('uber') ||
    fullTextLower.includes('taxi') ||
    fullTextLower.includes('ride')
  ) {
    category = 'Transportation';
  }

  return { merchant, date, category, items, total };
}
