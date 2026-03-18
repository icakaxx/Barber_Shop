'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { useI18n } from '@/contexts/I18nContext';

export type ImageUploadType = 'logo' | 'hero' | 'barber-profile';

const COMPRESSION_CONFIG: Record<ImageUploadType, { maxSizeMB: number; maxWidthOrHeight: number }> = {
  logo: { maxSizeMB: 0.1, maxWidthOrHeight: 400 },
  hero: { maxSizeMB: 0.2, maxWidthOrHeight: 1920 },
  'barber-profile': { maxSizeMB: 0.15, maxWidthOrHeight: 400 }
};

function formatKb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

interface ImageUploadFieldProps {
  type: ImageUploadType;
  value: string;
  onChange: (url: string) => void;
  entityId: string;
  label: string;
  helpText?: string;
  placeholder?: string;
  className?: string;
}

export default function ImageUploadField({
  type,
  value,
  onChange,
  entityId,
  label,
  helpText,
  placeholder,
  className = ''
}: ImageUploadFieldProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [uploadedSize, setUploadedSize] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [urlFallback, setUrlFallback] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = COMPRESSION_CONFIG[type];

  useEffect(() => {
    setPreviewError(false);
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP)');
      return;
    }

    setError(null);
    setUploading(true);
    const originalKb = formatKb(file.size);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: config.maxSizeMB,
        maxWidthOrHeight: config.maxWidthOrHeight,
        useWebWorker: true
      });

      const compressedKb = formatKb(compressed.size);
      setCompressionInfo(originalKb !== compressedKb ? `Original: ${originalKb} → Compressed: ${compressedKb}` : `Size: ${compressedKb}`);

      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('type', type);
      formData.append('entityId', entityId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      const { url } = await response.json();
      onChange(url);
      setUploadedSize(compressedKb);
      setPreviewError(false);
      setShowUrlInput(false);
      setUrlFallback('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUrlSubmit = () => {
    const trimmed = urlFallback.trim();
    if (trimmed) {
      onChange(trimmed);
      setUploadedSize(null);
      setCompressionInfo(null);
      setPreviewError(false);
      setShowUrlInput(false);
      setUrlFallback('');
      setError(null);
    }
  };

  const handleRemove = () => {
    onChange('');
    setUploadedSize(null);
    setCompressionInfo(null);
    setPreviewError(false);
    setUrlFallback('');
    setError(null);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>

      <div className="space-y-3">
        {/* Current image preview */}
        {value && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center ${
                  type === 'logo' ? 'w-24 h-12' : type === 'hero' ? 'w-40 h-24' : 'w-16 h-16'
                }`}
              >
                {previewError ? (
                  <div className="text-center p-2">
                    <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-500 block">{t('dashboard.owner.previewUnavailable')}</span>
                  </div>
                ) : (
                  <img
                    src={value}
                    alt="Preview"
                    className={`object-cover w-full h-full ${type === 'logo' ? 'object-contain' : ''}`}
                    onError={() => setPreviewError(true)}
                    onLoad={() => setPreviewError(false)}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {uploadedSize && (
                  <p className="text-xs font-medium text-green-600 mb-1">
                    Uploaded: {uploadedSize}
                  </p>
                )}
                {compressionInfo && (
                  <p className="text-xs text-gray-500 mb-1">
                    {compressionInfo}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload / URL toggle */}
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Compressing & uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload image
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            {showUrlInput ? 'Cancel' : 'Or paste URL'}
          </button>
        </div>

        {/* URL fallback input */}
        {showUrlInput && (
          <div className="flex gap-2">
            <input
              type="url"
              value={urlFallback}
              onChange={(e) => setUrlFallback(e.target.value)}
              placeholder={placeholder || 'https://example.com/image.jpg'}
              className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90"
            >
              Use URL
            </button>
          </div>
        )}

        {helpText && (
          <p className="text-xs text-gray-500">{helpText}</p>
        )}

        {previewError && value && (
          <p className="text-xs text-amber-600">
            {t('dashboard.owner.previewFailedHint')}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
