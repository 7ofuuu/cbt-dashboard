'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Download, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import request from '@/utils/request';
import { downloadFile } from '@/utils/downloadFile';

export default function BatchImportDialog({ open, onOpenChange, role = 'student', onSuccess }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const isXlsx = selectedFile.name.toLowerCase().endsWith('.xlsx');
    if (!isXlsx) {
      toast.error('Format file tidak valid. Gunakan file Excel (.xlsx).');
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setUploadProgress(0);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setResult(null);
    setUploadProgress(0);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const downloadTemplate = async () => {
    try {
      await downloadFile(`/users/import/template?role=${role}`, `template_${role}.xlsx`);
      toast.success('Template berhasil didownload!');
    } catch {
      toast.error('Gagal mengunduh template');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Pilih file terlebih dahulu!');
      return;
    }

    setImporting(true);
    setResult(null);
    setUploadProgress(50);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('role', role);

      const response = await request.post('/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadProgress(100);

      const { success, failed, total, errors: errorDetails } = response.data;

      setResult({
        success: success || 0,
        failed: failed || 0,
        total: total || 0,
        errors: errorDetails || [],
      });

      if (!failed) {
        toast.success(`Berhasil menambahkan ${success} pengguna!`);
        onSuccess?.();
      } else {
        toast.error(`${success} berhasil, ${failed} gagal`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Gagal import pengguna');
      setResult(null);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setUploadProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Pengguna {role.charAt(0).toUpperCase() + role.slice(1)} (Batch)</DialogTitle>
          <DialogDescription>
            Upload file Excel (.xlsx) untuk menambahkan banyak pengguna sekaligus
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Download Template */}
          <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Download Template</p>
                <p className="text-xs text-gray-500 mt-1">
                  Download template Excel untuk mempermudah import data
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="mt-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="border border-dashed border-gray-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Upload className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Upload File</p>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  Format: Excel (.xlsx)
                </p>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {file && (
                  <div className="mt-2 flex items-center justify-between bg-gray-100 rounded px-3 py-2">
                    <p className="text-xs text-gray-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      {file.name}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Hapus
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {file && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`border rounded-lg p-4 ${result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
              <div className="flex items-start gap-3">
                {result.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Hasil Import</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{result.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Berhasil:</span>
                      <span className="font-medium text-green-600">{result.success}</span>
                    </div>
                    {result.failed > 0 && (
                      <div className="flex justify-between">
                        <span className="text-red-600">Gagal:</span>
                        <span className="font-medium text-red-600">{result.failed}</span>
                      </div>
                    )}
                  </div>
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3 bg-white rounded p-2 border border-red-200 max-h-32 overflow-y-auto">
                      <p className="text-xs font-medium text-gray-700 mb-1">Detail error:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {result.errors.slice(0, 10).map((err, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <XCircle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />
                            <span><strong>{err.username}</strong>: {err.error}</span>
                          </li>
                        ))}
                        {result.errors.length > 10 && (
                          <li className="text-gray-500 italic">... dan {result.errors.length - 10} error lainnya</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 font-medium mb-2">Petunjuk:</p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Download template terlebih dahulu</li>
              <li>Isi data sesuai kolom yang tersedia, jangan ubah baris header</li>
              <li>Username harus unik (tidak boleh sama)</li>
              <li>Password minimal 6 karakter</li>
              {role === 'student' && (
                <>
                  <li>Format classroom: TINGKAT-JURUSAN-NOMOR (contoh: X-IPA-1, XI-IPS-2)</li>
                  <li>Jurusan: IPA, IPS, atau Bahasa</li>
                  <li>Tingkat: X, XI, atau XII</li>
                </>
              )}
              {role === 'teacher' && (
                <>
                  <li>Kolom subject wajib diisi (contoh: Matematika, Fisika)</li>
                  <li>Kolom is_coordinator opsional (true/false)</li>
                  <li>Kolom nip opsional, tetapi jika diisi harus unik (tidak boleh sama antar guru atau dengan guru yang sudah ada)</li>
                  <li>Ganti nilai contoh nip pada template dengan NIP asli masing-masing guru</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Tutup
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {importing ? 'Mengimport...' : 'Import Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
