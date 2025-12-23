# 🧪 Testing Checklist - Batch Import Enhancement

**Date:** December 24, 2025  
**Version:** 2.0.0  
**Tester:** _________________

---

## Pre-Testing Setup

- [ ] Backend server running (`node index.js` di cbt-backend)
- [ ] Frontend server running (`npm run dev` di cbt-dashboard)
- [ ] Database connection established
- [ ] At least 1 admin user exists
- [ ] At least 1 guru user exists (untuk negative testing)
- [ ] Browser console open (F12)

---

## Feature 1: Progress Bar During Upload

### Test Case 1.1: Progress Bar Visibility
- [ ] Login sebagai Admin
- [ ] Navigate to Tambah Pengguna
- [ ] Click "Import CSV/Excel"
- [ ] Select and upload any CSV file
- [ ] **Expected:** Progress bar muncul di bawah file upload section
- [ ] **Expected:** Progress bar menampilkan "Uploading..." dan percentage

### Test Case 1.2: Progress Animation
- [ ] Upload a CSV file
- [ ] **Expected:** Progress bar bergerak dari 0% ke 100%
- [ ] **Expected:** Animasi smooth (tidak melompat)
- [ ] **Expected:** Progress bar hilang setelah 100%

### Test Case 1.3: Progress Bar Colors
- [ ] Verify progress bar memiliki warna:
  - [ ] Background: Gray
  - [ ] Progress: Blue
  - [ ] Height: 8px (h-2)

### Test Case 1.4: Multiple Uploads
- [ ] Upload file pertama
- [ ] Wait until complete
- [ ] Upload file kedua
- [ ] **Expected:** Progress bar reset dan mulai dari 0% lagi

**✅ Pass | ❌ Fail | ⚠️ Notes:**
```
Notes:
_________________________________________________
```

---

## Feature 2: Duplicate Detection Preview

### Test Case 2.1: No Duplicates
- [ ] Create CSV dengan username baru (belum terdaftar)
- [ ] Upload file tersebut
- [ ] **Expected:** Tidak ada warning duplikat
- [ ] **Expected:** Bisa langsung import

### Test Case 2.2: Some Duplicates
- [ ] Create CSV dengan mix: 3 username baru + 2 username existing
- [ ] Upload file tersebut
- [ ] **Expected:** Warning box kuning muncul
- [ ] **Expected:** Menampilkan "Ditemukan 2 username..."
- [ ] **Expected:** Total = 5, Duplicates = 2

### Test Case 2.3: All Duplicates
- [ ] Create CSV dengan semua username existing
- [ ] Upload file tersebut
- [ ] **Expected:** Warning "Ditemukan X username dari X pengguna"
- [ ] **Expected:** Semua username listed sebagai duplikat

### Test Case 2.4: Detail View Toggle
- [ ] Upload file dengan duplicates
- [ ] Click "Lihat detail"
- [ ] **Expected:** List username muncul dengan XCircle icon
- [ ] **Expected:** Max 5 username displayed
- [ ] Click "Sembunyikan detail"
- [ ] **Expected:** List hidden kembali

### Test Case 2.5: More Than 5 Duplicates
- [ ] Create CSV dengan 8 username existing
- [ ] Upload and view detail
- [ ] **Expected:** Menampilkan 5 username pertama
- [ ] **Expected:** Menampilkan "... dan 3 lainnya"

### Test Case 2.6: Duplicate Warning Message
- [ ] Upload file dengan duplicates
- [ ] **Expected:** Message clear: "Username duplikat akan gagal ditambahkan"
- [ ] **Expected:** Warning icon (⚠️) visible

### Test Case 2.7: Case Sensitivity
- [ ] Create existing user: "admin001"
- [ ] Upload CSV dengan "Admin001" (different case)
- [ ] **Expected:** Detected sebagai duplicate (case-insensitive)

**✅ Pass | ❌ Fail | ⚠️ Notes:**
```
Notes:
_________________________________________________
```

---

## Feature 3: Admin-Only Access

### Test Case 3.1: Admin Can See Button
- [ ] Login sebagai Admin
- [ ] Navigate to: `/admin/tambah-pengguna/admin`
- [ ] **Expected:** "Import CSV/Excel" button VISIBLE
- [ ] **Expected:** Button berfungsi (dialog opens)

### Test Case 3.2: Guru Cannot See Button
- [ ] Login sebagai Guru
- [ ] Navigate to: `/admin/tambah-pengguna/guru`
- [ ] **Expected:** "Import CSV/Excel" button TIDAK VISIBLE
- [ ] **Expected:** Page masih berfungsi normal untuk single add

### Test Case 3.3: Siswa Cannot See Button
- [ ] Login sebagai Siswa (jika ada akses)
- [ ] Navigate to tambah pengguna page
- [ ] **Expected:** "Import CSV/Excel" button TIDAK VISIBLE

### Test Case 3.4: Backend API Protection (Guru)
- [ ] Login sebagai Guru
- [ ] Open browser DevTools → Network tab
- [ ] Manually call API:
  ```javascript
  fetch('http://localhost:3000/api/users/batch', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <guru_token>',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ users: [...] })
  })
  ```
- [ ] **Expected:** 403 Forbidden error
- [ ] **Expected:** Error message: tidak memiliki akses

### Test Case 3.5: Backend API Protection (No Token)
- [ ] Call API tanpa Authorization header
- [ ] **Expected:** 401 Unauthorized
- [ ] **Expected:** Error message tentang authentication

### Test Case 3.6: Backend API Success (Admin)
- [ ] Login sebagai Admin
- [ ] Use proper admin token
- [ ] Call batch import API
- [ ] **Expected:** 200 OK
- [ ] **Expected:** Users created successfully

**✅ Pass | ❌ Fail | ⚠️ Notes:**
```
Notes:
_________________________________________________
```

---

## Integration Tests

### Test Case 4.1: Progress Bar + Duplicate Detection
- [ ] Upload file dengan duplicates
- [ ] **Expected:** Progress bar muncul dulu
- [ ] **Expected:** Setelah 100%, duplicate warning muncul
- [ ] **Expected:** Both features work seamlessly

### Test Case 4.2: All Features Together
- [ ] Login sebagai Admin (✓ admin access)
- [ ] Upload file dengan duplicates
- [ ] **Expected:** Progress bar shown (✓ progress)
- [ ] **Expected:** Duplicate warning shown (✓ detection)
- [ ] Click Import Data
- [ ] **Expected:** Only non-duplicate users created
- [ ] **Expected:** Result shows correct counts

### Test Case 4.3: Role-Based Full Flow
- [ ] Test dengan Admin: All features available
- [ ] Test dengan Guru: Button not visible
- [ ] Test dengan Siswa: Button not visible
- [ ] Verify consistency across roles

**✅ Pass | ❌ Fail | ⚠️ Notes:**
```
Notes:
_________________________________________________
```

---

## Edge Cases

### Test Case 5.1: Empty File
- [ ] Upload empty CSV file
- [ ] **Expected:** Error toast "File kosong atau format tidak valid"
- [ ] **Expected:** No crash

### Test Case 5.2: Invalid File Type
- [ ] Upload .txt or .pdf file
- [ ] **Expected:** Error "Format file tidak valid"
- [ ] **Expected:** File rejected

### Test Case 5.3: Large File
- [ ] Upload CSV dengan 100+ users
- [ ] **Expected:** Progress bar handles properly
- [ ] **Expected:** Duplicate detection works
- [ ] **Expected:** No timeout or freeze

### Test Case 5.4: Special Characters in Username
- [ ] Upload CSV dengan username containing special chars
- [ ] **Expected:** Duplicate detection works correctly
- [ ] **Expected:** No parsing errors

### Test Case 5.5: Network Error
- [ ] Stop backend server
- [ ] Try to upload file
- [ ] **Expected:** Error toast with message
- [ ] **Expected:** UI remains functional

**✅ Pass | ❌ Fail | ⚠️ Notes:**
```
Notes:
_________________________________________________
```

---

## Performance Tests

### Test Case 6.1: Upload Speed
- [ ] Upload 10 user CSV
- [ ] Measure time from upload to completion
- [ ] **Expected:** < 3 seconds
- [ ] **Performance:** Acceptable | Slow | Too Slow

### Test Case 6.2: Duplicate Detection Speed
- [ ] Upload file while checking time
- [ ] Measure time for duplicate detection
- [ ] **Expected:** < 2 seconds
- [ ] **Performance:** Acceptable | Slow | Too Slow

### Test Case 6.3: UI Responsiveness
- [ ] Upload file
- [ ] Try to interact with dialog during upload
- [ ] **Expected:** UI tidak freeze
- [ ] **Expected:** Progress updates smooth

**✅ Pass | ❌ Fail | ⚠️ Notes:**
```
Notes:
_________________________________________________
```

---

## Regression Tests

### Test Case 7.1: Single User Add Still Works
- [ ] Use form to add single user manually
- [ ] **Expected:** Works as before
- [ ] **Expected:** No interference from new features

### Test Case 7.2: Existing Batch Import Works
- [ ] Upload file tanpa duplicates
- [ ] Import normally
- [ ] **Expected:** Works as v1.0.0
- [ ] **Expected:** New features don't break existing functionality

### Test Case 7.3: Other Admin Features
- [ ] Test user list view
- [ ] Test edit user
- [ ] Test delete user
- [ ] **Expected:** All unaffected by changes

**✅ Pass | ❌ Fail | ⚠️ Notes:**
```
Notes:
_________________________________________________
```

---

## Browser Compatibility

Test on multiple browsers:

### Chrome/Edge
- [ ] All features work
- [ ] No console errors
- [ ] CSS renders correctly

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] CSS renders correctly

### Safari (if available)
- [ ] All features work
- [ ] No console errors
- [ ] CSS renders correctly

**✅ Pass | ❌ Fail | ⚠️ Notes:**
```
Notes:
_________________________________________________
```

---

## Security Tests

### Test Case 9.1: Token Validation
- [ ] Try API with invalid token
- [ ] **Expected:** 401 error

### Test Case 9.2: Role Validation
- [ ] Try API with guru token
- [ ] **Expected:** 403 error

### Test Case 9.3: SQL Injection Attempt
- [ ] Upload CSV dengan SQL injection attempts
- [ ] **Expected:** Sanitized properly
- [ ] **Expected:** No database compromise

**✅ Pass | ❌ Fail | ⚠️ Notes:**
```
Notes:
_________________________________________________
```

---

## Final Checklist

- [ ] All test cases completed
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation matches behavior
- [ ] Ready for production

---

## Test Summary

**Total Test Cases:** 40+  
**Passed:** _____ / _____  
**Failed:** _____ / _____  
**Blocked:** _____ / _____  

**Critical Issues:**
```
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________
```

**Minor Issues:**
```
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________
```

**Recommendations:**
```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

**Tested By:** _________________  
**Date:** _________________  
**Sign Off:** _________________  

**Status:** 
- [ ] ✅ Approved for Production
- [ ] ⚠️ Approved with Minor Issues
- [ ] ❌ Rejected - Major Issues Found
