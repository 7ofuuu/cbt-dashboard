import request from '@/utils/request';

// Unduh file biner dari endpoint backend lewat axios instance (token ikut otomatis).
export async function downloadFile(path, fallbackName = 'download.xlsx') {
  const res = await request.get(path, { responseType: 'blob' });

  let filename = fallbackName;
  const cd = res.headers?.['content-disposition'];
  if (cd) {
    const match = cd.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }

  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Jika respons error datang sebagai blob, ekstrak pesan { error }.
export async function readBlobError(error) {
  try {
    const text = await error?.response?.data?.text?.();
    if (text) {
      const json = JSON.parse(text);
      return json?.error || json?.message || null;
    }
  } catch { /* abaikan */ }
  return null;
}
