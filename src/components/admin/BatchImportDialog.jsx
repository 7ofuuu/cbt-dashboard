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
import request from '@/utils/request';
import toast from 'react-hot-toast';

export default function BatchImportDialog({ open, onOpenChange, role = 'siswa', onSuccess }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [duplicatePreview, setDuplicatePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setResult(null);
        setUploadProgress(0);
        
        // Start progress simulation
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
        
        // Check for duplicates
        try {
          const text = await selectedFile.text();
          const users = parseCSV(text);
          
          // Get existing usernames from backend
          const response = await request.get('/users');
          const existingUsernames = response.data.users?.map(u => u.username.toLowerCase()) || [];
          
          // Check duplicates
          const duplicates = users.filter(user => 
            existingUsernames.includes(user.username?.toLowerCase())
          );
          
          if (duplicates.length > 0) {
            setDuplicatePreview({
              total: users.length,
              duplicates: duplicates.length,
              usernames: duplicates.map(u => u.username).slice(0, 5) // Show first 5
            });
          } else {
            setDuplicatePreview(null);
          }
        } catch (error) {
          console.error('Error checking duplicates:', error);
        }
        
        clearInterval(progressInterval);
        setUploadProgress(100);
      } else {
        toast.error('Format file tidak valid. Gunakan CSV atau Excel.');
      }
    }
  };

  const downloadTemplate = () => {
    let csvContent = '';
    
    if (role === 'siswa') {
      csvContent = 'nama,username,password,kelas,tingkat,jurusan\n';
      csvContent += 'Contoh Siswa 1,siswa001,password123,A,12,IPA\n';
      csvContent += 'Contoh Siswa 2,siswa002,password123,B,12,IPS\n';
    } else if (role === 'guru') {
      csvContent = 'nama,username,password\n';
      csvContent += 'Contoh Guru 1,guru001,password123\n';
      csvContent += 'Contoh Guru 2,guru002,password123\n';
    } else if (role === 'admin') {
      csvContent = 'nama,username,password\n';
      csvContent += 'Contoh Admin 1,admin001,password123\n';
      csvContent += 'Contoh Admin 2,admin002,password123\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_${role}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Template berhasil didownload!');
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length && values[0]) {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        data.push(obj);
      }
    }

    return data;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Pilih file terlebih dahulu!');
      return;
    }

    setImporting(true);
    setResult(null);
    setUploadProgress(0);

    try {
      const text = await file.text();
      const users = parseCSV(text);

      if (users.length === 0) {
        toast.error('File kosong atau format tidak valid!');
        setImporting(false);
        return;
      }

      // Validate required fields based on role
      const requiredFields = role === 'siswa' 
        ? ['nama', 'username', 'password', 'kelas', 'tingkat', 'jurusan']
        : ['nama', 'username', 'password'];

      const invalidUsers = users.filter(user => 
        !requiredFields.every(field => user[field])
      );

      if (invalidUsers.length > 0) {
        toast.error(`${invalidUsers.length} baris memiliki data tidak lengkap!`);
        setImporting(false);
        return;
      }

      // Send batch request with progress simulation
      setUploadProgress(50);
      const response = await request.post('/users/batch', {
        users: users.map(user => ({
          ...user,
          role
        }))
      });
      setUploadProgress(100);

      const { success, failed, total } = response.data;
      
      setResult({
        success: success || 0,
        failed: failed || 0,
        total: total || users.length
      });

      if (failed === 0) {
        toast.success(`Berhasil menambahkan ${success} pengguna!`);
        onSuccess?.();
      } else {
        toast.error(`${success} berhasil, ${failed} gagal`);
      }

    } catch (error) {
      console.error('Import error:', error);
      toast.error(error?.response?.data?.error || 'Gagal import pengguna');
      setResult(null);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setDuplicatePreview(null);
    setUploadProgress(0);
    setShowPreview(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Pengguna {role.charAt(0).toUpperCase() + role.slice(1)} (Batch)</DialogTitle>
          <DialogDescription>
            Upload file CSV atau Excel untuk menambahkan banyak pengguna sekaligus
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
                  Download template CSV untuk mempermudah import data
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
                  Format: CSV atau Excel (.xlsx)
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {file && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {file.name}
                  </p>
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

          {/* Duplicate Detection Preview */}
          {duplicatePreview && duplicatePreview.duplicates > 0 && (
            <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">Duplikat Terdeteksi</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Ditemukan <span className="font-semibold">{duplicatePreview.duplicates}</span> username yang sudah terdaftar dari total <span className="font-semibold">{duplicatePreview.total}</span> pengguna
                  </p>
                  
                  {/* Toggle detail button */}
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-yellow-700 underline mt-2 hover:text-yellow-800"
                  >
                    {showPreview ? 'Sembunyikan detail' : 'Lihat detail'}
                  </button>
                  
                  {/* Detail list */}
                  {showPreview && (
                    <div className="mt-3 bg-white rounded p-2 border border-yellow-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Username yang sudah terdaftar:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {duplicatePreview.usernames.map((username, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                            <span>{username}</span>
                          </li>
                        ))}
                        {duplicatePreview.duplicates > 5 && (
                          <li className="text-gray-500 italic">... dan {duplicatePreview.duplicates - 5} lainnya</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <p className="text-xs text-yellow-700 mt-3">
                    ⚠️ Username duplikat akan <span className="font-semibold">gagal ditambahkan</span> saat import.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`border rounded-lg p-4 ${
              result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
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
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 font-medium mb-2">Petunjuk:</p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Download template terlebih dahulu</li>
              <li>Isi data sesuai kolom yang tersedia</li>
              <li>Username harus unik (tidak boleh sama)</li>
              <li>Password minimal 6 karakter</li>
              {role === 'siswa' && (
                <>
                  <li>Jurusan: IPA atau IPS</li>
                  <li>Tingkat: X, XI, atau XII</li>
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
