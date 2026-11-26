# Koin — Receipt Scan & Expense Review Flow

> **Engineering Challenge Submission: Mobile Software Engineer Intern**  
> Built with **React Native (Expo SDK 58)**, **TypeScript**, **Zustand**, and **Expo Router**.  
> Repository: [github.com/ManushkaSL/koin-receipt-expense-app](https://github.com/ManushkaSL/koin-receipt-expense-app)

---

## 1. Project Overview

Koin turns messy physical receipts and invoices into structured, editable expense entries. This application closely follows the provided Figma designs, with careful attention to spacing, typography hierarchies, brand colors, and consistent layouts across iOS and Android:

- **Warm Theme & Palette**:
  - Background: Warm off-white/cream (`#F4F1EA`)
  - Elevated Cards: Pure white (`#FFFFFF`) with subtle warm borders (`#EAE6DF`)
  - Primary Typography: Deep navy (`#0F172A`)
  - Secondary Typography: Muted slate (`#64748B`)
  - Brand Accents: Vibrant emerald green (`#10B981` / `#00B37E`) with soft pastel category icon badges.
- **Screen 1 (Expenses & Upload)**:
  - Header with `KOIN` eyebrow, bold `Expenses` title, and emerald `+ Scan Bill` pill button.
  - Dashed-border upload card with receipt icon badge, descriptive copy, and side-by-side `Camera` & `Gallery` actions.
  - Custom spring-animated Action Sheet for camera capture and photo library upload.
  - Recent Activity section (`This week`) displaying transaction rows with category icon badges, timestamps, and right-aligned tabular dollar amounts.
  - Fixed 4-tab bottom navigation bar (`Home`, `Expenses` active in emerald green, `Insights`, `Profile`) featuring tactile haptics and floating "Coming Soon" toast banners for non-scoped tabs.
  - Long-press to delete any transaction row directly from Recent Activity.
- **Screen 2 (Review Extracted Receipt)**:
  - Top navigation bar with back arrow, screen title, and tappable thumbnail preview of the scanned receipt (with interactive zoom modal).
  - Editable summary card for **Merchant Name** (with pencil icon), **Date** (with calendar icon), and **Category** dropdown pill.
  - Extracted Items section with real-time editable item names, `$ [price]` input boxes with `tabular-nums`, item deletion (trash icon with haptic feedback), and `+ Add Item` button.
  - Dynamic live recalculation of total amount using integer cents arithmetic with a spring pulse animation on the total badge.
  - Sticky bottom summary bar with bold Total Amount, item count badge (`✓ 3 items`), and full-width `✓ Confirm & Save Expense` primary button.

---

## 2. Screenshots & Demo

- **Video Walkthrough**: `[Add your Loom, Google Drive, or YouTube unlisted link here]`
- **Interactive Flow Summary**:
  1. *Expenses Dashboard*: View Recent Activity transactions and initiate scan.
  2. *Receipt Capture*: Snap photo via device Camera or pick from Photo Library.
  3. *Laser Scanner*: Animated laser beam overlay with step-by-step progress feedback.
  4. *Review & Edit*: Modify merchant name, transaction date, category, and line item prices.
  5. *Live Recalculation*: Immediate total update on every keystroke or item addition/deletion.
  6. *Confirm & Persist*: Saved to AsyncStorage and instantly prepended to Recent Activity.

---

## 3. Key Features

- **Dual Multimodal Vision AI Support**: Live multimodal vision extraction supporting both **Google Gemini Vision** (`gemini-flash-latest`, `gemini-3.1-flash-lite`) and **OpenAI GPT-4o-mini Vision**.
- **Smart Non-Receipt Detection**: Analyzes image content for financial document structure. If a user uploads a non-receipt image (pet, vehicle, selfie, nature), the scanner cleanly halts and alerts: *"No Receipt Detected"*.
- **OCR Fallback & Manual Entry**: Cloud OCR table parsing fallback for multi-column invoices and international receipts. When offline or unreadable, the app guides the user to a manual entry workflow with their receipt anchored in the preview thumbnail.
- **Live Integer Cents Arithmetic**: Avoids JavaScript floating-point errors by calculating all dynamic sums in integer cents (`Math.round(price * 100)`).
- **Comprehensive Input Validation**: Sanitizes negative numbers and symbols in real time, blocks empty merchant names, prevents zero/empty totals, and prunes ghost rows.
- **Mobile UX Polish**: Wrapped in `KeyboardAvoidingView` with `keyboardShouldPersistTaps="handled"`, tabular numerals (`fontVariant: ['tabular-nums']`), native tactile haptic feedback (`expo-haptics`), and offline persistence (`@react-native-async-storage/async-storage`).

---

## 4. Technical Architecture

### Integer Cents Financial Calculation Pipeline
Standard JavaScript floating-point operations introduce subtle rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). In Koin, all financial arithmetic is handled via integer cents:
- User price inputs are converted to integer cents: `cents = Math.round(price * 100)`.
- Summation is performed purely on integers: `totalCents = items.reduce((sum, it) => sum + Math.round(it.price * 100), 0)`.
- Converted back to decimal format strictly at presentation time: `(totalCents / 100).toFixed(2)`.

### Multimodal Vision & OCR Fallback Flow
```
User selects Image (Camera / Gallery)
        │
        ▼
Payload Compression (quality: 0.6, ~300KB)
        │
        ▼
Is API Key Present in .env?
   ├── YES ──► Gemini Flash / OpenAI GPT-4o-mini
   │              │
   │              ├── Is Receipt? NO  ──► Alert: "No Receipt Detected"
   │              └── Is Receipt? YES ──► Extract line items & prices
   │
   └── NO (or API Failure) ──► OCR.space Table Parser
                                 │
                                 ├── OCR Success ──► Parse line items
                                 └── OCR Fail / Offline ──► "Enter Manually" Workflow
```

### State Management & Persistence
- **State Layer**: Zustand store (`useExpenseStore`) managing expenses list, active review draft, scanner progress, and recalculation triggers.
- **Storage Layer**: Asynchronous local storage via `@react-native-async-storage/async-storage` under key `@koin_expenses_v2`. Automatically seeds default Figma mock items on first launch and updates dynamically on expense confirmation or deletion.

---

## 5. Tech Stack

- **Framework**: [Expo SDK 58](https://expo.dev/) (React Native 0.88.1, React 19.3.0)
- **Routing**: [Expo Router v58](https://docs.expo.dev/router/introduction/) (File-based navigation in `src/app/`)
- **Language**: TypeScript (Strict mode enabled, 0 type errors)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Local Persistence**: `@react-native-async-storage/async-storage`
- **Icons**: `lucide-react-native`
- **Native Modules**: `expo-image-picker`, `expo-haptics`, `react-native-safe-area-context`

---

## 6. Project Structure

```
src/
├── app/
│   ├── _layout.tsx               # Root navigation stack & safe area providers
│   ├── index.tsx                 # Screen 1: Expenses dashboard & scan trigger
│   └── review.tsx                # Screen 2: Review extracted receipt & edit items
├── components/
│   ├── DashedBorderCard.tsx      # Dashed upload card matching Figma layout
│   ├── ExpenseRow.tsx            # Transaction item row with long-press delete
│   ├── BottomTabBar.tsx          # 4-tab bar with "Coming Soon" toast feedback
│   ├── ScanActionSheet.tsx       # Spring-animated Camera/Gallery action sheet
│   ├── ExtractedItemRow.tsx      # Editable line item row with tabular price box
│   ├── CategoryPickerModal.tsx   # Category dropdown selector modal
│   ├── ReceiptPreviewModal.tsx   # Scanned receipt image zoom viewer modal
│   ├── ScanningModal.tsx         # Animated laser scanning progress overlay
│   └── WebCameraModal.tsx        # Viewfinder for browser webcam testing
├── services/
│   ├── receiptExtractor.ts       # Multimodal Vision AI + Smart Non-Receipt Detection
│   └── storage.ts                # AsyncStorage persistence layer & seed data
├── store/
│   └── useExpenseStore.ts        # Zustand store with integer cents arithmetic
├── theme/
│   └── colors.ts                 # Design tokens per Figma specifications
├── types/
│   └── expense.ts                # TypeScript interfaces and expense categories
└── utils/
    ├── categories.ts             # Category metadata, icons, and pastel colors
    ├── currency.ts               # Precision arithmetic and currency formatters
    └── receiptParser.ts          # Multi-column table parser for international receipts
```

---

## 7. Installation & Setup

### Prerequisites
- **Node.js**: `22.13 or newer` (required by Expo SDK 58)
- **Package Manager**: `npm`, `bun`, or `yarn`

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ManushkaSL/koin-receipt-expense-app.git
cd koin-receipt-expense-app
npm install
```

### 2. Environment Variables (Optional)
If you wish to test live multimodal extraction with an API key:
```bash
cp .env.example .env
# Set EXPO_PUBLIC_GEMINI_API_KEY=your_key or EXPO_PUBLIC_OPENAI_API_KEY=your_key in .env
```
*(If omitted, the app provides cloud OCR fallback and a seamless manual entry workflow).*

### 3. Run the Development Server
```bash
npx expo start
```
- **Physical Device (Expo Go)**: Scan the QR code with the Expo Go app (Android) or Camera app (iOS).
- **iOS Simulator**: Press `i` in the terminal.
- **Android Emulator**: Press `a` in the terminal.
- **Web Browser**: Press `w` in the terminal to test in Chrome/Safari.

---

## 8. Verification & Diagnostics

```bash
# Typecheck (0 errors)
npx tsc --noEmit

# Expo Diagnostics (All SDK checks pass)
npx expo-doctor
```

---

## 9. AI Tooling Disclosure

In accordance with the assignment guidelines, AI tools were leveraged as active force multipliers throughout the development process:

1. **Design-to-Code Translation**: Inspected Figma mockups (`Koin · Expenses.png` and `Koin · Review receipt.png`) to extract exact hex color tokens (`#F4F1EA`, `#0F172A`, `#10B981`, `#64748B`), typography scales, border radiuses, and padding constraints.
2. **Financial Math Architecture**: Enforced strict integer cents arithmetic across all dynamic operations, safeguarding against floating-point rounding errors.
3. **Edge Case Hardening**: Designed multi-stage fallbacks, payload compression, negative input sanitization, and non-receipt image detection to guarantee a production-grade experience.
