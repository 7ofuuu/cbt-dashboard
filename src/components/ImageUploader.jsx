'use client';

/**
 * ImageUploader - file picker + preview + URL fallback.
 *
 * On file pick, posts to `/api/upload/<bucket>` and reports the returned URL
 * via onChange. The "value" is whatever the parent stores in DB (a path like
 * `/uploads/logos/xxx.png` or any absolute URL). For preview, paths beginning
 * with `/uploads` are prefixed with the backend origin so the image resolves
 * even though the dashboard runs on a different port.
 */
import { useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import request from '@/utils/request';
import toast from 'react-hot-toast';

// Resolve a stored URL into something an <img> tag can fetch.
// - Absolute (http/https/data:) -> as-is
// - "/uploads/..." path -> prefix with the API origin (strip trailing "/api/")
export const resolvePreviewUrl = (value) => {
  if (!value) return '';
  if (/^(https?:|data:)/i.test(value)) return value;
  if (value.startsWith('/uploads')) {
    const base = process.env.NEXT_PUBLIC_HOST || '';
    // NEXT_PUBLIC_HOST is "http://host:3000/api/" - strip "/api/" for static
    const origin = base.replace(/\/api\/?$/, '');
    return `${origin}${value}`;
  }
  return value;
};

export default function ImageUploader({
  value,
  onChange,
  bucket = 'logo', // 'logo' | 'question-image'
  label = 'Gambar',
  hint = 'PNG, JPG, WEBP atau GIF (maks 5MB)',
  previewClassName = 'w-20 h-20',
  allowUrlInput = true,
}) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const previewSrc = resolvePreviewUrl(value);
  const showImage = !!previewSrc && !previewError;

  const handlePick = () => fileRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-uploading the same filename
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran maksimal 5MB');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await request.postMultipart(`/upload/${bucket}`, { file });
      const url = res?.data?.url;
      if (!url) throw new Error('Server did not return a URL');
      setPreviewError(false);
      onChange?.(url);
      toast.success('Gambar berhasil diunggah');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal mengunggah gambar');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange?.('');
    setPreviewError(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className={`shrink-0 ${previewClassName} rounded-xl border-2 ${showImage ? 'border-violet-200 bg-white' : 'border-dashed border-gray-200 bg-gray-50'} overflow-hidden flex items-center justify-center shadow-sm`}>
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={label}
              className="max-w-full max-h-full object-contain"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <ImageIcon className="w-7 h-7 text-gray-300" />
          )}
        </div>

        {/* Actions */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handlePick}
              disabled={uploading}
              className="gap-1.5"
            >
              {uploading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah...</>
              ) : (
                <><Upload className="w-3.5 h-3.5" /> {value ? 'Ganti' : 'Unggah'} Gambar</>
              )}
            </Button>
            {value && !uploading && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleRemove}
                className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-3.5 h-3.5" /> Hapus
              </Button>
            )}
          </div>
          <p className="text-[11px] text-gray-500">{hint}</p>
          {value && previewError && (
            <p className="text-[11px] text-amber-600">Pratinjau gagal dimuat - periksa URL.</p>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {/* URL fallback (optional) - for pasting external links */}
      {allowUrlInput && (
        <div className="space-y-1.5">
          <Label className="text-[11px] text-gray-500 flex items-center gap-1">
            <Link2 className="w-3 h-3" /> atau tempel URL eksternal
          </Label>
          <Input
            value={value || ''}
            onChange={(e) => { setPreviewError(false); onChange?.(e.target.value); }}
            placeholder="https://... atau /uploads/logos/xxx.png"
            className="h-9 text-xs"
          />
        </div>
      )}
    </div>
  );
}
