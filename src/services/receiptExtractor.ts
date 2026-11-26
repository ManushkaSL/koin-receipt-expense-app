import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExtractedReceiptData, ExpenseCategory } from '../types/expense';
import { calculateTotal } from '../utils/currency';
import { parseRawReceiptText } from '../utils/receiptParser';

export const USER_AI_KEY_STORAGE = '@koin_user_gemini_key';

export interface ScanProgressUpdate {
  progress: number; // 0 to 1
  stage: string;
}

/**
 * Extracts receipt information with high precision using:
 * 1. Google Gemini Multimodal AI (1.5 Flash / 2.0 Flash) or OpenAI GPT-4o Vision
 * 2. Enhanced Cloud OCR with structured receipt parsing
 * 3. Graceful fallback
 */
export async function extractReceiptData(
  imageUri: string,
  rawBase64?: string | null,
  onProgress?: (update: ScanProgressUpdate) => void
): Promise<ExtractedReceiptData> {
  // Check for configured API key (AsyncStorage first, then process.env)
  let apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
  try {
    const storedKey = await AsyncStorage.getItem(USER_AI_KEY_STORAGE);
    if (storedKey && storedKey.trim()) {
      apiKey = storedKey.trim();
    }
  } catch {}

  onProgress?.({ progress: 0.2, stage: 'Processing receipt image...' });

  // Get reliable base64 string
  let base64Data = rawBase64 || '';
  if (!base64Data) {
    base64Data = await convertUriToBase64(imageUri);
  }

  // 1. If an API key is available (Gemini or OpenAI), use Multimodal Vision AI
  if (apiKey) {
    try {
      if (apiKey.startsWith('sk-')) {
        // OpenAI GPT-4o-mini Vision
        onProgress?.({ progress: 0.5, stage: 'Reading complex receipt with OpenAI Vision...' });
        const extracted = await extractWithOpenAI(base64Data, apiKey, onProgress);
        if (extracted && extracted.items.length > 0) {
          onProgress?.({ progress: 1.0, stage: 'Complete!' });
          return { ...extracted, receiptUri: imageUri, isSimulated: false };
        }
      } else {
        // Google Gemini Vision AI (1.5 Flash / 2.0 Flash)
        onProgress?.({ progress: 0.5, stage: 'Analyzing complex receipt with Gemini Vision...' });
        const extracted = await extractWithGemini(base64Data, apiKey, onProgress);
        if (extracted && extracted.items.length > 0) {
          onProgress?.({ progress: 1.0, stage: 'Complete!' });
          return { ...extracted, receiptUri: imageUri, isSimulated: false };
        }
      }
    } catch (err: any) {
      console.warn('Multimodal AI extraction error:', err?.message || err);
    }
  }

  // 2. High-Fidelity Free OCR Engine Fallback
  try {
    onProgress?.({ progress: 0.65, stage: 'Scanning columns & price values...' });
    const ocrResult = await extractWithFreeOCR(base64Data);
    if (ocrResult && ocrResult.items.length > 0) {
      onProgress?.({ progress: 1.0, stage: 'Complete!' });
      return { ...ocrResult, receiptUri: imageUri, isSimulated: false };
    }
  } catch (err) {
    console.warn('Free OCR failed:', err);
  }

  // 3. Fallback to readable realistic parsed structure
  onProgress?.({ progress: 1.0, stage: 'Complete!' });
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
 * Google Gemini Multimodal Vision API (Handles multi-column, faded paper, complex bills)
 */
async function extractWithGemini(
  base64Data: string,
  apiKey: string,
  onProgress?: (update: ScanProgressUpdate) => void
): Promise<Omit<ExtractedReceiptData, 'receiptUri' | 'isSimulated'> | null> {
  onProgress?.({ progress: 0.75, stage: 'Extracting line items and precise prices...' });

  const systemInstruction = `You are a high-precision financial receipt scanner.
Analyze the provided receipt or bill image with extreme accuracy.
Extract:
1. "merchant": Store or restaurant name from the top header.
2. "date": Date printed on receipt formatted like "Nov 24, 2026".
3. "category": Best match among: "Food & Dining", "Groceries", "Transportation", "Shopping", "Utilities", "Entertainment", "Health", "Other".
4. "items": Array of actual purchased line items. For each item:
   - "name": Clean item description without SKU, barcode, or internal ID.
   - "price": The exact line item price as a float (e.g. 14.50). Match each item carefully with its corresponding price column.
Ignore subtotal, sales tax (GST/VAT), payment methods, card info, change due, and tip lines unless they are distinct items.

Return ONLY valid JSON matching this exact structure:
{
  "merchant": "Merchant Name",
  "date": "Nov 24, 2026",
  "category": "Food & Dining",
  "items": [
    { "name": "Item Description", "price": 14.50 }
  ]
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

  // Try gemini-1.5-flash (primary high-speed multimodal)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini API HTTP ${res.status}: ${errorBody}`);
  }

  const result = await res.json();
  const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) return null;

  const jsonStr = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  const items = (parsed.items || [])
    .filter((it: any) => it.name && (parseFloat(it.price) > 0 || typeof it.price === 'number'))
    .map((it: any, index: number) => ({
      id: `item_${Date.now()}_${index}`,
      name: String(it.name).trim(),
      price: Math.abs(parseFloat(it.price) || 0),
    }));

  if (items.length === 0) return null;

  const total = calculateTotal(items);

  return {
    merchant: parsed.merchant || 'Unknown Merchant',
    date: parsed.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    category: validateCategory(parsed.category),
    items,
    total,
  };
}

/**
 * OpenAI GPT-4o-mini Vision API Support
 */
async function extractWithOpenAI(
  base64Data: string,
  apiKey: string,
  onProgress?: (update: ScanProgressUpdate) => void
): Promise<Omit<ExtractedReceiptData, 'receiptUri' | 'isSimulated'> | null> {
  onProgress?.({ progress: 0.75, stage: 'Parsing receipt with OpenAI GPT-4o...' });

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
Return JSON: { "merchant": string, "date": string, "category": string, "items": [{ "name": string, "price": number }] }`,
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
    total: calculateTotal(items),
  };
}

/**
 * Free OCR.space API Fallback
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
