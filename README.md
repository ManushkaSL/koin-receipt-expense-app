# Koin — Receipt Scan & Expense Review Flow

> **Engineering Challenge Submission: Mobile Software Engineer Intern**  
> Built with **React Native (Expo SDK 58)**, **TypeScript**, **Zustand**, and **Expo Router**.  
> Repository: [github.com/ManushkaSL/koin-receipt-expense-app](https://github.com/ManushkaSL/koin-receipt-expense-app)

---

## 📱 Overview & Design-to-Code Precision

Koin turns messy receipts into clean, structured expense entries. This application closely follows the provided Figma designs, with attention to spacing, typography, colors, and consistent layouts across iOS and Android:

- **Warm Theme & Palette**:
  - Background: Warm off-white/cream (`#F4F1EA`)
  - Elevated Cards: Pure white (`#FFFFFF`) with subtle warm borders (`#EAE6DF`)
  - Primary Text: Deep navy (`#0F172A`)
  - Secondary Text: Muted slate (`#64748B`)
  - Brand Accents: Vibrant emerald green (`#10B981` / `#00B37E`) with soft pastel category icon badges.
- **Screen 1 (Expenses & Upload)**:
  - Header with `KOIN` eyebrow, bold `Expenses` title, and emerald `+ Scan Bill` pill button.
  - Dashed-border upload card with receipt icon badge, headings, and side-by-side `Camera` & `Gallery` actions.
  - Custom spring-animated Action Sheet for camera capture and photo library upload.
  - Recent Activity section (`This week`) displaying transaction rows with category icon badges, timestamps, and right-aligned tabular dollar amounts.
  - Fixed 4-tab bottom navigation bar (`Home`, `Expenses` active in emerald green, `Insights`, `Profile`) featuring tactile haptics and floating "Coming Soon" toast banners for non-scoped tabs.
  - Long-press to delete any transaction row directly from Recent Activity.
- **Screen 2 (Review Extracted Receipt)**:
  - Top navigation bar with back arrow, screen title, and tappable thumbnail preview of the scanned receipt (with interactive zoom modal).
  - Editable summary card for **Merchant Name** (with pencil icon), **Date** (with calendar icon), and **Category** dropdown pill.
  - Extracted Items section with real-time editable item names, `$ [price]` input boxes with `tabular-nums`, item deletion (trash icon with haptic feedback), and `+ Add Item` button.
  - Live dynamic recalculation of total amount using integer cents arithmetic (avoiding JavaScript floating-point errors) with a spring pulse animation on the total badge.
  - Sticky bottom summary bar with bold Total Amount, item count badge (`✓ 3 items`), and full-width `✓ Confirm & Save Expense` primary button.

---

## 🚀 Key Features & Architecture

### 1. Robust Multimodal Extraction & Fallback Pipeline
- **Multimodal Vision AI Support**: Supports both **Google Gemini Vision** (`gemini-flash-latest`, `gemini-3.1-flash-lite`) and **OpenAI GPT-4o-mini Vision** via configuration in `.env`. Camera capture payloads are optimized (`quality: 0.6`) to ensure fast and reliable uploads.
- **Smart Non-Receipt Detection**: The vision engine analyzes incoming images for financial document characteristics. If a user uploads a photo of a pet, vehicle, selfie, or random landscape, the scanner cleanly halts and alerts: *"No Receipt Detected"*.
- **OCR.space Fallback & Manual Entry**: Includes cloud OCR table parsing fallback for multi-column invoices and international receipts. When completely offline or if extraction cannot parse the image, the app cleanly transitions to a manual entry workflow with the snapped receipt anchored in the preview thumbnail.
- **Animated Laser Scanning**: Pulsing laser scan line with corner framing brackets, progress bar, and user-facing stage feedback ("Reading receipt details...").

### 2. High-Precision Real-Time Currency Math
- Standard JavaScript floating-point operations introduce dangerous calculation bugs (e.g. `0.1 + 0.2 = 0.30000000000000004`).
- Koin handles all currency calculations using **integer cents arithmetic** (`Math.round(price * 100)`), recalculating dynamically on every keystroke, addition, or deletion.

### 3. Input Validation & Edge Case Safeguards
- **Negative Price Prevention**: Minus signs and non-numeric characters are sanitized in real time.
- **Empty Merchant Validation**: Blocks saving if the merchant name is blank.
- **Zero/Empty Total Validation**: Blocks saving if the total is $\le \$0.00$.
- **Zero Items Validation**: Blocks saving if all items are deleted.
- **Ghost Row Pruning**: Empty rows are automatically pruned before persisting to storage.

### 4. Mobile UX Polish
- **Keyboard Avoidance**: Screen 2 wraps editable fields in `KeyboardAvoidingView` with `keyboardShouldPersistTaps="handled"`.
- **Tabular Numerals**: Formatted with `fontVariant: ['tabular-nums']` to ensure numbers align neatly in lists.
- **Haptic Feedback**: Integrates `expo-haptics` for tactile responses on button presses, item deletions, and successful expense saves.
- **Offline Persistence**: Uses `@react-native-async-storage/async-storage` to persist expense history locally across app restarts under `@koin_expenses_v2`.

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 58](https://expo.dev/) (React Native 0.88.1, React 19.3.0)
- **Routing**: [Expo Router v58](https://docs.expo.dev/router/introduction/) (File-based navigation in `src/app/`)
- **Language**: TypeScript (Strict mode enabled, 0 type errors)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Storage**: `@react-native-async-storage/async-storage`
- **Icons**: `lucide-react-native`
- **Native Modules**: `expo-image-picker`, `expo-haptics`, `react-native-safe-area-context`

### Project Structure
```
src/
├── app/
│   ├── _layout.tsx               # Root navigation stack & theme setup
│   ├── index.tsx                 # Screen 1: Expenses & Upload Flow
│   └── review.tsx                # Screen 2: Review Extracted Receipt Flow
├── components/
│   ├── DashedBorderCard.tsx      # Dashed upload card matching Figma
│   ├── ExpenseRow.tsx            # Transaction item row with long-press delete
│   ├── BottomTabBar.tsx          # 4-tab bar with "Coming Soon" toast feedback
│   ├── ScanActionSheet.tsx       # Spring-animated Camera/Gallery sheet
│   ├── ExtractedItemRow.tsx      # Editable line item row with tabular price box
│   ├── CategoryPickerModal.tsx   # Category dropdown selector modal
│   ├── ReceiptPreviewModal.tsx   # Scanned receipt image zoom viewer
│   ├── ScanningModal.tsx         # Animated laser scanning progress overlay
│   └── WebCameraModal.tsx        # Viewfinder for browser webcam testing
├── services/
│   ├── receiptExtractor.ts       # Multimodal Vision API + Smart Non-Receipt Detection
│   └── storage.ts                # AsyncStorage persistence layer
├── store/
│   └── useExpenseStore.ts        # Zustand store with integer cents arithmetic
├── theme/
│   └── colors.ts                 # Design tokens per Figma specifications
├── types/
│   └── expense.ts                # TypeScript interfaces and categories
└── utils/
    ├── categories.ts             # Category metadata, icons, and colors
    ├── currency.ts               # Precision arithmetic and currency formatters
    └── receiptParser.ts          # Multi-column table parser for international receipts
```

---

## 🏃 Running the Project Locally

### Prerequisites
- Node.js (22.13 or newer)
- npm, bun, or yarn

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ManushkaSL/koin-receipt-expense-app.git
cd koin-receipt-expense-app
npm install
```

### 2. Environment Variables (Optional)
If you want to test live multimodal extraction with an API key:
```bash
cp .env.example .env
# Set EXPO_PUBLIC_GEMINI_API_KEY=your_key or EXPO_PUBLIC_OPENAI_API_KEY=your_key in .env
```
*(If omitted, the app provides cloud OCR fallback and a smooth manual entry workflow).*

### 3. Run the Development Server
```bash
npx expo start
```
- **Physical Device (Expo Go)**: Scan the QR code with the Expo Go app (Android) or Camera app (iOS).
- **iOS Simulator**: Press `i` in the terminal.
- **Android Emulator**: Press `a` in the terminal.
- **Web Browser**: Press `w` in the terminal to test in Chrome/Safari.

### 4. Verification & Diagnostics
```bash
# Typecheck (0 errors)
npx tsc --noEmit

# Expo Diagnostics (19/20 passed, 0 config issues)
npx expo-doctor
```

---

## 🤖 Note on AI Tooling (Force Multiplier)

As encouraged in the assignment guidelines, AI tools were leveraged as active force multipliers throughout development:

1. **Design-to-Code Translation**: Inspected Figma mockups (`Koin · Expenses.png` and `Koin · Review receipt.png`) to extract exact hex codes (`#F4F1EA`, `#0F172A`, `#10B981`, `#64748B`), typography scales, border radiuses, and padding constraints.
2. **Financial Math Architecture**: Enforced strict integer cents arithmetic across all dynamic operations, safeguarding against floating-point rounding errors.
3. **Edge Case Hardening**: Designed multi-stage fallbacks, payload compression, negative input sanitization, and non-receipt image detection to guarantee a production-grade experience.
