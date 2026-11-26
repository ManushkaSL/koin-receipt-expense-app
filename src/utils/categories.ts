import { ExpenseCategory } from '../types/expense';
import { colors } from '../theme/colors';

export interface CategoryInfo {
  category: ExpenseCategory;
  icon: 'coffee' | 'shopping-basket' | 'car' | 'shopping-bag' | 'zap' | 'film' | 'heart-pulse' | 'tag';
  color: string;
  bgColor: string;
}

export const CATEGORIES_LIST: ExpenseCategory[] = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Shopping',
  'Utilities',
  'Entertainment',
  'Health',
  'Other',
];

export const CATEGORY_MAP: Record<ExpenseCategory, CategoryInfo> = {
  'Food & Dining': {
    category: 'Food & Dining',
    icon: 'coffee',
    color: colors.category.food.color,
    bgColor: colors.category.food.bg,
  },
  'Groceries': {
    category: 'Groceries',
    icon: 'shopping-basket',
    color: colors.category.groceries.color,
    bgColor: colors.category.groceries.bg,
  },
  'Transportation': {
    category: 'Transportation',
    icon: 'car',
    color: colors.category.transport.color,
    bgColor: colors.category.transport.bg,
  },
  'Shopping': {
    category: 'Shopping',
    icon: 'shopping-bag',
    color: colors.category.shopping.color,
    bgColor: colors.category.shopping.bg,
  },
  'Utilities': {
    category: 'Utilities',
    icon: 'zap',
    color: colors.category.utilities.color,
    bgColor: colors.category.utilities.bg,
  },
  'Entertainment': {
    category: 'Entertainment',
    icon: 'film',
    color: colors.category.entertainment.color,
    bgColor: colors.category.entertainment.bg,
  },
  'Health': {
    category: 'Health',
    icon: 'heart-pulse',
    color: colors.category.health.color,
    bgColor: colors.category.health.bg,
  },
  'Other': {
    category: 'Other',
    icon: 'tag',
    color: colors.category.other.color,
    bgColor: colors.category.other.bg,
  },
};

export function getCategoryInfo(category: ExpenseCategory): CategoryInfo {
  return CATEGORY_MAP[category] || CATEGORY_MAP['Other'];
}
