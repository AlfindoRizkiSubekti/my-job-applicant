# Job Application Auto Tracker

Extension Chrome untuk secara otomatis melacak dan menyimpan data lamaran kerja dari Jobstreet Indonesia.

## 🎯 Fitur Utama

- **Auto-detect & Extract**: Otomatis mendeteksi halaman Jobstreet dan mengekstrak informasi pekerjaan
- **Smart Storage**: Menyimpan data ke Chrome storage dengan sistem yang aman
- **Manual Save**: Tombol manual untuk menyimpan data pada halaman detail job
- **Export Data**: Export semua data ke format CSV
- **Search & Filter**: Pencarian berdasarkan perusahaan atau posisi
- **Clean UI**: Interface yang bersih dan mudah digunakan

## 📋 Cara Instalasi

1. **Download semua file extension**:
   - `manifest.json`
   - `content.js`
   - `background.js`
   - `popup.html`
   - `popup.css`
   - `popup.js`

2. **Buat folder icons** dan tambahkan icon (opsional):
   - `icons/icon16.png` (16x16 px)
   - `icons/icon48.png` (48x48 px)
   - `icons/icon128.png` (128x128 px)

3. **Load extension ke Chrome**:
   - Buka `chrome://extensions/`
   - Aktifkan "Developer mode"
   - Klik "Load unpacked"
   - Pilih folder yang berisi semua file extension

## 🚀 Cara Penggunaan

### Otomatis (Recommended)
1. Kunjungi halaman Jobstreet: `https://id.jobstreet.com`
2. Browse dan apply ke pekerjaan yang diinginkan
3. Setelah berhasil apply, extension akan otomatis menyimpan data

### Manual
1. Kunjungi halaman detail job di Jobstreet
2. Klik tombol floating "💾 Simpan Data Lamaran" yang muncul di kanan bawah
3. Data akan tersimpan otomatis

### Melihat Data
1. Klik icon extension di toolbar Chrome
2. Lihat semua lamaran yang tersimpan
3. Gunakan fitur search untuk mencari data tertentu
4. Export data ke CSV jika diperlukan

## 📊 Data yang Disimpan

Extension akan mengekstrak dan menyimpan informasi berikut:
- **ID Pekerjaan**: Unique identifier dari URL
- **Judul Posisi**: Nama posisi yang dilamar
- **Nama Perusahaan**: Perusahaan yang menawarkan posisi
- **Lokasi**: Lokasi pekerjaan
- **Gaji**: Rentang gaji (jika tersedia)
- **Tipe Pekerjaan**: Full-time, part-time, kontrak, dll
- **Deskripsi**: Deskripsi pekerjaan (dipotong 1000 karakter)
- **Requirements**: Persyaratan pekerjaan (dipotong 1000 karakter)
- **URL**: Link ke halaman job
- **Tanggal Apply**: Timestamp kapan data disimpan
- **Status**: Status lamaran (default: "applied")

## 🔧 Fitur Teknis

### Auto-Detection
- Mendeteksi halaman success (`/apply/success`)
- Mendeteksi halaman detail job (`/job/{id}`)
- Smart URL monitoring untuk SPA navigation

### Data Extraction
- Menggunakan multiple selector fallbacks untuk reliability
- Error handling untuk elemen yang tidak ditemukan
- Smart text cleaning dan formatting

### Storage System
- Chrome Storage API untuk persistensi data
- Duplicate detection berdasarkan ID dan URL
- Update mechanism untuk data yang sudah ada

### UI Features
- Real-time notifications
- Floating action button
- Responsive design
- Loading states dan error handling

## 🎨 Customization

### Mengubah Style Tombol
Edit `content.js` pada bagian `addManualSaveButton()`:

```javascript
button.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  background-color: #YOUR_COLOR;
  // ... style lainnya
`;
```

### Menambah Selector Baru
Edit array selector di `content.js`:

```javascript
const titleElement = document.querySelector('h1[data-automation="job-detail-title"]') || 
                    document.querySelector('h1.job-title') ||
                    document.querySelector('YOUR_NEW_SELECTOR') ||
                    document.querySelector('h1');
```

### Mengubah Popup Theme
Edit `popup.css` untuk mengcustomize warna dan layout sesuai preferensi.

## ⚠️ Troubleshooting

### Data Tidak Tersimpan
1. Pastikan extension sudah diaktifkan
2. Refresh halaman Jobstreet
3. Cek console browser untuk error messages
4. Pastikan menggunakan URL Jobstreet yang benar

### Tombol Tidak Muncul
1. Pastikan berada di halaman detail job Jobstreet
2. Wait beberapa detik untuk loading
3. Refresh halaman jika perlu

### Export CSV Tidak Berfungsi
1. Pastikan browser mengizinkan download
2. Cek popup blocker settings
3. Pastikan ada data untuk diekspor

## 🔒 Privacy & Security

- **Lokal Storage**: Semua data disimpan lokal di Chrome storage
- **No External Requests**: Tidak ada data yang dikirim ke server eksternal
- **Permissions**: Hanya meminta akses minimal yang dibutuhkan
- **No Tracking**: Extension tidak melakukan tracking user activity

## 📝 Changelog

### v1.0
- Initial release
- Auto-detection untuk halaman Jobstreet
- Manual save button
- Export CSV functionality
- Search dan filter data
- Clean popup interface

## 🤝 Contributing

Silakan berkontribusi dengan:
1. Report bugs melalui issues
2. Suggest new features
3. Submit pull requests
4. Improve documentation

## 📄 License

MIT License - bebas untuk digunakan dan dimodifikasi.

## ⭐ Support

Jika extension ini membantu, berikan star dan bagikan ke rekan-rekan yang sedang job hunting! 🚀

---

**Dibuat dengan ❤️ untuk job seekers Indonesia**# my-job-applicant
