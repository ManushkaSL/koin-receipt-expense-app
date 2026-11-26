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
      if (err?.message === 'NOT_A_RECEIPT') {
        throw err;
      }
      console.warn('Multimodal extraction error, trying cloud OCR:', err?.message || err);
    }
  }

  // 2. High-Precision Cloud OCR Engine Fallback
  try {
    onProgress?.({ progress: 0.75, stage: 'Scanning invoice tables and price columns...' });
    const ocrResult = await extractWithFreeOCR(base64Data);
    if (ocrResult.data && ocrResult.data.items.length > 0) {
      onProgress?.({ progress: 1.0, stage: 'Extraction complete!' });
      return { ...ocrResult.data, receiptUri: imageUri, isSimulated: false };
    }
    if (ocrResult.isBlank) {
      throw new Error('NOT_A_RECEIPT');
    }
  } catch (err: any) {
    if (err?.message === 'NOT_A_RECEIPT') {
      throw err;
    }
    console.warn('OCR fallback failed:', err);
  }

  // 3. When live API and OCR cannot parse or device is offline:
  // Never return fake mock items silently. Throw error so user can enter manually.
  throw new Error('EXTRACTION_FAILED');
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
Analyze this image carefully.
First, determine if this image contains a receipt, bill, invoice, or financial transaction document.
If the image is NOT a receipt or bill (for example: a selfie, a person, a pet/animal, landscape, car, random object, meme, or non-financial photo), you MUST return:
{
  "is_receipt": false
}

If the image IS a receipt or bill, return:
{
  "is_receipt": true,
  "merchant": "Store/company name",
  "date": "Date printed on receipt (e.g. Nov 26, 2026)",
  "category": "One of: Food & Dining, Groceries, Transportation, Shopping, Utilities, Entertainment, Health, Other",
  "items": [
    { "name": "Item description", "price": 8500 }
  ],
  "total": 27000
}
Ignore subtotal, taxes (GST/VAT), delivery fees, change, tip, and payment method lines.
Return ONLY raw JSON.`;

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

  const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Model ${model} returned HTTP ${res.status}: ${await res.text()}`);
        continue;
      }

      const result = await res.json();
      const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) continue;

      const jsonStr = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      if (parsed.is_receipt === false) {
        throw new Error('NOT_A_RECEIPT');
      }

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
    } catch (e: any) {
      if (e?.message === 'NOT_A_RECEIPT') {
        throw e;
      }
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
          content: `You are an expert receipt OCR system.
First determine if the image is a receipt, invoice, or bill.
If it is NOT a receipt or bill (e.g. person, pet, car, landscape, object, meme), return:
{ "is_receipt": false }
Otherwise return:
{ "is_receipt": true, "merchant": string, "date": string, "category": string, "items": [{ "name": string, "price": number }], "total": number }`,
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

  if (parsed.is_receipt === false) {
    throw new Error('NOT_A_RECEIPT');
  }

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
): Promise<{ data: Omit<ExtractedReceiptData, 'receiptUri' | 'isSimulated'> | null; isBlank?: boolean }> {
  try {
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

    if (!res.ok) return { data: null };

    const json = await res.json();
    const parsedText = json?.ParsedResults?.[0]?.ParsedText;

    if (!parsedText || parsedText.trim().length === 0) {
      return { data: null, isBlank: true };
    }

    const trimmed = parsedText.trim();
    const hasDigits = /\d/.test(trimmed);
    if (trimmed.length < 5 || !hasDigits) {
      return { data: null, isBlank: true };
    }

    const parsed = parseRawReceiptText(trimmed);
    return {
      data: {
        merchant: parsed.merchant,
        date: parsed.date,
        category: parsed.category,
        items: parsed.items,
        total: parsed.total,
      },
      isBlank: false,
    };
  } catch {
    return { data: null };
  }
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
