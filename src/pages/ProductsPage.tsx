import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { Pencil, Plus, Package, Image as ImageIcon, Filter, Search, Grid, List, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: number;
  product_name: string;
  product_code: string;
  category: string;
  category_id?: number;
  brand?: string;
  brand_id?: number;
  sku_id?: number;
  sku?: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  image_url?: string;
}

interface ProductSku {
  id: number;
  sku: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Edit modal state
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Category editing (removed)

  // Image upload modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Image preview modal state
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imagePreviewName, setImagePreviewName] = useState<string | null>(null);

  // Add product modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    product_name: '',
    product_code: '',
    category_id: '',
    brand_id: '',
    cost_price: '',
    selling_price: '',
    image: null as File | null,
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // SKUs (master list, used for product assignment)
  const [allSkus, setAllSkus] = useState<ProductSku[]>([]);
  const [editSkuId, setEditSkuId] = useState<string>('');

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Filtered products
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [products, categoryFilter, searchQuery]);

  // Pagination calculations
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredProducts.length);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchQuery]);

  // Ensure current page is valid after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Fetch categories on mount
  useEffect(() => {
    axios.get('/api/financial/categories')
      .then(res => {
        if (res.data.success) {
          setCategories(res.data.data || []);
        }
      })
      .catch(err => {
        console.error('Error fetching categories:', err);
        setCategories([]); // Ensure categories is always an array
      });
  }, []);

  // Fetch brands on mount
  useEffect(() => {
    axios.get('/api/brands', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        if (res.data.success) {
          setBrands(res.data.data || []);
        }
      })
      .catch(err => {
        console.error('Error fetching brands:', err);
        setBrands([]); // Ensure brands is always an array
      });
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('/api/financial/products');
        if (res.data.success) {
          setProducts(res.data.data || []);
        } else {
          setError(res.data.error || 'Failed to fetch products');
        }
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to fetch products');
        setProducts([]); // Ensure products is always an array
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch all SKUs once (for assignment in edit modal)
  useEffect(() => {
    const fetchSkus = async () => {
      try {
        const res = await axios.get('/api/financial/skus');
        if (res.data?.success) {
          setAllSkus(Array.isArray(res.data.data) ? res.data.data : []);
        } else {
          console.error('Failed to fetch SKUs:', res.data?.error);
        }
      } catch (err) {
        console.error('Failed to fetch SKUs:', err);
      }
    };
    fetchSkus();
  }, []);

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setEditForm({ ...product });
    setEditSkuId(product.sku_id ? String(product.sku_id) : '');
    setEditError(null);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditProduct(null);
    setEditForm({});
    setEditError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: name === 'cost_price' || name === 'selling_price' ? Number(value) : value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      // Only include cost_price if user is admin
      const updateData = { ...editForm };
      if (!isAdmin) {
        delete updateData.cost_price;
      }
      // sku_id is handled via separate endpoint
      delete (updateData as any).sku_id;

      const res = await axios.put(`/api/financial/products/${editProduct.id}`, updateData);
      if (!res.data.success) {
        setEditError(res.data.error || 'Failed to update product');
        setEditSubmitting(false);
        return;
      }

      // Update SKU assignment if changed
      let newSkuText: string | undefined = editProduct.sku;
      let newSkuId: number | undefined = editProduct.sku_id;
      try {
        const sku_id = editSkuId ? Number(editSkuId) : null;
        const skuRes = await axios.put(`/api/financial/products/${editProduct.id}/sku`, { sku_id });
        if (skuRes.data?.success && skuRes.data.data) {
          newSkuText = skuRes.data.data.sku || undefined;
          newSkuId = skuRes.data.data.sku_id ?? sku_id ?? undefined;
        } else {
          newSkuId = sku_id ?? undefined;
        }
      } catch (skuErr) {
        console.error('Failed to update product SKU:', skuErr);
      }

      setProducts(products =>
        products.map(p =>
          p.id === editProduct.id
            ? ({ ...p, ...updateData, sku: newSkuText, sku_id: newSkuId } as Product)
            : p
        )
      );
      closeEditModal();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update product');
    } finally {
      setEditSubmitting(false);
    }
  };

  // (legacy category/image helpers removed; managed elsewhere)
  
  const closeImageModal = () => {
    setSelectedProduct(null);
    setImageModalOpen(false);
    setUploadError(null);
  };
  
  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !fileInputRef.current?.files?.[0]) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('image', fileInputRef.current.files[0]);
    try {
      const res = await axios.post(`/api/financial/products/${selectedProduct.id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setProducts(products => products.map(p => p.id === selectedProduct.id ? { ...p, image_url: res.data.url } : p));
        closeImageModal();
      } else {
        setUploadError(res.data.error || 'Failed to upload image');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image');
    }
    setUploading(false);
  };

  // (per-product SKU assignment is handled in edit modal using allSkus/editSkuId)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Products Management</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                to="/categories" 
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Package className="w-3.5 h-3.5 mr-1.5" />
                Manage Categories
              </Link>
              <Link 
                to="/brands" 
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Tag className="w-3.5 h-3.5 mr-1.5" />
                Manage Brands
              </Link>
              <Link
                to="/skus"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Tag className="w-3.5 h-3.5 mr-1.5" />
                Manage SKUs
              </Link>
              <button
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => { setAddModalOpen(true); setAddError(null); }}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Product
              </button>
            </div>
          </div>
 
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <select
                  className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-600">Loading products...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
            <Package className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">No products found</h3>
            <p className="text-sm text-gray-600 mb-3">
              {searchQuery || categoryFilter ? 'Try adjusting your search or filters.' : 'Get started by adding your first product.'}
            </p>
            {!searchQuery && !categoryFilter && (
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Product
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Products Count */}
            <div className="mb-3">
              <p className="text-xs text-gray-600">
                Showing {startItem} to {endItem} of {filteredProducts.length} products
                {filteredProducts.length !== products.length && ` (filtered from ${products.length} total)`}
              </p>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <>
                {paginatedProducts.length === 0 ? (
                  <div className="text-center py-10">
                    <Package className="mx-auto h-10 w-10 text-gray-400" />
                    <h3 className="mt-2 text-xs font-medium text-gray-900">No products found</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {filteredProducts.length === 0 && products.length > 0 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Get started by adding your first product.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedProducts.map((product) => (
                      <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                        {/* Product Image */}
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.product_name}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => { setImagePreviewUrl(product.image_url!); setImagePreviewName(product.product_name); }}
                            />
                          ) : (
                            <div className="text-gray-400 text-center p-4">
                              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                              <p className="text-xs">No image</p>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-3">
                          <h3 className="font-medium text-gray-900 text-xs mb-0.5 truncate" title={product.product_name}>
                            {product.product_name}
                          </h3>
                          <p className="text-[10px] text-gray-500 mb-0.5">{product.product_code}</p>
                          {product.sku && (
                            <p className="text-[10px] text-gray-600 mb-0.5">SKU: {product.sku}</p>
                          )}
                          <p className="text-[10px] text-gray-600 mb-1">{product.category}</p>
                          {product.brand && (
                            <p className="text-[10px] text-gray-500 mb-2">{product.brand}</p>
                          )}
                          
                          {isAdmin && (
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-blue-600">
                                {Number(product.cost_price).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                              </span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => openEditModal(product)}
                              className="flex-1 inline-flex items-center justify-center px-2 py-1 border border-gray-300 rounded-md text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Pencil className="w-3 h-3 mr-0.5" />
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                                 )}
               </>
             )}

            {/* List View */}
            {viewMode === 'list' && (
              <>
                {paginatedProducts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
                    <Package className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">No products found</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {filteredProducts.length === 0 && products.length > 0 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Get started by adding your first product.'
                      }
                    </p>
                    {!searchQuery && !categoryFilter && (
                      <button
                        onClick={() => setAddModalOpen(true)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add Product
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                            {isAdmin && (
                              <th className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
                            )}
                            <th className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">RRP</th>
                            <th className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs font-medium text-gray-900">{product.product_name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{product.product_code}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{product.sku || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{product.category}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{product.brand || <span className="text-gray-400 italic">No brand</span>}</td>
                          {isAdmin && (
                            <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-semibold text-blue-600">
                              {Number(product.cost_price).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                            </td>
                          )}
                          <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-semibold text-green-600">
                            {Number(product.selling_price || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(product)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
                )}
              </>
            )}
          </>
        )}

        {/* Pagination Controls */}
        {filteredProducts.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-700">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-xs text-gray-700">per page</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2.5 py-1 text-xs rounded ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {editModalOpen && editProduct && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={closeEditModal}
                disabled={editSubmitting}
              >
                &times;
              </button>
              <h2 className="text-base font-bold mb-3">Edit Product</h2>
              {editError && <div className="text-xs text-red-600 mb-2">{editError}</div>}
              <form onSubmit={handleEditSubmit}>
                <div className="mb-3">
                  <label className="block text-xs font-medium mb-1">Product Name</label>
                  <input
                    type="text"
                    name="product_name"
                    value={editForm.product_name || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Product Code</label>
                  <input
                    type="text"
                    name="product_code"
                    value={editForm.product_code || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    name="category_id"
                    value={editForm.category_id || ''}
                    onChange={e => {
                      const selectedId = Number(e.target.value);
                      const selectedCat = categories.find(c => c.id === selectedId);
                      setEditForm(f => ({
                        ...f,
                        category_id: selectedId,
                        category: selectedCat ? selectedCat.name : ''
                      }));
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Brand</label>
                  <select
                    name="brand_id"
                    value={editForm.brand_id || ''}
                    onChange={e => {
                      const selectedId = Number(e.target.value);
                      const selectedBrand = brands.find(b => b.id === selectedId);
                      setEditForm(f => ({
                        ...f,
                        brand_id: selectedId,
                        brand: selectedBrand ? selectedBrand.name : ''
                      }));
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="">Select Brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">SKU (one per product)</label>
                  <select
                    value={editSkuId}
                    onChange={e => setEditSkuId(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">None</option>
                    {allSkus
                      .filter(s => s.is_active)
                      .map(s => (
                        <option key={s.id} value={String(s.id)}>
                          {s.sku}
                        </option>
                      ))}
                  </select>
                </div>
                {isAdmin && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Cost Price</label>
                    <input
                      type="number"
                      name="cost_price"
                      value={editForm.cost_price ?? ''}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">RRP</label>
                  <input
                    type="number"
                    name="selling_price"
                    value={editForm.selling_price ?? ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="mb-4" hidden>
                  <label className="block text-sm font-medium mb-1">Current Stock</label>
                  <input
                    type="number"
                    name="current_stock"
                    value={editForm.current_stock ?? ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    min="0"
                    step="1"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {imageModalOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={closeImageModal}>
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-auto relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" onClick={closeImageModal} aria-label="Close">&times;</button>
              <h2 className="text-lg font-bold mb-4">Upload Image for {selectedProduct.product_name}</h2>
              <form onSubmit={handleImageUpload}>
                <input type="file" accept="image/*" ref={fileInputRef} className="mb-4" required />
                {uploadError && <div className="text-red-600 mb-2">{uploadError}</div>}
                <div className="flex justify-end gap-2">
                  <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={closeImageModal}>Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {imagePreviewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setImagePreviewUrl(null)}>
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-0 right-0 m-2 text-white text-2xl" onClick={() => setImagePreviewUrl(null)} aria-label="Close">&times;</button>
              <img src={imagePreviewUrl} alt={imagePreviewName || ''} className="max-w-full max-h-[80vh] rounded shadow-lg" />
              {imagePreviewName && <div className="text-white text-center mt-2 text-lg font-semibold">{imagePreviewName}</div>}
            </div>
          </div>
        )}

        {addModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => setAddModalOpen(false)}>
            <div className="bg-white rounded-lg shadow-lg p-3 w-full max-w-md mx-auto relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-600 text-lg" onClick={() => setAddModalOpen(false)} aria-label="Close">&times;</button>
              <h2 className="text-xs font-bold mb-3">Add Product</h2>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setAddSubmitting(true);
                  setAddError(null);
                  try {
                    const formData = new FormData();
                    formData.append('product_name', addForm.product_name);
                    formData.append('product_code', addForm.product_code);
                    formData.append('category_id', addForm.category_id);
                    if (addForm.brand_id) {
                      formData.append('brand_id', addForm.brand_id);
                    }
                    if (isAdmin) {
                      formData.append('cost_price', addForm.cost_price);
                    }
                    formData.append('selling_price', addForm.selling_price);
                    if (addForm.image) formData.append('image', addForm.image);
                    
                    console.log('Sending product data:');
                    console.log('  product_name:', addForm.product_name);
                    console.log('  product_code:', addForm.product_code);
                    console.log('  category_id:', addForm.category_id);
                    console.log('  brand_id:', addForm.brand_id);
                    console.log('  cost_price:', addForm.cost_price);
                    console.log('  selling_price:', addForm.selling_price);
                    console.log('  has image:', !!addForm.image);
                    
                    const res = await axios.post('/api/financial/products', formData, { 
                      headers: { 
                        'Content-Type': 'multipart/form-data' 
                      } 
                    });
                    if (res.data.success) {
                      setProducts(products => [res.data.data, ...products]);
                      setAddModalOpen(false);
                      setAddForm({ product_name: '', product_code: '', category_id: '', brand_id: '', cost_price: '', selling_price: '', image: null });
                    } else {
                      setAddError(res.data.error || 'Failed to add product');
                    }
                  } catch (err: any) {
                    console.error('Error creating product:', err);
                    console.error('Error response:', err.response);
                    const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to add product';
                    setAddError(errorMessage);
                  }
                  setAddSubmitting(false);
                }}
              >
                <div className="mb-2.5">
                  <label className="block text-xs font-medium mb-1">Product Name</label>
                  <input
                    className="border rounded px-2.5 py-1.5 text-xs w-full"
                    value={addForm.product_name}
                    onChange={e => setAddForm(f => ({ ...f, product_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2.5">
                  <label className="block text-xs font-medium mb-1">Product Code</label>
                  <input
                    className="border rounded px-2.5 py-1.5 text-xs w-full"
                    value={addForm.product_code}
                    onChange={e => setAddForm(f => ({ ...f, product_code: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-2.5">
                  <label className="block text-xs font-medium mb-1">Category</label>
                  <select
                    className="border rounded px-2.5 py-1.5 text-xs w-full"
                    value={addForm.category_id}
                    onChange={e => setAddForm(f => ({ ...f, category_id: e.target.value }))}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2.5">
                  <label className="block text-xs font-medium mb-1">Brand</label>
                  <select
                    className="border rounded px-2.5 py-1.5 text-xs w-full"
                    value={addForm.brand_id}
                    onChange={e => setAddForm(f => ({ ...f, brand_id: e.target.value }))}
                    required
                  >
                    <option value="">Select brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                {isAdmin && (
                  <div className="mb-2.5">
                    <label className="block text-xs font-medium mb-1">Cost Price</label>
                    <input
                      className="border rounded px-2.5 py-1.5 text-xs w-full"
                      type="number"
                      value={addForm.cost_price}
                      onChange={e => setAddForm(f => ({ ...f, cost_price: e.target.value }))}
                      required
                    />
                  </div>
                )}
                <div className="mb-2.5">
                  <label className="block text-xs font-medium mb-1">RRP</label>
                  <input
                    className="border rounded px-2.5 py-1.5 text-xs w-full"
                    type="number"
                    value={addForm.selling_price}
                    onChange={e => setAddForm(f => ({ ...f, selling_price: e.target.value }))}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="mb-2.5">
                  <label className="block text-xs font-medium mb-1">Image (optional)</label>
                  <input
                    className="border rounded px-2.5 py-1.5 text-xs w-full"
                    type="file"
                    accept="image/*"
                    onChange={e => setAddForm(f => ({ ...f, image: e.target.files?.[0] || null }))}
                  />
                </div>
                {addError && <div className="text-red-600 mb-2 text-xs">{addError}</div>}
                <div className="flex justify-end gap-2">
                  <button type="button" className="px-3 py-1.5 text-xs rounded bg-gray-200 hover:bg-gray-300" onClick={() => setAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="px-3 py-1.5 text-xs rounded bg-green-600 text-white hover:bg-green-700" disabled={addSubmitting}>{addSubmitting ? 'Adding...' : 'Add Product'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SKU Modal */}
      </div>
    </div>
  );
};

export default ProductsPage; 