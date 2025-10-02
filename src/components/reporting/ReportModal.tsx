'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertTriangle, Upload, FileText } from 'lucide-react';
import { REPORT_TYPES } from '@/lib/types';
import toast from 'react-hot-toast';

const reportSchema = z.object({
  report_type: z.enum(['scam', 'inappropriate_content', 'fake_listing', 'spam', 'safety_concern', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedItemId?: string;
  reportedUserId?: string;
  reportedUserName?: string;
  reportedItemTitle?: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  reportedItemId,
  reportedUserId,
  reportedUserName,
  reportedItemTitle,
}: ReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          reported_item_id: reportedItemId,
          reported_user_id: reportedUserId,
          evidence_urls: [], // TODO: Upload files to storage
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Report submitted successfully');
        onClose();
        reset();
      } else {
        toast.error(result.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (evidenceFiles.length + validFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setEvidenceFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-medium max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Report Issue</h2>
              <p className="text-sm text-gray-600">
                Help us keep MyBazaar safe and trustworthy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Reported Content Info */}
          {(reportedItemTitle || reportedUserName) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-2">Reporting:</h3>
              {reportedItemTitle && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Item:</span> {reportedItemTitle}
                </p>
              )}
              {reportedUserName && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">User:</span> {reportedUserName}
                </p>
              )}
            </div>
          )}

          {/* Report Type */}
          <div>
            <label htmlFor="report_type" className="block text-sm font-medium text-gray-700 mb-2">
              What's the issue? *
            </label>
            <select
              {...register('report_type')}
              id="report_type"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors appearance-none"
            >
              <option value="">Select an issue type</option>
              {REPORT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            {errors.report_type && (
              <div className="flex items-center mt-2 text-sm text-error">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.report_type.message}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Please provide details *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                {...register('description')}
                id="description"
                rows={4}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                placeholder="Describe the issue in detail. Include any relevant information that would help us investigate..."
              />
            </div>
            {errors.description && (
              <div className="flex items-center mt-2 text-sm text-error">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.description.message}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {watch('description')?.length || 0}/1000 characters
            </p>
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
              <input
                type="file"
                id="evidence"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="evidence" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Upload screenshots or files</p>
                <p className="text-xs text-gray-500">Up to 5 files, 10MB each</p>
              </label>
            </div>

            {/* File List */}
            {evidenceFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {evidenceFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner w-4 h-4"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}