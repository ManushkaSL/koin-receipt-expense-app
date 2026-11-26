import { ExtractedReceiptData, ExpenseCategory } from '../types/expense';
import { calculateTotal } from '../utils/currency';

export interface ScanProgressUpdate {
  progress: number; // 0 to 1
  stage: string;
}

// Preset realistic receipts for instant offline / no-API testing
const SAMPLE_PRESETS: Array<Omit<ExtractedReceiptData, 'receiptUri' | 'isSimulated'>> = [
  {
    merchant: 'Cafe Kumbuk',
    date: 'Nov 24, 2026',
    category: 'Food & Dining',
    items: [
      { id: 'item_1', name: 'Avocado toast', price: 14.00 },
      { id: 'item_2', name: 'Cappuccino', price: 6.50 },
      { id: 'item_3', name: 'Banana pancakes', price: 8.00 },
    ],
    total: 28.50,
  },
  {
    merchant: 'Keells Super',
    date: 'Nov 25, 2026',
    category: 'Groceries',
    items: [
      { id: 'item_1', name: 'Fresh Full Cream Milk', price: 3.80 },
      { id: 'item_2', name: 'Organic Honey', price: 12.40 },
      { id: 'item_3', name: 'Extra Virgin Olive Oil', price: 18.50 },
      { id: 'item_4', name: 'Green Apples 1kg', price: 6.50 },
      { id: 'item_5', name: 'Greek Natural Yogurt', price: 5.00 },
      { id: 'item_6', name: 'Kitchen Paper Towels', price: 18.00 },
    ],
    total: 64.20,
  },
  {
    merchant: 'The Good Market',
    date: 'Nov 21, 2026',
    category: 'Shopping',
    items: [
      { id: 'item_1', name: 'Handcrafted Soy Candle', price: 15.00 },
      { id: 'item_2', name: 'Artisan Passion Fruit Jam', price: 12.00 },
      { id: 'item_3', name: 'Organic Lemongrass Tea', price: 8.00 },
    ],
    total: 35.00,
  },
  {
    merchant: 'Uber',
    date: 'Nov 22, 2026',
    category: 'Transportation',
    items: [
      { id: 'item_1', name: 'Trip Fare (Colombo 07 to 03)', price: 10.80 },
      { id: 'item_2', name: 'Airport Access / Service Fee', price: 2.00 },
    ],
    total: 12.80,
  },
];

let presetIndex = 0;

/**
 * Extracts receipt information using either Gemini Vision API or fallback simulation.
 */
export async function extractReceiptData(
  imageUri: string,
  onProgress?: (update: ScanProgressUpdate) => void
): Promise<ExtractedReceiptData> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  onProgress?.({ progress: 0.15, stage: 'Uploading receipt image...' });
  await delay(400);

  onProgress?.({ progress: 0.4, stage: 'Analyzing image with AI vision...' });
  await delay(500);

  // If API key is available, attempt real live extraction
  if (apiKey) {
    try {
      const extracted = await extractWithGemini(imageUri, apiKey, onProgress);
      if (extracted) {
        return {
          ...extracted,
          receiptUri: imageUri,
          isSimulated: false,
        };
      }
    } catch (err) {
      console.warn('Live Gemini extraction failed, falling back to simulated preset:', err);
    }
  }

  // Fallback: Realistic simulated extraction with preset data
  onProgress?.({ progress: 0.75, stage: 'Detecting merchant, line items & total...' });
  await delay(600);

  onProgress?.({ progress: 1.0, stage: 'Extraction complete!' });
  await delay(300);

  const selectedPreset = SAMPLE_PRESETS[presetIndex % SAMPLE_PRESETS.length];
  presetIndex++;

  // Ensure calculated total has integer precision
  const items = selectedPreset.items.map((it, idx) => ({
    ...it,
    id: `extracted_${Date.now()}_${idx}`,
  }));

  const preciseTotal = calculateTotal(items);

  return {
    merchant: selectedPreset.merchant,
    date: selectedPreset.date,
    category: selectedPreset.category,
    items,
    total: preciseTotal,
    receiptUri: imageUri,
    isSimulated: true,
  };
}

/**
 * Live Multimodal extraction via Google Gemini Vision REST API
 */
async function extractWithGemini(
  imageUri: string,
  apiKey: string,
  onProgress?: (update: ScanProgressUpdate) => void
): Promise<Omit<ExtractedReceiptData, 'receiptUri' | 'isSimulated'> | null> {
  onProgress?.({ progress: 0.6, stage: 'Reading OCR data with Gemini Vision...' });

  // Read image as base64
  let base64Data = '';
  if (imageUri.startsWith('data:image')) {
    base64Data = imageUri.split(',')[1];
  } else {
    // In React Native / Expo, fetch uri as blob or use FileSystem
    const response = await fetch(imageUri);
    const blob = await response.blob();
    base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        resolve(res.includes(',') ? res.split(',')[1] : res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const prompt = `Analyze this receipt image and extract structured expense details.
Return ONLY valid JSON in this exact structure without markdown or backticks:
{
  "merchant": "Store or Restaurant Name",
  "date": "Nov 24, 2026",
  "category": "Food & Dining" | "Groceries" | "Transportation" | "Shopping" | "Utilities" | "Entertainment" | "Health" | "Other",
  "items": [
    { "name": "Item Description", "price": 14.00 }
  ]
}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json',
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    throw new Error(`Gemini API HTTP ${res.status}: ${await res.text()}`);
  }

  const result = await res.json();
  const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) return null;

  // Clean output and parse JSON
  const jsonStr = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  const items = (parsed.items || []).map((it: any, index: number) => ({
    id: `item_${Date.now()}_${index}`,
    name: String(it.name || 'Item'),
    price: parseFloat(it.price) || 0,
  }));

  const total = calculateTotal(items);

  return {
    merchant: parsed.merchant || 'Unknown Merchant',
    date: parsed.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    category: validateCategory(parsed.category),
    items,
    total,
  };
}

function validateCategory(cat: string): ExpenseCategory {
  const valid: ExpenseCategory[] = [
    'Food & Dining',
    'Groceries',
    'Transportation',
    'Shopping',
    'Utilities',
    'Entertainment',
    'Health',
    'Other',
  ];
  if (valid.includes(cat as ExpenseCategory)) {
    return cat as ExpenseCategory;
  }
  return 'Food & Dining';
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
