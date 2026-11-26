# Koin — Receipt Scan & Expense Review Flow

> **Engineering Challenge Submission: Mobile Software Engineer Intern**  
> Built with **React Native (Expo SDK 58)**, **TypeScript**, **Zustand**, and **Expo Router**.

---

## 📱 Overview & Design-to-Code Precision

Koin turns messy receipts into clean, structured expense entries. This application replicates the provided Figma designs with high-fidelity across both **iOS** and **Android**:

- **Warm Theme & Palette**:
  - Background: Warm off-white/cream (`#F4F1EA`)
  - Elevated Cards: Pure white (`#FFFFFF`) with subtle warm borders (`#EAE6DF`)
  - Primary Text: Deep navy (`#0F172A`)
  - Secondary Text: Muted slate (`#64748B`)
  - Brand Accents: Vibrant emerald green (`#10B981` / `#00B37E`) with soft pastel category icon badges.
- **Screen 1 (Expenses & Upload)**:
  - Header with `KOIN` eyebrow, bold `Expenses` title, and emerald `+ Scan Bill` pill button.
  - Dashed-border upload card with receipt icon badge, headings, and side-by-side `Camera` & `Gallery` actions.
  - Recent Activity section (`This week`) displaying transaction rows with category icon badges, timestamps, and right-aligned tabular dollar amounts.
  - Fixed bottom navigation bar (`Home`, `Expenses` active in emerald green, `Insights`, `Profile`).
- **Screen 2 (Review Extracted Receipt)**:
  - Top navigation bar with back arrow, screen title, and tappable thumbnail preview of the scanned receipt.
  - Editable summary card for **Merchant Name** (with pencil icon), **Date** (with calendar icon), and **Category** dropdown pill.
  - Extracted Items section with real-time editable item names, `$ [price]` input boxes with `tabular-nums`, item deletion (trash icon), and `+ Add Item` button.
  - Real-time recalculation of total amount avoiding floating-point math bugs.
  - Sticky bottom summary bar with bold Total Amount, item count badge (`✓ 3 items`), and full-width `✓ Confirm & Save Expense` primary button.

---

## 🚀 Key Features

### 1. Hybrid Multimodal AI Extraction & Instant Fallback
- **Live Multimodal AI Extraction**: Integrated with Google Gemini 1.5 Flash Vision REST API. Supply an API key in `.env` (`EXPO_PUBLIC_GEMINI_API_KEY`) to extract live receipts from camera or photo library.
- **Zero-Config Simulated Fallback**: Reviewers can test **immediately without any API key**. The app comes pre-packaged with realistic presets (including the exact `Cafe Kumbuk` receipt from Figma, `Keells Super`, `Uber`, and `The Good Market`).
- **Scanning Animation**: Displays a pulsing laser scanner animation and step-by-step progress feedback while extracting.

### 2. High-Precision Real-Time Currency Math
- Standard JavaScript floating-point operations can produce bugs (e.g., `0.1 + 0.2 = 0.30000000000000004`).
- Koin handles all currency calculations using **integer cents arithmetic** (`Math.round(price * 100)`), recalculating dynamically whenever line items are added, edited, or deleted.

### 3. Mobile UX Polish
- **Keyboard Avoidance**: Screen 2 wraps editable fields in `KeyboardAvoidingView` and `ScrollView` with `keyboardShouldPersistTaps="handled"`.
- **Tabular Numerals**: Formatted with `fontVariant: ['tabular-nums']` to ensure numbers align neatly in lists.
- **Haptic Feedback**: Integrates `expo-haptics` for tactile responses on button presses, item deletions, and successful expense saves.
- **Offline Persistence**: Uses `@react-native-async-storage/async-storage` to persist expense history locally across app restarts.
- **Receipt Image Modal**: Tapping the receipt thumbnail opens a high-resolution preview modal.

### 4. Input Validation & Edge Cases
- Prevents saving with an empty merchant name.
- Prevents saving receipts with no line items.
- Prevents saving with negative or invalid total amounts.
- Sanitizes currency inputs to prevent multiple decimal points or invalid characters.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [Expo SDK 58](https://expo.dev/) (React Native 0.88.1, React 19.3.0)
- **Routing**: [Expo Router v58](https://docs.expo.dev/router/introduction/) (File-based navigation in `src/app/`)
- **Language**: TypeScript (Strict mode enabled)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Simple, reactive store with clean actions)
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
│   ├── ExpenseRow.tsx            # Transaction item row with category badge
│   ├── BottomTabBar.tsx          # Fixed bottom navigation tabs
│   ├── ExtractedItemRow.tsx      # Editable line item row with currency input
│   ├── CategoryPickerModal.tsx   # Category dropdown selector modal
│   ├── ReceiptPreviewModal.tsx   # Scanned receipt image zoom viewer
│   └── ScanningModal.tsx         # Animated laser scanning progress overlay
├── services/
│   ├── receiptExtractor.ts       # Multimodal Gemini API + Simulated Fallback
│   └── storage.ts                # AsyncStorage persistence layer
├── store/
│   └── useExpenseStore.ts        # Zustand store with cents arithmetic
├── theme/
│   └── colors.ts                 # Design tokens per Figma specifications
├── types/
│   └── expense.ts                # TypeScript interfaces and categories
└── utils/
    ├── categories.ts             # Category metadata, icons, and colors
    └── currency.ts               # Precision arithmetic and currency formatters
```

---

## 🏃 Running the Project Locally

### Prerequisites
- Node.js (v20+ or v22+)
- npm or bun

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-link>
cd koin
npm install
```

### 2. Environment Variables (Optional)
If you want to test live multimodal extraction with a Google Gemini API key:
```bash
cp .env.example .env
# Open .env and set EXPO_PUBLIC_GEMINI_API_KEY=your_key
```
*(If omitted, the app will automatically use the realistic simulated OCR fallback).*

### 3. Run the Development Server
```bash
# Start Expo Metro Bundler
npx expo start
```

- **iOS Simulator**: Press `i` in the terminal.
- **Android Emulator**: Press `a` in the terminal.
- **Web Browser**: Press `w` in the terminal to test in Chrome/Safari.
- **Physical Device (Expo Go)**: Scan the QR code with the Expo Go app (Android) or Camera app (iOS).

### 4. Verification & Diagnostics
```bash
# Typecheck
npx tsc --noEmit

# Expo Doctor (all checks pass)
npx expo-doctor
```

---

## 🤖 Note on AI Tooling (Force Multiplier)

As highlighted in the assignment brief, modern software engineering benefits enormously from treating AI tools as active force multipliers:

1. **Design-to-Code Translation**:
   - Used AI visual analysis to inspect high-resolution mockups (`Koin · Expenses.png` and `Koin · Review receipt.png`), extracting exact hex codes (`#F4F1EA`, `#0F172A`, `#10B981`, `#64748B`), typography hierarchies, border radiuses, and padding metrics.
2. **Robust Architecture & Edge Cases**:
   - Prompted AI to architect the financial calculation pipeline using integer-cent arithmetic rather than primitive floats, preventing subtle rounding bugs when editing item prices.
   - Designed a graceful dual-mode OCR pipeline: live Gemini Vision API when an API key is available, paired with simulated realistic presets for reviewers who want to test immediately with zero friction.
3. **Debugging AI-Generated Artifacts**:
   - TypeScript 6.0 deprecation warnings (`TS5101: Option 'baseUrl' is deprecated`) were resolved cleanly by adjusting path mapping in `tsconfig.json`.
   - Prop mismatches in `expo-status-bar` were quickly caught and corrected during verification.
   - Keyboard interaction glitches were solved by configuring `keyboardShouldPersistTaps="handled"` on the scroll view, ensuring taps on "Add Item", "Delete", and inputs remain immediately responsive while editing.
