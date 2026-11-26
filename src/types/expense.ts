export type ExpenseCategory =
  | 'Food & Dining'
  | 'Groceries'
  | 'Transportation'
  | 'Shopping'
  | 'Utilities'
  | 'Entertainment'
  | 'Health'
  | 'Other';

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
}

export interface Expense {
  id: string;
  merchant: string;
  date: string;
  category: ExpenseCategory;
  items: ReceiptItem[];
  total: number;
  receiptUri?: string;
  createdAt: number;
}

export interface ExtractedReceiptData {
  merchant: string;
  date: string;
  category: ExpenseCategory;
  items: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  total: number;
  receiptUri?: string;
  isSimulated?: boolean;
}

export interface CategoryMeta {
  label: ExpenseCategory;
  iconName: string;
  color: string;
  bgColor: string;
}
