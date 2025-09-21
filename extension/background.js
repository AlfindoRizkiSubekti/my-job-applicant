// Background script untuk menangani penyimpanan data
console.log('Job Application Auto Tracker: Background script loaded');

// Listener untuk message dari content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveJobData') {
    saveJobApplication(request.data)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error saving job data:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true untuk menunjukkan response akan dikirim secara asynchronous
    return true;
  }
  
  if (request.action === 'getJobApplications') {
    getJobApplications()
      .then((data) => {
        sendResponse({ success: true, data: data });
      })
      .catch((error) => {
        console.error('Error getting job applications:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  if (request.action === 'deleteJobApplication') {
    deleteJobApplication(request.jobId)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error deleting job application:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
});

// Fungsi untuk menyimpan data lamaran kerja
async function saveJobApplication(jobData) {
  try {
    // Validasi data minimal
    if (!jobData.id && !jobData.title && !jobData.company) {
      throw new Error('Data pekerjaan tidak lengkap');
    }
    
    // Generate unique ID jika tidak ada
    if (!jobData.id) {
      jobData.id = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Pastikan ada timestamp
    if (!jobData.appliedDate) {
      jobData.appliedDate = new Date().toISOString();
    }
    
    // Set status default jika belum ada
    if (!jobData.status) {
      jobData.status = 'applied';
    }
    
    // Ambil data yang sudah ada
    const result = await chrome.storage.local.get(['jobApplications']);
    const existingApplications = result.jobApplications || [];
    
    // Cek apakah sudah ada aplikasi dengan ID atau URL yang sama
    const existingIndex = existingApplications.findIndex(app => 
      app.id === jobData.id
    );
    
    if (existingIndex !== -1) {
      // Update data yang sudah ada - prioritaskan data yang lebih lengkap
      const existingApp = existingApplications[existingIndex];
      const updatedApp = {
        ...existingApp,
        ...jobData,
        updatedDate: new Date().toISOString()
      };
      
      // Jika data baru lebih lengkap, gunakan data baru
      if (jobData.title && jobData.company && !jobData.needsUpdate) {
        updatedApp.title = jobData.title;
        updatedApp.company = jobData.company;
        updatedApp.location = jobData.location || existingApp.location;
        updatedApp.salary = jobData.salary || existingApp.salary;
        updatedApp.jobType = jobData.jobType || existingApp.jobType;
        updatedApp.description = jobData.description || existingApp.description;
        updatedApp.requirements = jobData.requirements || existingApp.requirements;
        updatedApp.needsUpdate = false;
      }
      
      existingApplications[existingIndex] = updatedApp;
      console.log('Updated existing job application:', updatedApp.title);
    } else {
      // Tambah data baru
      existingApplications.push(jobData);
      console.log('Added new job application:', jobData.title || jobData.id);
    }
    
    // Simpan kembali ke storage
    await chrome.storage.local.set({ jobApplications: existingApplications });
    
    // Update badge dengan jumlah aplikasi
    updateBadge(existingApplications.length);
    
    return true;
  } catch (error) {
    console.error('Error in saveJobApplication:', error);
    throw error;
  }
}

// Fungsi untuk mengambil semua data lamaran kerja
async function getJobApplications() {
  try {
    const result = await chrome.storage.local.get(['jobApplications']);
    const applications = result.jobApplications || [];
    
    // Sort berdasarkan tanggal terbaru
    applications.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
    
    return applications;
  } catch (error) {
    console.error('Error in getJobApplications:', error);
    throw error;
  }
}

// Fungsi untuk menghapus data lamaran kerja
async function deleteJobApplication(jobId) {
  try {
    const result = await chrome.storage.local.get(['jobApplications']);
    const existingApplications = result.jobApplications || [];
    
    const filteredApplications = existingApplications.filter(app => app.id !== jobId);
    
    await chrome.storage.local.set({ jobApplications: filteredApplications });
    
    // Update badge
    updateBadge(filteredApplications.length);
    
    console.log('Deleted job application:', jobId);
    return true;
  } catch (error) {
    console.error('Error in deleteJobApplication:', error);
    throw error;
  }
}

// Fungsi untuk update badge di icon extension
function updateBadge(count) {
  const badgeText = count > 0 ? count.toString() : '';
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: '#FF6B35' });
}

// Initialize badge saat extension dimuat
chrome.runtime.onInstalled.addListener(() => {
  console.log('Job Application Auto Tracker installed');
  getJobApplications().then(applications => {
    updateBadge(applications.length);
  });
});

// Update badge saat startup
chrome.runtime.onStartup.addListener(() => {
  getJobApplications().then(applications => {
    updateBadge(applications.length);
  });
});