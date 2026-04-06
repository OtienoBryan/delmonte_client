import React, { useEffect, useState, useRef } from 'react';
import { fetchWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from '../utils/fetchWithAuth';

interface Document {
  id: number;
  title: string;
  category: string;
  file_url: string;
  description: string;
  uploaded_at: string;
  file_size?: number;
  file_type?: string;
  start_date?: string;
  end_date?: string;
  parent_folder_id?: number | null;
}

interface DocumentCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DocumentFolder {
  id: number;
  name: string;
  parent_folder_id: number | null;
  created_at: string;
  updated_at: string;
}

// Enhanced SVG icons for modern design
const Icons = {
  Plus: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Search: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Filter: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,

  Download: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Eye: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Trash: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Upload: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
  ChevronDown: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  ChevronRight: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Folder: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  FolderOpen: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h12a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>,
  Home: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Calendar: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Tag: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  Edit: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Settings: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Document: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Image: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  PDF: () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z"/></svg>
};

const DocumentListPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expiringFilter, setExpiringFilter] = useState(false);
  
  // Category management state
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoriesList, setShowCategoriesList] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [categoryLoading, setCategoryLoading] = useState(false);
  
  // Categories pagination state
  const [categoriesCurrentPage, setCategoriesCurrentPage] = useState(1);
  const [categoriesPerPage, setCategoriesPerPage] = useState(6);

  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [modalCategory, setModalCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Folder management state
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<DocumentFolder[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderLoading, setFolderLoading] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [folderEditLoading, setFolderEditLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);


  const fetchDocuments = async (folderId: number | null = null) => {
    setLoading(true);
    try {
      const url = folderId !== null 
        ? `/api/documents?parent_folder_id=${folderId}`
        : '/api/documents?parent_folder_id=null';
      
      const res = await fetchWithAuth(url);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch documents: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setDocuments(data);
        setError(null);
      } else {
        console.error('API returned non-array data:', data);
        setDocuments([]);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setDocuments([]);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async (folderId: number | null = null) => {
    try {
      const url = folderId !== null 
        ? `/api/document-folders?parent_folder_id=${folderId}`
        : '/api/document-folders?parent_folder_id=null';
      
      const res = await fetchWithAuth(url);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch folders: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setFolders(data);
      } else {
        console.error('API returned non-array data for folders:', data);
        setFolders([]);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
      setFolders([]);
    }
  };

  const fetchFolderPath = async (folderId: number | null) => {
    if (folderId === null) {
      setFolderPath([]);
      return;
    }

    try {
      const path: DocumentFolder[] = [];
      let currentId: number | null = folderId;

      while (currentId !== null) {
        const res = await fetchWithAuth(`/api/document-folders/${currentId}`);
        if (!res.ok) break;
        
        const folder = await res.json();
        path.unshift(folder);
        currentId = folder.parent_folder_id;
      }

      setFolderPath(path);
    } catch (err) {
      console.error('Error fetching folder path:', err);
      setFolderPath([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetchWithAuth('/api/document-categories');
      
      if (!res.ok) {
        throw new Error(`Failed to fetch categories: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
      setCategories(data);
      } else {
        console.error('API returned non-array data for categories:', data);
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchDocuments(currentFolderId);
    fetchFolders(currentFolderId);
    if (currentFolderId !== null) {
      fetchFolderPath(currentFolderId);
    } else {
      setFolderPath([]);
    }
    fetchCategories();
  }, [currentFolderId]);

  // Enhanced filtering and sorting logic
  useEffect(() => {
    // Ensure documents is always an array
    if (!Array.isArray(documents)) {
      setFilteredDocuments([]);
      return;
    }
    
    let filtered = [...documents];
    
    // Filter by current folder - documents are already filtered by the API, but double-check
    filtered = filtered.filter(doc => {
      const docFolderId = doc.parent_folder_id === null ? null : doc.parent_folder_id;
      return docFolderId === currentFolderId;
    });
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (category) {
      filtered = filtered.filter(doc => doc.category === category);
    }
    
    // Apply expiring filter
    if (expiringFilter) {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      filtered = filtered.filter(doc => {
        if (!doc.end_date) return false;
        const endDate = new Date(doc.end_date);
        return endDate >= today && endDate <= thirtyDaysFromNow;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.uploaded_at).getTime();
          bValue = new Date(b.uploaded_at).getTime();
          break;
        default:
          aValue = new Date(a.uploaded_at).getTime();
          bValue = new Date(b.uploaded_at).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    setFilteredDocuments(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [documents, searchTerm, category, expiringFilter, sortBy, sortOrder, currentFolderId]);


  // Pagination calculations
  const totalItems = Array.isArray(filteredDocuments) ? filteredDocuments.length : 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageDocuments = Array.isArray(filteredDocuments) ? filteredDocuments.slice(startIndex, endIndex) : [];

  // Categories pagination calculations
  const categoriesArray = Array.isArray(categories) ? categories : [];
  const categoriesTotalItems = categoriesArray.length;
  const categoriesTotalPages = Math.ceil(categoriesTotalItems / categoriesPerPage);
  const categoriesStartIndex = (categoriesCurrentPage - 1) * categoriesPerPage;
  const categoriesEndIndex = categoriesStartIndex + categoriesPerPage;
  const currentPageCategories = categoriesArray.slice(categoriesStartIndex, categoriesEndIndex);

  const clearFilters = () => {
    setSearchTerm('');
    setCategory('');
    setExpiringFilter(false);
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Calculate expiring documents count
  const getExpiringDocumentsCount = () => {
    if (!Array.isArray(documents)) return 0;
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return documents.filter(doc => {
      if (!doc.end_date) return false;
      const endDate = new Date(doc.end_date);
      return endDate >= today && endDate <= thirtyDaysFromNow;
    }).length;
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <Icons.PDF />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Icons.Image />;
      default:
        return <Icons.Document />;
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'contract':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'agreement':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'invoice':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'report':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  // Modal submit handler
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    
    if (!title || !modalCategory || !file) {
      setError('Title, category, and file are required.');
      return;
    }
    
    setModalLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', modalCategory);
    formData.append('file', file);
    formData.append('description', description);
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);
    if (currentFolderId !== null) {
      formData.append('parent_folder_id', currentFolderId.toString());
    }
    
    try {
      const res = await fetchWithAuth('/api/documents', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Failed to upload document');
      
      setSuccess('Document uploaded successfully!');
      setTitle('');
      setModalCategory('');
      setFile(null);
      setDescription('');
      setStartDate('');
      setEndDate('');
      setShowModal(false);
      fetchDocuments(currentFolderId);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const res = await deleteWithAuth(`/api/documents/${id}`);
      
      if (!res.ok) throw new Error('Failed to delete document');
      
      setDocuments(documents.filter(doc => doc.id !== id));
      setSuccess('Document deleted successfully!');
      fetchDocuments(currentFolderId);
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderLoading(true);
    setError(null);
    
    if (!folderName.trim()) {
      setError('Folder name is required');
      setFolderLoading(false);
      return;
    }
    
    try {
      const res = await postWithAuth('/api/document-folders', {
        name: folderName.trim(),
        parent_folder_id: currentFolderId
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to create folder';
        throw new Error(errorMessage);
      }
      
      const newFolder = await res.json();
      setFolders([...folders, newFolder]);
      setFolderName('');
      setShowFolderModal(false);
      setSuccess('Folder created successfully!');
      fetchFolders(currentFolderId);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create folder';
      setError(errorMessage);
      console.error('Error creating folder:', err);
    } finally {
      setFolderLoading(false);
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (!confirm('Are you sure you want to delete this folder? All subfolders and documents inside will also be deleted.')) return;
    
    try {
      const res = await deleteWithAuth(`/api/document-folders/${id}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete folder');
      }
      
      setFolders(folders.filter(folder => folder.id !== id));
      setSuccess('Folder deleted successfully!');
      fetchFolders(currentFolderId);
      fetchDocuments(currentFolderId);
    } catch (err: any) {
      setError(err.message || 'Failed to delete folder');
    }
  };

  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editingFolderName.trim()) {
      setError('Folder name is required');
      return;
    }

    setFolderEditLoading(true);
    setError(null);

    try {
      const res = await putWithAuth(`/api/document-folders/${editingFolder.id}`, {
        name: editingFolderName.trim(),
        parent_folder_id: editingFolder.parent_folder_id
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to rename folder');
      }

      const updatedFolder = await res.json();
      setFolders(folders.map(f => f.id === editingFolder.id ? updatedFolder : f));
      setEditingFolder(null);
      setEditingFolderName('');
      setSuccess('Folder renamed successfully!');
      fetchFolders(currentFolderId);
      
      // Update folder path if we're currently viewing this folder
      if (currentFolderId === editingFolder.id) {
        fetchFolderPath(currentFolderId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to rename folder');
    } finally {
      setFolderEditLoading(false);
    }
  };

  const openRenameFolderModal = (folder: DocumentFolder) => {
    setEditingFolder(folder);
    setEditingFolderName(folder.name);
    setError(null);
  };

  const navigateToFolder = (folderId: number | null) => {
    setCurrentFolderId(folderId);
    setCurrentPage(1);
  };

  // Category management functions
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryLoading(true);
    setError(null);
    
    try {
      const url = editingCategory 
        ? `/api/document-categories/${editingCategory.id}`
        : '/api/document-categories';
      
      const res = editingCategory
        ? await putWithAuth(url, categoryForm)
        : await postWithAuth(url, categoryForm);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save category');
      }
      
      const savedCategory = await res.json();
      
      if (editingCategory) {
        const categoriesArray = Array.isArray(categories) ? categories : [];
        setCategories(categoriesArray.map(cat => 
          cat.id === editingCategory.id ? savedCategory : cat
        ));
        setSuccess('Category updated successfully!');
      } else {
        const categoriesArray = Array.isArray(categories) ? categories : [];
        setCategories([...categoriesArray, savedCategory]);
        setSuccess('Category created successfully!');
        // Reset to last page when adding new category
        const newTotalPages = Math.ceil((categoriesArray.length + 1) / categoriesPerPage);
        setCategoriesCurrentPage(newTotalPages);
      }
      
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', color: '#3B82F6' });
      if (editingCategory) {
        setShowCategoriesList(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setCategoryLoading(false);
    }
  };


  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const res = await deleteWithAuth(`/api/document-categories/${id}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      
      const categoriesArray = Array.isArray(categories) ? categories : [];
      setCategories(categoriesArray.filter(cat => cat.id !== id));
      setSuccess('Category deleted successfully!');
      
      // Adjust pagination if needed
      const newTotalPages = Math.ceil((categoriesArray.length - 1) / categoriesPerPage);
      if (categoriesCurrentPage > newTotalPages && newTotalPages > 0) {
        setCategoriesCurrentPage(newTotalPages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    }
  };


  const openCategoriesList = () => {
    setShowCategoriesList(true);
    setCategoriesCurrentPage(1); // Reset to first page when opening
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', color: '#3B82F6' });
    setShowCategoryModal(true);
    setShowCategoriesList(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Loading Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-200 rounded-lg animate-pulse w-12 h-12"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading Content */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-xs font-medium text-gray-900">Loading documents...</p>
              <p className="text-xs text-gray-500">Please wait while we fetch your documents</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <div>
                    <h1 className="text-base font-bold text-gray-900">Document Management</h1>
                    <p className="mt-1 text-xs text-gray-500">
                      Manage your documents and files in one place
                    </p>
                  </div>
                  {getExpiringDocumentsCount() > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="bg-orange-100 border border-orange-200 rounded-lg px-2 py-1">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-orange-800">
                            {getExpiringDocumentsCount()} document{getExpiringDocumentsCount() !== 1 ? 's' : ''} expiring soon
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpiringFilter(true)}
                        className="text-[10px] text-orange-600 hover:text-orange-800 font-medium underline"
                      >
                        View expiring
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={openCategoriesList}
                  className="inline-flex items-center px-2.5 py-1 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  <Icons.Settings />
                  <span className="ml-1.5">Manage Categories</span>
                </button>
                <button
                  onClick={() => setShowFolderModal(true)}
                  className="inline-flex items-center px-2.5 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <Icons.Folder />
                  <span className="ml-1.5">New Folder</span>
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Icons.Plus />
                  <span className="ml-1.5">Add Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        {(currentFolderId !== null || folderPath.length > 0) && (
          <div className="bg-white rounded-lg shadow mb-4 px-4 py-3">
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => navigateToFolder(null)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <Icons.Home />
                <span className="ml-1">Home</span>
              </button>
              {folderPath.map((folder) => (
                <React.Fragment key={folder.id}>
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => navigateToFolder(folder.id)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 hidden">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Icons.Document />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-semibold text-gray-900">{Array.isArray(documents) ? documents.length : 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Icons.Tag />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-semibold text-gray-900">{Array.isArray(categories) ? categories.length : 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Icons.Calendar />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Array.isArray(documents) ? documents.filter(doc => {
                    const docDate = new Date(doc.uploaded_at);
                    const now = new Date();
                    return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
                  }).length : 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Icons.Upload />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Uploads</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Array.isArray(documents) ? documents.filter(doc => {
                    const docDate = new Date(doc.uploaded_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return docDate > weekAgo;
                  }).length : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Icons.Search />
                </div>
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3">
                {/* Items per page selector */}
                <div className="flex items-center space-x-1.5">
                  <label className="text-xs text-gray-600">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Active Filters Indicator */}
                {(category || searchTerm || expiringFilter) && (
                  <div className="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                    <Icons.Filter />
                    <span className="ml-1.5">Filters Active</span>
                  </div>
                )}

                {/* Toggle Filters Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title={showFilters ? 'Hide filters' : 'Show filters'}
                >
                  <Icons.Filter />
                  <span className="ml-1.5">{showFilters ? 'Hide' : 'Show'} Filters</span>
                  {showFilters ? (
                    <Icons.ChevronDown />
                  ) : (
                    <Icons.ChevronRight />
                  )}
                </button>
              </div>
            </div>

            {/* Expiring Documents Alert */}
            {getExpiringDocumentsCount() > 0 && !expiringFilter && (
              <div className="mt-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-orange-800">
                        {getExpiringDocumentsCount()} document{getExpiringDocumentsCount() !== 1 ? 's' : ''} expiring within 30 days
                      </h3>
                      <p className="text-xs text-orange-700">
                        Review and take action on documents that need attention
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => setExpiringFilter(true)}
                      className="px-2.5 py-1 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      View Expiring
                    </button>
                    <button
                      onClick={() => setExpiringFilter(false)}
                      className="px-2.5 py-1 bg-white text-orange-600 text-xs font-medium rounded-lg border border-orange-300 hover:bg-orange-50 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filters - Collapsible */}
            {showFilters && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                  <div className="flex items-center space-x-2">
                    {(category || searchTerm || expiringFilter) && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clear All Filters
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-xs text-gray-600 hover:text-gray-800"
                      title="Hide filters"
                    >
                      <Icons.X />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                      <option value="">All Categories</option>
                      {(Array.isArray(categories) ? categories : []).map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Expiring</label>
                    <select
                      value={expiringFilter ? 'expiring' : ''}
                      onChange={(e) => setExpiringFilter(e.target.value === 'expiring')}
                      className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                      <option value="">All Documents</option>
                      <option value="expiring">Expiring (within 30 days)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'category')}
                      className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                      <option value="date">Upload Date</option>
                      <option value="title">Title</option>
                      <option value="category">Category</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-xs font-medium text-gray-700 mb-3">Folders</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer group"
                    onClick={() => navigateToFolder(folder.id)}
                  >
                    <div className="text-yellow-500 mb-2">
                      <Icons.Folder />
                    </div>
                    <div className="text-[10px] font-medium text-gray-900 text-center truncate w-full" title={folder.name}>
                      {folder.name}
                    </div>
                    <div className="mt-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameFolderModal(folder);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Rename folder"
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete folder"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Section */}
          {!Array.isArray(filteredDocuments) || filteredDocuments.length === 0 ? (
            // Empty State
            <div className="text-center py-8">
              {folders.length === 0 && (
                <>
                  <Icons.Document />
                  <h3 className="mt-3 text-sm font-medium text-gray-900">No documents found</h3>
                  <p className="mt-2 text-xs text-gray-500">
                    {searchTerm || category || expiringFilter
                      ? 'Try adjusting your search or filters'
                      : 'Get started by uploading your first document'}
                  </p>
                  {!searchTerm && !category && !expiringFilter && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-3 inline-flex items-center px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Icons.Plus />
                      <span className="ml-1.5">Upload Document</span>
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            // Table View
            <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th scope="col" className="relative px-3 py-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(currentPageDocuments) && currentPageDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-gray-400 mr-2">
                            {getFileIcon(doc.file_url)}
                          </div>
                          <div>
                            <div className="text-[10px] font-medium text-gray-900">{doc.title}</div>
                            {doc.file_size && (
                              <div className="text-[10px] text-gray-500">{formatFileSize(doc.file_size)}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getCategoryBadgeColor(doc.category)}`}>
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-[10px] text-gray-900 max-w-xs truncate">
                          {doc.description || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">{formatDate(doc.uploaded_at)}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">
                          {formatDateOnly(doc.start_date)}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">
                          {formatDateOnly(doc.end_date)}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] font-medium">
                        <div className="flex space-x-1.5 justify-end">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900 p-0.5 rounded"
                            title="View"
                          >
                            <Icons.Eye />
                          </a>
                          <a
                            href={doc.file_url}
                            download
                            className="text-blue-600 hover:text-blue-900 p-0.5 rounded"
                            title="Download"
                          >
                            <Icons.Download />
                          </a>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-600 hover:text-red-900 p-0.5 rounded"
                            title="Delete"
                          >
                            <Icons.Trash />
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
        </div>

        {/* Pagination */}
        {Array.isArray(filteredDocuments) && filteredDocuments.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-4">
            <div className="px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Results info */}
                <div className="text-xs text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                  {totalPages > 1 && (
                    <span className="ml-2 text-gray-500">
                      (Page {currentPage} of {totalPages})
                    </span>
                  )}
                </div>

                {/* Pagination controls - only show if more than 1 page */}
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    {/* First page button - only show if not on first page */}
                    {currentPage > 1 && (
                      <button
                        onClick={() => setCurrentPage(1)}
                        className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        title="First page"
                      >
                        ««
                      </button>
                    )}

                    {/* Previous button */}
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page numbers */}
                    <div className="flex space-x-1">
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
                            className={`px-2 py-1 text-xs font-medium rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next button */}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>

                    {/* Last page button - only show if not on last page */}
                    {currentPage < totalPages && (
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        title="Last page"
                      >
                        »»
                      </button>
                    )}

                    {/* Go to page input - only show if more than 10 pages */}
                    {totalPages > 10 && (
                      <div className="flex items-center space-x-1.5 ml-3 pl-3 border-l border-gray-300">
                        <span className="text-xs text-gray-600">Go to:</span>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={currentPage}
                          onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (page >= 1 && page <= totalPages) {
                              setCurrentPage(page);
                            }
                          }}
                          className="w-12 px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-xs text-gray-600">of {totalPages}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Upload Document</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Add a new document to your collection
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setTitle('');
                  setModalCategory('');
                  setFile(null);
                  setDescription('');
                  setStartDate('');
                  setEndDate('');
                  setError(null);
                  setSuccess(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={modalLoading}
              >
                <Icons.X />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleModalSubmit} className="px-4 py-4 space-y-4">
              {/* File Upload Section */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  File <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    isDragOver
                      ? 'border-blue-400 bg-blue-50'
                      : file
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  
                  {file ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="text-green-500">
                        {getFileIcon(file.name)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{file.name}</p>
                        <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Icons.Upload />
                      <p className="mt-2 text-xs text-gray-600">
                        <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        PDF, DOC, DOCX, XLS, XLSX, JPG, PNG up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="title" className="block text-xs font-medium text-gray-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                    placeholder="Enter document title"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-xs font-medium text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    required
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                  >
                    <option value="">Select category</option>
                    {(Array.isArray(categories) ? categories : []).map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                    placeholder="Enter document description (optional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 mb-1.5">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <p className="text-xs text-green-600">{success}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setTitle('');
                    setModalCategory('');
                    setFile(null);
                    setDescription('');
                    setStartDate('');
                    setEndDate('');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !title || !modalCategory || !file}
                  className={`px-2.5 py-1 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors ${
                    modalLoading || !title || !modalCategory || !file ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {modalLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                      Uploading...
                    </div>
                  ) : (
                    'Upload Document'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {editingCategory ? 'Update category information' : 'Create a new document category'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setCategoryForm({ name: '', description: '', color: '#3B82F6' });
                  setError(null);
                  if (editingCategory) {
                    setShowCategoriesList(true);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={categoryLoading}
              >
                <Icons.X />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCategorySubmit} className="px-4 py-4 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="categoryName" className="block text-xs font-medium text-gray-700 mb-1.5">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="categoryName"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                    placeholder="Enter category name"
                  />
                </div>

                <div>
                  <label htmlFor="categoryDescription" className="block text-xs font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="categoryDescription"
                    rows={3}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                    placeholder="Enter category description (optional)"
                  />
                </div>

                <div>
                  <label htmlFor="categoryColor" className="block text-xs font-medium text-gray-700 mb-1.5">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      id="categoryColor"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-10 h-8 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs font-mono"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    setCategoryForm({ name: '', description: '', color: '#3B82F6' });
                    setError(null);
                    if (editingCategory) {
                      setShowCategoriesList(true);
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={categoryLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categoryLoading || !categoryForm.name}
                  className={`px-2.5 py-1 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors ${
                    categoryLoading || !categoryForm.name ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {categoryLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                      {editingCategory ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingCategory ? 'Update Category' : 'Create Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List Modal */}
      {showCategoriesList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Document Categories</h3>
                <p className="text-xs text-gray-500 mt-1">Manage your document categories</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={openAddCategoryModal}
                  className="inline-flex items-center px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Icons.Plus />
                  <span className="ml-1.5">Add Category</span>
                </button>
                <button
                  onClick={() => setShowCategoriesList(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icons.X />
                </button>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="px-4 py-4">
              {(!Array.isArray(categories) || categories.length === 0) ? (
                <div className="text-center py-8">
                  <Icons.Tag />
                  <h3 className="mt-3 text-sm font-medium text-gray-900">No categories found</h3>
                  <p className="mt-2 text-xs text-gray-500">Get started by creating your first category</p>
                  <button
                    onClick={openAddCategoryModal}
                    className="mt-3 inline-flex items-center px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Icons.Plus />
                    <span className="ml-1.5">Add Category</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentPageCategories.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: cat.color }}
                          ></div>
                          <h4 className="font-semibold text-gray-900 text-sm">{cat.name}</h4>
                        </div>
                        <div className="flex space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setCategoryForm({
                                name: cat.name,
                                description: cat.description || '',
                                color: cat.color
                              });
                              setShowCategoryModal(true);
                              setShowCategoriesList(false);
                            }}
                            className="text-gray-600 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit Category"
                          >
                            <Icons.Edit />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-gray-600 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete Category"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </div>
                      
                      {cat.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{cat.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>Created: {new Date(cat.created_at).toLocaleDateString()}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          cat.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    ))}
                  </div>

                  {/* Categories Pagination */}
                  {categoriesTotalPages > 1 && (
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {/* Results info */}
                        <div className="text-xs text-gray-700">
                          Showing {categoriesStartIndex + 1} to {Math.min(categoriesEndIndex, categoriesTotalItems)} of {categoriesTotalItems} categories
                        </div>

                        {/* Items per page selector */}
                        <div className="flex items-center space-x-1.5">
                          <label className="text-xs text-gray-600">Show:</label>
                          <select
                            value={categoriesPerPage}
                            onChange={(e) => {
                              setCategoriesPerPage(Number(e.target.value));
                              setCategoriesCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value={3}>3</option>
                            <option value={6}>6</option>
                            <option value={9}>9</option>
                            <option value={12}>12</option>
                            <option value={15}>15</option>
                          </select>
                        </div>

                        {/* Pagination controls */}
                        <div className="flex items-center space-x-1.5">
                          {/* Previous button */}
                          <button
                            onClick={() => setCategoriesCurrentPage(Math.max(1, categoriesCurrentPage - 1))}
                            disabled={categoriesCurrentPage === 1}
                            className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>

                          {/* Page numbers */}
                          <div className="flex space-x-1">
                            {Array.from({ length: Math.min(5, categoriesTotalPages) }, (_, i) => {
                              let pageNum;
                              if (categoriesTotalPages <= 5) {
                                pageNum = i + 1;
                              } else if (categoriesCurrentPage <= 3) {
                                pageNum = i + 1;
                              } else if (categoriesCurrentPage >= categoriesTotalPages - 2) {
                                pageNum = categoriesTotalPages - 4 + i;
                              } else {
                                pageNum = categoriesCurrentPage - 2 + i;
                              }

                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCategoriesCurrentPage(pageNum)}
                                  className={`px-2 py-1 text-xs font-medium rounded-lg ${
                                    categoriesCurrentPage === pageNum
                                      ? 'bg-blue-600 text-white'
                                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>

                          {/* Next button */}
                          <button
                            onClick={() => setCategoriesCurrentPage(Math.min(categoriesTotalPages, categoriesCurrentPage + 1))}
                            disabled={categoriesCurrentPage === categoriesTotalPages}
                            className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Folder Rename Modal */}
      {editingFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Rename Folder</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Change the name of "{editingFolder.name}"
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setEditingFolderName('');
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={folderEditLoading}
              >
                <Icons.X />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRenameFolder} className="px-4 py-4 space-y-4">
              <div>
                <label htmlFor="editFolderName" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="editFolderName"
                  required
                  value={editingFolderName}
                  onChange={(e) => setEditingFolderName(e.target.value)}
                  className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                  placeholder="Enter folder name"
                  autoFocus
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFolder(null);
                    setEditingFolderName('');
                    setError(null);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={folderEditLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={folderEditLoading || !editingFolderName.trim()}
                  className={`px-2.5 py-1 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors ${
                    folderEditLoading || !editingFolderName.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {folderEditLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                      Renaming...
                    </div>
                  ) : (
                    'Rename Folder'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Folder Creation Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Create New Folder</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {currentFolderId ? 'Create a folder inside the current folder' : 'Create a folder in the root'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setFolderName('');
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={folderLoading}
              >
                <Icons.X />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateFolder} className="px-4 py-4 space-y-4">
              <div>
                <label htmlFor="folderName" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="folderName"
                  required
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs"
                  placeholder="Enter folder name"
                  autoFocus
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowFolderModal(false);
                    setFolderName('');
                    setError(null);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={folderLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={folderLoading || !folderName.trim()}
                  className={`px-2.5 py-1 text-xs font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors ${
                    folderLoading || !folderName.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {folderLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Folder'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success/Error Toast Messages */}
      {(success || error) && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`rounded-lg shadow-lg p-4 ${success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              <div className={`text-sm font-medium ${success ? 'text-green-800' : 'text-red-800'}`}>
                {success || error}
              </div>
              <button
                onClick={() => {
                  setSuccess(null);
                  setError(null);
                }}
                className={`ml-3 ${success ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
              >
                <Icons.X />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentListPage;