# Batch User Import - Documentation

## Overview
Fitur batch import memungkinkan admin menambahkan banyak pengguna sekaligus menggunakan file CSV atau Excel.

## Features
- ✅ Upload CSV/Excel untuk batch import
- ✅ Template download otomatis
- ✅ Validasi data real-time
- ✅ **Progress bar upload** dengan indikator visual
- ✅ **Duplicate detection preview** untuk mendeteksi username yang sudah terdaftar
- ✅ Progress tracking (berhasil/gagal)
- ✅ Error reporting detail
- ✅ Support untuk Admin, Guru, dan Siswa
- ✅ **Restricted to Admin only** - Hanya admin yang bisa batch import

## Backend Implementation

### Endpoint
```
POST /api/users/batch
```

### Headers
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "users": [
    {
      "nama": "Siswa 1",
      "username": "siswa001",
      "password": "password123",
      "role": "siswa",
      "kelas": "A",
      "tingkat": "12",
      "jurusan": "IPA"
    },
    {
      "nama": "Guru 1",
      "username": "guru001",
      "password": "password123",
      "role": "guru"
    }
  ]
}
```

### Response Success
```json
{
  "message": "Batch import selesai",
  "success": 10,
  "failed": 2,
  "total": 12,
  "errors": [
    {
      "username": "siswa999",
      "error": "Username sudah digunakan"
    },
    {
      "username": "siswa888",
      "error": "Data tidak lengkap"
    }
  ]
}
```

### Validation Rules

**All Roles:**
- `nama`: Required
- `username`: Required, min 4 characters, must be unique
- `password`: Required, min 6 characters
- `role`: Required, must be 'admin', 'guru', or 'siswa'

**Siswa Additional:**
- `kelas`: Required
- `tingkat`: Required (X, XI, XII)
- `jurusan`: Required (IPA, IPS)

## Frontend Implementation

### Component: BatchImportDialog
**Location:** `src/components/admin/BatchImportDialog.jsx`

### Usage
```jsx
import BatchImportDialog from '@/components/admin/BatchImportDialog';

<BatchImportDialog
  open={showBatchImport}
  onOpenChange={setShowBatchImport}
  role="siswa" // 'admin', 'guru', or 'siswa'
  onSuccess={() => {
    toast.success('Import berhasil!');
  }}
/>
```

### Props
| Prop | Type | Description |
|------|------|-------------|
| open | boolean | Dialog visibility state |
| onOpenChange | function | Callback when dialog state changes |
| role | string | User role to import ('admin', 'guru', 'siswa') |
| onSuccess | function | Callback when import succeeds |

## CSV Template Format

### Siswa Template
```csv
nama,username,password,kelas,tingkat,jurusan
Siswa 1,siswa001,password123,A,12,IPA
Siswa 2,siswa002,password123,B,12,IPS
Siswa 3,siswa003,password123,A,11,IPA
```

### Guru Template
```csv
nama,username,password
Guru 1,guru001,password123
Guru 2,guru002,password123
Guru 3,guru003,password123
```

### Admin Template
```csv
nama,username,password
Admin 1,admin001,password123
Admin 2,admin002,password123
```

## User Flow

1. **Login as Admin**: Hanya admin yang memiliki akses ke fitur batch import
2. **Open Dialog**: Click "Import CSV/Excel" button (hanya muncul untuk admin)
3. **Download Template**: Click download template button
4. **Fill Data**: Edit CSV file with user data
5. **Upload File**: Select and upload filled CSV file
6. **View Progress**: Progress bar menampilkan status upload (0-100%)
7. **Duplicate Detection**: Sistem otomatis mendeteksi username yang sudah terdaftar
8. **Review Duplicates**: Klik "Lihat detail" untuk melihat username yang duplikat
9. **Import**: Click "Import Data" to process (username duplikat akan di-skip)
10. **Review Results**: See success/failed count with details

## Error Handling

### Common Errors

1. **Username Already Exists**
   ```json
   {
     "username": "siswa001",
     "error": "Username sudah digunakan"
   }
   ```

2. **Incomplete Data**
   ```json
   {
     "username": "siswa002",
     "error": "Data tidak lengkap"
   }
   ```

3. **Siswa Missing Fields**
   ```json
   {
     "username": "siswa003",
     "error": "Data siswa tidak lengkap (kelas, tingkat, jurusan)"
   }
   ```

4. **Invalid File Format**
   - Toast: "Format file tidak valid. Gunakan CSV atau Excel."

5. **Empty File**
   - Toast: "File kosong atau format tidak valid!"

## Features Detail

### 1. Template Download
- Auto-generates CSV template based on role
- Includes example data
- One-click download

### 2. File Upload
- Accepts: `.csv`, `.xlsx`, `.xls`
- Client-side file type validation
- Shows selected filename

### 3. Progress Bar During Upload
- **Visual progress indicator** (0-100%)
- Real-time percentage display
- Smooth animation with CSS transitions
- Shows "Uploading..." status text
- Auto-completes when file is parsed
- Blue progress bar with gray background

### 4. Duplicate Detection Preview
- **Automatic duplicate checking** when file is uploaded
- Compares uploaded usernames with existing database
- Displays summary: total users vs. duplicates found
- **Expandable detail view** - Click "Lihat detail" to see list
- Shows first 5 duplicate usernames
- Visual indicators with warning icon (⚠️)
- Color-coded: yellow for warnings
- Clear message that duplicates will fail
- Prevents user confusion before import

### 5. CSV Parsing
- Reads CSV headers
- Maps data to objects
- Filters empty lines
- Validates column count

### 6. Real-time Validation
- Required fields check
- Role-specific fields check
- Username uniqueness check (backend)

### 7. Batch Processing
- Processes users sequentially
- Continues on individual errors
- Collects all errors
- Returns detailed results

### 8. Result Display
- Total users processed
- Success count (green)
- Failed count (red/yellow)
- Color-coded UI feedback

### 9. Admin-Only Access
- **Restricted to admin role only**
- Button tidak muncul untuk guru atau siswa
- Backend endpoint protected dengan `checkRole('admin')`
- Unauthorized users cannot access batch import

## UI Components

### Dialog Layout
```
┌──────────────────────────────────────┐
│  Import Pengguna Admin (Batch)      │
│──────────────────────────────────────│
│                                      │
│  📥 Download Template                │
│  [Download Template Button]          │
│                                      │
│  📤 Upload File                      │
│  [File Input]                        │
│  ✓ filename.csv                      │
│                                      │
│  📊 Progress Bar (if uploading)      │
│  Uploading...               45%      │
│  ████████░░░░░░░░░░░░                │
│                                      │
│  ⚠️ Duplikat Terdeteksi (if any)     │
│  Ditemukan 3 username yang sudah     │
│  terdaftar dari total 10 pengguna    │
│  [Lihat detail ▼]                    │
│    • admin001 ✗                      │
│    • admin002 ✗                      │
│    • admin003 ✗                      │
│  ⚠️ Username duplikat akan gagal     │
│                                      │
│  📊 Hasil Import                     │
│  Total: 10                           │
│  Berhasil: 7 ✓                       │
│  Gagal: 3 ✗                          │
│                                      │
│  ℹ️ Petunjuk:                        │
│  • Download template terlebih...     │
│  • Isi data sesuai kolom...          │
│                                      │
│           [Tutup] [Import Data]      │
└──────────────────────────────────────┘
```

### Progress Bar Component
- **Width**: Full container width
- **Height**: 8px (h-2)
- **Colors**: 
  - Background: Gray (bg-gray-200)
  - Progress: Blue (bg-blue-600)
- **Animation**: Smooth transition (transition-all duration-300)
- **Text Display**: 
  - Left: "Uploading..."
  - Right: Percentage (e.g., "45%")

### Duplicate Preview Component
- **Background**: Yellow-50 with yellow-300 border
- **Icon**: AlertCircle (warning icon)
- **Header**: "Duplikat Terdeteksi"
- **Summary**: Shows count of duplicates vs total
- **Toggle Button**: "Lihat detail" / "Sembunyikan detail"
- **Detail View** (expandable):
  - White background with yellow border
  - List of duplicate usernames (max 5 shown)
  - XCircle icon for each duplicate
  - "... dan X lainnya" if more than 5
- **Warning Message**: Username duplikat will fail

### Button States
- **Default**: "Import Data" (enabled when file selected)
- **Loading**: "Mengimport..." (disabled)
- **Disabled**: No file selected
- **Admin Only**: Button only visible for admin role

## Testing

### Test Cases

1. **Valid Data - All Success**
   - Upload CSV with all valid data
   - Expected: All users created, success = total

2. **Duplicate Username**
   - Upload CSV with existing username
   - Expected: Specific user fails, others succeed

3. **Missing Required Fields**
   - Upload CSV with incomplete data
   - Expected: Incomplete rows fail with error message

4. **Mixed Results**
   - Upload CSV with mix of valid/invalid data
   - Expected: Valid users created, invalid reported

5. **Empty File**
   - Upload empty CSV
   - Expected: Error toast "File kosong"

6. **Invalid File Type**
   - Upload .txt or .pdf file
   - Expected: Error toast "Format file tidak valid"

7. **Progress Bar Display**
   - Upload any CSV file
   - Expected: Progress bar shows 0-100% smoothly

8. **Duplicate Detection**
   - Upload CSV with existing usernames
   - Expected: Yellow warning box appears with count
   - Expected: "Lihat detail" button functional

9. **Duplicate Detail View**
   - Click "Lihat detail" on duplicate warning
   - Expected: List of duplicate usernames displayed
   - Expected: Shows first 5, indicates if more exist

10. **Admin-Only Access**
    - Login as Guru or Siswa
    - Expected: Import button NOT visible
    - Try direct API call as non-admin
    - Expected: 403 Forbidden error

11. **Role-Based Button Visibility**
    - Navigate to tambah-pengguna with role='admin'
    - Expected: "Import CSV/Excel" button visible
    - Navigate with role='guru' or 'siswa'
    - Expected: Button hidden

### Manual Testing Steps

1. Navigate to tambah pengguna page
2. Click "Import CSV/Excel"
3. Download template
4. Fill template with test data
5. Upload filled template
6. Verify results display
7. Check database for created users

### Backend Testing (with curl)

```bash
curl -X POST http://localhost:3000/api/users/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "nama": "Test Siswa",
        "username": "test001",
        "password": "test123",
        "role": "siswa",
        "kelas": "A",
        "tingkat": "12",
        "jurusan": "IPA"
      }
    ]
  }'
```

## Performance

### Considerations
- Sequential processing (not parallel)
- Each user = 1 transaction
- Password hashing overhead
- Database write time

### Recommendations
- Limit: 100 users per batch (recommended)
- Large imports: Split into multiple batches
- Monitor backend memory usage
- Consider queue for very large imports (future)

## Security

### Validation
- ✅ **Admin-only endpoint** - Only admin can access batch import
- ✅ JWT authentication required
- ✅ Password hashing (bcrypt)
- ✅ Input validation (backend)
- ✅ Username uniqueness check
- ✅ Role validation
- ✅ **Frontend role-based UI** - Button hidden for non-admin
- ✅ **Backend role-based middleware** - checkRole('admin') on route

### Access Control Layers

**Layer 1: Frontend UI**
- Import button only rendered when `role === 'admin'`
- Prevents non-admin users from seeing the feature

**Layer 2: Backend Route Protection**
```javascript
router.post('/batch', verifyToken, checkRole('admin'), batchCreateUsers);
```
- `verifyToken` - Validates JWT token
- `checkRole('admin')` - Ensures only admin role can proceed
- Returns 403 Forbidden for non-admin users

**Layer 3: Duplicate Detection**
- Pre-import validation prevents duplicate username attempts
- Reduces failed imports and database load
- User-friendly warning before processing

### Best Practices
- Don't store passwords in plain text
- Validate file content before processing
- Limit file size (implement if needed)
- Rate limiting (implement if needed)
- Only admin users can batch import
- Regular security audits of batch import logs

## Future Improvements

- [ ] Excel parsing (currently CSV only)
- [x] **Progress bar during upload** - Implemented with visual progress indicator
- [ ] Resume failed imports
- [ ] Export failed rows to CSV
- [ ] Background job queue for large imports
- [ ] Email notification on completion
- [ ] Preview data before import
- [x] **Duplicate detection preview** - Implemented with username validation
- [ ] Custom field mapping

## Troubleshooting

### Issue: "Format file tidak valid"
**Solution:** Ensure file is .csv, .xlsx, or .xls

### Issue: Users not created
**Solution:** Check backend logs, verify token, check database connection

### Issue: All imports fail
**Solution:** Verify CSV format matches template exactly

### Issue: Username already exists for new users
**Solution:** Check if usernames in CSV are already in database. Use duplicate detection preview to identify conflicts before import.

### Issue: Dialog doesn't open
**Solution:** Check if user is admin (button only shows for admin role)

### Issue: Progress bar stuck at 0%
**Solution:** Check browser console for errors, verify file is readable

### Issue: Duplicate detection not showing
**Solution:** Verify backend `/users` endpoint is accessible, check network tab

### Issue: Import button visible for non-admin
**Solution:** Verify role prop is set correctly in TambahPenggunaForm component

### Issue: Duplicate preview shows wrong count
**Solution:** Clear browser cache, refresh user list from backend

## Integration with Existing Features

### Tambah Pengguna Form
- Batch import button added to header
- Only visible when role is specific (admin/guru/siswa)
- Dialog integrates seamlessly
- Shares same backend endpoint validation

### User Management
- Imported users appear in user list
- Can be edited/deleted like manual entries
- Same validation rules apply
- Integrated with existing authentication

## Dependencies

### Backend
- `bcryptjs`: Password hashing
- `prisma`: Database operations

### Frontend
- `react-hot-toast`: Notifications
- `lucide-react`: Icons
- `@/components/ui/*`: UI components

## Deployment Notes

- Ensure backend endpoint is accessible
- Verify CORS settings for file upload
- Test with production data sample
- Monitor error logs after deployment
- Provide user training/documentation
