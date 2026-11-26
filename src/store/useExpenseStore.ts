import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import { Expense, ExtractedReceiptData, ExpenseCategory, ReceiptItem } from '../types/expense';
import { calculateTotal } from '../utils/currency';
import { loadStoredExpenses, saveStoredExpenses, INITIAL_EXPENSES } from '../services/storage';

export type NavigationTab = 'Home' | 'Expenses' | 'Insights' | 'Profile';

interface ExpenseState {
  expenses: Expense[];
  activeTab: NavigationTab;
  currentReview: ExtractedReceiptData | null;
  isScanning: boolean;
  scanProgress: number;
  scanStage: string;
  isLoaded: boolean;

  // Actions
  loadExpenses: () => Promise<void>;
  setActiveTab: (tab: NavigationTab) => void;
  setScanning: (isScanning: boolean, progress?: number, stage?: string) => void;
  setCurrentReview: (data: ExtractedReceiptData | null) => void;
  
  // Review Editing Actions
  updateReviewMerchant: (merchant: string) => void;
  updateReviewDate: (date: string) => void;
  updateReviewCategory: (category: ExpenseCategory) => void;
  updateReviewItemName: (id: string, name: string) => void;
  updateReviewItemPrice: (id: string, price: number) => void;
  addReviewItem: () => void;
  removeReviewItem: (id: string) => void;
  
  // Save Action
  saveCurrentExpense: () => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: INITIAL_EXPENSES,
  activeTab: 'Expenses',
  currentReview: null,
  isScanning: false,
  scanProgress: 0,
  scanStage: '',
  isLoaded: false,

  loadExpenses: async () => {
    const list = await loadStoredExpenses();
    set({ expenses: list, isLoaded: true });
  },

  setActiveTab: (tab: NavigationTab) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    set({ activeTab: tab });
  },

  setScanning: (isScanning, progress = 0, stage = '') => {
    set({ isScanning, scanProgress: progress, scanStage: stage });
  },

  setCurrentReview: (data) => {
    set({ currentReview: data });
  },

  updateReviewMerchant: (merchant) => {
    const { currentReview } = get();
    if (!currentReview) return;
    set({
      currentReview: { ...currentReview, merchant },
    });
  },

  updateReviewDate: (date) => {
    const { currentReview } = get();
    if (!currentReview) return;
    set({
      currentReview: { ...currentReview, date },
    });
  },

  updateReviewCategory: (category) => {
    const { currentReview } = get();
    if (!currentReview) return;
    try {
      Haptics.selectionAsync();
    } catch {}
    set({
      currentReview: { ...currentReview, category },
    });
  },

  updateReviewItemName: (id, name) => {
    const { currentReview } = get();
    if (!currentReview) return;
    const items = currentReview.items.map((item) =>
      item.id === id ? { ...item, name } : item
    );
    set({
      currentReview: { ...currentReview, items },
    });
  },

  updateReviewItemPrice: (id, price) => {
    const { currentReview } = get();
    if (!currentReview) return;
    const items = currentReview.items.map((item) =>
      item.id === id ? { ...item, price } : item
    );
    const newTotal = calculateTotal(items);
    set({
      currentReview: {
        ...currentReview,
        items,
        total: newTotal,
      },
    });
  },

  addReviewItem: () => {
    const { currentReview } = get();
    if (!currentReview) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const newItem: ReceiptItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: '',
      price: 0,
    };
    const items = [...currentReview.items, newItem];
    const newTotal = calculateTotal(items);
    set({
      currentReview: {
        ...currentReview,
        items,
        total: newTotal,
      },
    });
  },

  removeReviewItem: (id) => {
    const { currentReview } = get();
    if (!currentReview) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const items = currentReview.items.filter((item) => item.id !== id);
    const newTotal = calculateTotal(items);
    set({
      currentReview: {
        ...currentReview,
        items,
        total: newTotal,
      },
    });
  },

  saveCurrentExpense: async () => {
    const { currentReview, expenses } = get();
    if (!currentReview) return null;

    // Filter valid items or keep non-empty items
    const validItems = currentReview.items.filter(
      (it) => it.name.trim().length > 0 || it.price > 0
    );

    const newExpense: Expense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      merchant: currentReview.merchant.trim() || 'Untitled Expense',
      date: currentReview.date || 'Today',
      category: currentReview.category,
      items: validItems.length > 0 ? validItems : currentReview.items,
      total: currentReview.total,
      receiptUri: currentReview.receiptUri,
      createdAt: Date.now(),
    };

    const updatedList = [newExpense, ...expenses];
    set({ expenses: updatedList, currentReview: null });
    await saveStoredExpenses(updatedList);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    return newExpense;
  },

  deleteExpense: async (id) => {
    const { expenses } = get();
    const updated = expenses.filter((e) => e.id !== id);
    set({ expenses: updated });
    await saveStoredExpenses(updated);
  },
}));
