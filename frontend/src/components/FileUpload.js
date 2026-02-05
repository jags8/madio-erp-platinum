import React, { useState } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

export const FileUpload = ({ 
  entityType, 
  entityId, 
  folder = "CRM_Documents",
  onUploadSuccess,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = "*"
}) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    if (selectedFile.size > maxSize) {
      setError(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`);
      return;
    }
    
    setFile(selectedFile);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (entityType) formData.append('linked_entity_type', entityType);
    if (entityId) formData.append('linked_entity_id', entityId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });
      
      setFile(null);
      setProgress(0);
      if (onUploadSuccess) onUploadSuccess(response.data);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <div className="flex flex-col items-center">
        {!file ? (
          <>
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <label className="cursor-pointer">
              <span className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
                Choose File
              </span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={acceptedTypes}
                disabled={uploading}
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Max size: {(maxSize / 1024 / 1024).toFixed(0)}MB
            </p>
          </>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <File className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium truncate">{file.name}</span>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-gray-600"
                disabled={uploading}
              >
                <X size={20} />
              </button>
            </div>
            
            {uploading && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">{progress}%</p>
              </div>
            )}
            
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload to SharePoint'}
            </button>
          </div>
        )}
        
        {error && (
          <div className="flex items-center gap-2 text-red-600 mt-4">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
