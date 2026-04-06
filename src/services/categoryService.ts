import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface Category {
  id: number;
  name: string;
  description?: string;
  orderIndex: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryStats {
  id: number;
  name: string;
  orderIndex: number;
  is_active: boolean;
  product_count: number;
  total_stock: number;
  avg_price: number;
}

export interface Product {
  id: number;
  product_code: string;
  product_name: string;
  category_id?: number;
  category_name?: string;
  description?: string;
  unit_of_measure: string;
  cost_price: number;
  selling_price: number;
  reorder_level: number;
  current_stock: number;
  is_active: boolean;
}

const categoryService = {
  /**
   * Get all categories
   */
  getAllCategories: async (activeOnly: boolean = false): Promise<{ categories: Category[]; total: number }> => {
    const response = await axios.get(`${API_BASE_URL}/categories`, {
      params: { active_only: activeOnly }
    });
    return response.data;
  },

  /**
   * Get category by ID
   */
  getCategoryById: async (id: number): Promise<Category> => {
    const response = await axios.get(`${API_BASE_URL}/categories/${id}`);
    return response.data.category;
  },

  /**
   * Get products by category
   */
  getProductsByCategory: async (categoryId: number, activeOnly: boolean = false): Promise<{ products: Product[]; total: number }> => {
    const response = await axios.get(`${API_BASE_URL}/categories/${categoryId}/products`, {
      params: { active_only: activeOnly }
    });
    return response.data;
  },

  /**
   * Get category statistics
   */
  getCategoryStats: async (): Promise<CategoryStats[]> => {
    const response = await axios.get(`${API_BASE_URL}/categories/stats`);
    return response.data.stats;
  },

  /**
   * Create a new category
   */
  createCategory: async (categoryData: {
    name: string;
    description?: string;
    orderIndex?: number;
    is_active?: boolean;
  }): Promise<{ categoryId: number }> => {
    const response = await axios.post(`${API_BASE_URL}/categories`, categoryData);
    return response.data;
  },

  /**
   * Update a category
   */
  updateCategory: async (id: number, categoryData: Partial<{
    name: string;
    description: string;
    orderIndex: number;
    is_active: boolean;
  }>): Promise<void> => {
    await axios.put(`${API_BASE_URL}/categories/${id}`, categoryData);
  },

  /**
   * Delete a category (soft delete)
   */
  deleteCategory: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/categories/${id}`);
  }
};

export default categoryService;

