import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const UploadDocumentPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get('staff_id');
  const staffName = searchParams.get('staff_name');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    if (!title || !category || !file) {
      setError('Title, category, and file are required.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('file', file);
    formData.append('description', description);
    
    try {
      let res;
      if (staffId) {
        // Upload employee document
        res = await fetch(`/api/staff/${staffId}/documents`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Upload general document
        res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });
      }
      
      if (!res.ok) throw new Error('Failed to upload document');
      setSuccess('Document uploaded successfully!');
      setTitle('');
      setFile(null);
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">
        {staffId && staffName ? `Upload Document for ${staffName}` : 'Upload Document'}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title<span className="text-red-500">*</span></label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category<span className="text-red-500">*</span></label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
          >
            <option value="">Select category</option>
            <option value="Contract">Contract</option>
            <option value="Agreement">Agreement</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File<span className="text-red-500">*</span></label>
          <input
            type="file"
            className="border rounded px-3 py-2 w-full"
            onChange={e => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="border rounded px-3 py-2 w-full"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex gap-2 items-center">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            type="button"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
        {success && <div className="text-green-600 font-medium mt-2">{success}</div>}
        {error && <div className="text-red-600 font-medium mt-2">{error}</div>}
      </form>
    </div>
  );
};

export default UploadDocumentPage; 