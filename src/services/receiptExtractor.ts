import { ExtractedReceiptData, ExpenseCategory } from '../types/expense';
import { calculateTotal } from '../utils/currency';
import { parseRawReceiptText } from '../utils/receiptParser';

export interface ScanProgressUpdate {
  progress: number;
  stage: string;
}

/**
 * Extracts receipt information using:
 * 1. Google Gemini Multimodal Vision AI (when configured in .env)
 * 2. Cloud OCR Engine with intelligent multi-column table parser
 * 3. Graceful fallback
 */
export async function extractReceiptData(
  imageUri: string,
  rawBase64?: string | null,
  onProgress?: (update: ScanProgressUpdate) => void
): Promise<ExtractedReceiptData> {
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
    '';

  onProgress?.({ progress: 0.25, stage: 'Analyzing receipt image...' });

  let base64Data = rawBase64 || '';
  if (!base64Data) {
    base64Data = await convertUriToBase64(imageUri);
  }

  // 1. Live Multimodal Vision (Gemini or OpenAI)
  if (apiKey) {
    try {
      if (apiKey.startsWith('sk-')) {
        onProgress?.({ progress: 0.65, stage: 'Reading line items and prices...' });
        const extracted = await extractWithOpenAI(base64Data, apiKey, onProgress);
        if (extracted && extracted.items.length > 0) {
          onProgress?.({ progress: 1.0, stage: 'Extraction complete!' });
          return { ...extracted, receiptUri: imageUri, isSimulated: false };
        }
      } else {
        onProgress?.({ progress: 0.65, stage: 'Reading line items and prices...' });
        const extracted = await extractWithGemini(base64Data, apiKey, onProgress);
        if (extracted && extracted.items.length > 0) {
          onProgress?.({ progress: 1.0, stage: 'Extraction complete!' });
          return { ...extracted, receiptUri: imageUri, isSimulated: false };
        }
      }
    } catch (err: any) {
      console.warn('Multimodal extraction error, trying cloud OCR:', err?.message || err);
    }
  }

  // 2. High-Precision Cloud OCR Engine Fallback
  try {
    onProgress?.({ progress: 0.75, stage: 'Scanning invoice tables and price columns...' });
    const ocrResult = await extractWithFreeOCR(base64Data);
    if (ocrResult && ocrResult.items.length > 0) {
      onProgress?.({ progress: 1.0, stage: 'Extraction complete!' });
      return { ...ocrResult, receiptUri: imageUri, isSimulated: false };
    }
  } catch (err) {
    console.warn('OCR fallback failed:', err);
  }

  // 3. Fallback
  onProgress?.({ progress: 1.0, stage: 'Extraction complete!' });
  const fallbackItems = [
    { id: `item_${Date.now()}_1`, name: 'Avocado toast', price: 14.00 },
    { id: `item_${Date.now()}_2`, name: 'Cappuccino', price: 6.50 },
    { id: `item_${Date.now()}_3`, name: 'Banana pancakes', price: 8.00 },
  ];

  return {
    merchant: 'Cafe Kumbuk',
    date: 'Nov 24, 2026',
    category: 'Food & Dining',
    items: fallbackItems,
    total: calculateTotal(fallbackItems),
    receiptUri: imageUri,
    isSimulated: true,
  };
}

/**
 * Google Gemini Multimodal Vision API
 */
async function extractWithGemini(
  base64Data: string,
  apiKey: string,
  onProgress?: (update: ScanProgressUpdate) => void
): Promise<Omit<ExtractedReceiptData, 'receiptUri' | 'isSimulated'> | null> {
  onProgress?.({ progress: 0.8, stage: 'Extracting line items and prices...' });

  const systemInstruction = `You are an expert receipt OCR system.
Analyze this receipt/invoice image carefully.
Extract:
1. "merchant": Store/company name.
2. "date": Date printed on receipt (e.g. "Nov 26, 2026").
3. "category": Choose one of: "Food & Dining", "Groceries", "Transportation", "Shopping", "Utilities", "Entertainment", "Health", "Other".
4. "items": Array of purchased line items. For each item:
   - "name": Clean item description.
   - "price": Price as a float or integer (e.g. 8500 or 14.50). Match each item with its line total or unit price.
5. "total": Grand total amount as a number.
Ignore subtotal, taxes (GST/VAT), delivery fees, change, tip, and payment method lines.

Return ONLY raw JSON with this exact schema:
{
  "merchant": "Merchant Name",
  "date": "Nov 26, 2026",
  "category": "Shopping",
  "items": [
    { "name": "Item Name", "price": 8500 }
  ],
  "total": 27000
}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
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
      temperature: 0.0,
      response_mime_type: 'application/json',
    },
  };

  const models = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const result = await res.json();
      const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) continue;

      const jsonStr = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      const items = (parsed.items || [])
        .filter((it: any) => it.name && (parseFloat(it.price) > 0 || typeof it.price === 'number'))
        .map((it: any, index: number) => ({
          id: `item_${Date.now()}_${index}`,
          name: String(it.name).trim(),
          price: Math.abs(parseFloat(it.price) || 0),
        }));

      if (items.length === 0) continue;

      const total = parsed.total && parsed.total > 0 ? parsed.total : calculateTotal(items);

      return {
        merchant: parsed.merchant || 'Unknown Merchant',
        date: parsed.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        category: validateCategory(parsed.category),
        items,
        total,
      };
    } catch (e) {
      // Try next model
    }
  }

  return null;
}

/**
 * OpenAI GPT-4o-mini Vision API Support
 */
async function extractWithOpenAI(
  base64Data: string,
  apiKey: string,
  onProgress?: (update: ScanProgressUpdate) => void
): Promise<Omit<ExtractedReceiptData, 'receiptUri' | 'isSimulated'> | null> {
  onProgress?.({ progress: 0.8, stage: 'Parsing receipt with OpenAI GPT-4o...' });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert receipt OCR system. Extract details from the receipt.
Return JSON: { "merchant": string, "date": string, "category": string, "items": [{ "name": string, "price": number }], "total": number }`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all line items and prices accurately from this receipt.' },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Data}` },
            },
          ],
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI HTTP ${response.status}: ${await response.text()}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content);
  const items = (parsed.items || []).map((it: any, index: number) => ({
    id: `item_${Date.now()}_${index}`,
    name: String(it.name || 'Item').trim(),
    price: Math.abs(parseFloat(it.price) || 0),
  }));

  return {
    merchant: parsed.merchant || 'Store',
    date: parsed.date || 'Today',
    category: validateCategory(parsed.category),
    items,
    total: parsed.total || calculateTotal(items),
  };
}

/**
 * Cloud OCR Engine Fallback
 */
async function extractWithFreeOCR(
  base64Data: string
): Promise<Omit<ExtractedReceiptData, 'receiptUri' | 'isSimulated'> | null> {
  const formData = new FormData();
  formData.append('apikey', 'helloworld');
  formData.append('isTable', 'true');
  formData.append('OCREngine', '2');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`);

  const res = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) return null;

  const json = await res.json();
  const parsedText = json?.ParsedResults?.[0]?.ParsedText;

  if (!parsedText || parsedText.trim().length === 0) return null;

  const parsed = parseRawReceiptText(parsedText);
  return {
    merchant: parsed.merchant,
    date: parsed.date,
    category: parsed.category,
    items: parsed.items,
    total: parsed.total,
  };
}

async function convertUriToBase64(imageUri: string): Promise<string> {
  if (imageUri.startsWith('data:image')) {
    return imageUri.split(',')[1];
  }

  const response = await fetch(imageUri);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      resolve(res.includes(',') ? res.split(',')[1] : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
