import React, { useState, useEffect } from 'react';
import { SalesRep, salesService } from '../services/salesService';

interface SalesRepTargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesRep: SalesRep | null;
  onSubmit: (targets: SalesRepTargets) => void;
  loading: boolean;
}

export interface SalesRepTargets {
  salesRepId: number;
  year: number;
  month: number;
  vapesTarget: number;
  pouchesTarget: number;
}

const SalesRepTargetsModal: React.FC<SalesRepTargetsModalProps> = ({
  isOpen,
  onClose,
  salesRep,
  onSubmit,
  loading
}) => {
  const [formData, setFormData] = useState<SalesRepTargets>({
    salesRepId: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    vapesTarget: 0,
    pouchesTarget: 0
  });

  const [existingTargets, setExistingTargets] = useState<SalesRepTargets[]>([]);
  const [editingTarget, setEditingTarget] = useState<SalesRepTargets | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    if (isOpen && salesRep) {
      setFormData(prev => ({
        ...prev,
        salesRepId: salesRep.id,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        vapesTarget: 0,
        pouchesTarget: 0
      }));
      // Fetch existing targets for this sales rep
      fetchExistingTargets();
    }
  }, [isOpen, salesRep]);

  const fetchExistingTargets = async () => {
    if (!salesRep) return;
    try {
      const targets = await salesService.getSalesRepTargets(salesRep.id);
      console.log('Fetched targets:', targets);
      setExistingTargets(targets);
    } catch (error) {
      console.error('Failed to fetch existing targets:', error);
      setExistingTargets([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.vapesTarget <= 0 && formData.pouchesTarget <= 0) {
      alert('Please set at least one target value greater than 0');
      return;
    }
    onSubmit(formData);
  };

  const handleEditTarget = (target: SalesRepTargets) => {
    setEditingTarget(target);
    setIsEditMode(true);
    setFormData({
      salesRepId: target.salesRepId,
      year: target.year,
      month: target.month,
      vapesTarget: target.vapesTarget,
      pouchesTarget: target.pouchesTarget
    });
  };

  const handleCancelEdit = () => {
    setEditingTarget(null);
    setIsEditMode(false);
    setFormData({
      salesRepId: salesRep?.id || 0,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      vapesTarget: 0,
      pouchesTarget: 0
    });
  };

  const handleDeleteTarget = async (targetId: number) => {
    if (!confirm('Are you sure you want to delete this target?')) return;
    
    try {
      await salesService.deleteSalesRepTarget(targetId);
      // Refresh the existing targets
      await fetchExistingTargets();
    } catch (error) {
      console.error('Failed to delete target:', error);
      alert('Failed to delete target. Please try again.');
    }
  };

  const handleClose = () => {
    setFormData({
      salesRepId: 0,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      vapesTarget: 0,
      pouchesTarget: 0
    });
    setExistingTargets([]);
    setEditingTarget(null);
    setIsEditMode(false);
    onClose();
  };

  if (!isOpen || !salesRep) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Target' : 'Set Targets'} for {salesRep.name}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month *
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vapes Target
              </label>
              <input
                type="number"
                min="0"
                value={formData.vapesTarget}
                onChange={(e) => setFormData({ ...formData, vapesTarget: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter vapes target"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pouches Target
              </label>
              <input
                type="number"
                min="0"
                value={formData.pouchesTarget}
                onChange={(e) => setFormData({ ...formData, pouchesTarget: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter pouches target"
              />
            </div>
          </div>

          {/* Display existing targets for the selected year */}
          {existingTargets && existingTargets.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Existing Targets for {formData.year}
                {isEditMode && editingTarget && (
                  <span className="ml-2 text-sm text-blue-600 font-normal">
                    (Editing {months.find(m => m.value === editingTarget.month)?.name} {editingTarget.year})
                  </span>
                )}
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-6 gap-4 text-sm">
                  <div className="font-medium">Month</div>
                  <div className="font-medium">Vapes</div>
                  <div className="font-medium">Pouches</div>
                  <div className="font-medium">Total</div>
                  <div className="font-medium">Actions</div>
                  <div></div>
                  {existingTargets
                    .filter(target => target.year === formData.year)
                    .sort((a, b) => a.month - b.month)
                    .map(target => {
                      const isCurrentlyEditing = editingTarget && editingTarget.id === target.id;
                      return (
                        <React.Fragment key={`${target.year}-${target.month}`}>
                          <div className={isCurrentlyEditing ? 'bg-blue-100 font-medium' : ''}>
                            {months.find(m => m.value === target.month)?.name}
                          </div>
                          <div className={isCurrentlyEditing ? 'bg-blue-100 font-medium' : ''}>
                            {(target.vapesTarget || 0).toLocaleString()}
                          </div>
                          <div className={isCurrentlyEditing ? 'bg-blue-100 font-medium' : ''}>
                            {(target.pouchesTarget || 0).toLocaleString()}
                          </div>
                          <div className={`font-medium ${isCurrentlyEditing ? 'bg-blue-100' : ''}`}>
                            {((target.vapesTarget || 0) + (target.pouchesTarget || 0)).toLocaleString()}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditTarget(target)}
                              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
                              disabled={isEditMode}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTarget(target.id!)}
                              className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                              disabled={isEditMode}
                            >
                              Delete
                            </button>
                          </div>
                          <div></div>
                        </React.Fragment>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            {isEditMode ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel Edit
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Target'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Set Target'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesRepTargetsModal;
