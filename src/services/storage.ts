import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense } from '../types/expense';

const EXPENSES_STORAGE_KEY = '@koin_expenses_v2';

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_cafe_kumbuk',
    merchant: 'Cafe Kumbuk',
    date: 'Today, 10:42 AM',
    category: 'Food & Dining',
    items: [
      { id: 'item_1', name: 'Avocado toast', price: 14.00 },
      { id: 'item_2', name: 'Cappuccino', price: 6.50 },
      { id: 'item_3', name: 'Banana pancakes', price: 8.00 },
    ],
    total: 28.50,
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
  },
  {
    id: 'exp_keells_super',
    merchant: 'Keells Super',
    date: 'Yesterday, 6:18 PM',
    category: 'Groceries',
    items: [
      { id: 'item_1', name: 'Groceries Basket', price: 64.20 },
    ],
    total: 64.20,
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // Yesterday
  },
  {
    id: 'exp_uber',
    merchant: 'Uber',
    date: 'Nov 22, 2026',
    category: 'Transportation',
    items: [
      { id: 'item_1', name: 'Ride to Colombo 03', price: 12.80 },
    ],
    total: 12.80,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
  {
    id: 'exp_the_good_market',
    merchant: 'The Good Market',
    date: 'Nov 21, 2026',
    category: 'Shopping',
    items: [
      { id: 'item_1', name: 'Artisan Goods', price: 35.00 },
    ],
    total: 35.00,
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
  },
];

export async function loadStoredExpenses(): Promise<Expense[]> {
  try {
    const raw = await AsyncStorage.getItem(EXPENSES_STORAGE_KEY);
    if (!raw) {
      await saveStoredExpenses(INITIAL_EXPENSES);
      return INITIAL_EXPENSES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_EXPENSES;
  } catch (error) {
    console.error('Failed to load expenses from AsyncStorage:', error);
    return INITIAL_EXPENSES;
  }
}

export async function saveStoredExpenses(expenses: Expense[]): Promise<void> {
  try {
    await AsyncStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Failed to save expenses to AsyncStorage:', error);
  }
}
