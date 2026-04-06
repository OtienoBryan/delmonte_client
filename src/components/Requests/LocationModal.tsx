import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  requestId: string;
}

const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  latitude,
  longitude,
  requestId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Current Location - Request #{requestId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="h-[500px] w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Location Information</h3>
            <p className="text-gray-600">This feature is not available in the financial system.</p>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>Request ID: {requestId}</p>
          <p className="text-yellow-600 mt-2">
            Note: Location tracking is not part of the financial management system.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationModal; 