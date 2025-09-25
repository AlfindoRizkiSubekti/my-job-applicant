// Background script untuk Job Application Auto Tracker
console.log('Job Application Auto Tracker: Background script loaded');

// Listener untuk pesan dari content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request.action);

  switch (request.action) {
    case 'saveJobData':
      saveJobApplication(request.data)
        .then(result => {
          sendResponse({ success: true, data: result });
        })
        .catch(error => {
          console.error('Error saving job application:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response

    case 'getJobApplications':
      getJobApplications()
        .then(data => {
          sendResponse({ success: true, data: data });
        })
        .catch(error => {
          console.error('Error getting job applications:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response

    case 'deleteJobApplication':
      deleteJobApplication(request.id, request.platform)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(error => {
          console.error('Error deleting job application:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response

    case 'updateJobStatus':
      updateJobStatus(request.id, request.platform, request.status)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(error => {
          console.error('Error updating job status:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Fungsi untuk menyimpan aplikasi pekerjaan
async function saveJobApplication(jobData) {
  try {
    // Ambil data yang sudah ada
    const result = await chrome.storage.local.get(['jobApplications']);
    let applications = result.jobApplications || [];

    // Cek apakah job sudah ada (berdasarkan ID dan platform)
    const existingIndex = applications.findIndex(
      app => app.id === jobData.id && app.platform === jobData.platform
    );

    if (existingIndex !== -1) {
      // Update job yang sudah ada
      applications[existingIndex] = {
        ...applications[existingIndex],
        ...jobData,
        updatedDate: new Date().toISOString()
      };
      console.log(`Updated existing ${jobData.platform} job:`, jobData.title);
    } else {
      // Tambah job baru
      applications.push(jobData);
      console.log(`Added new ${jobData.platform} job:`, jobData.title);
    }

    // Simpan kembali ke storage
    await chrome.storage.local.set({ jobApplications: applications });
    
    // Update badge dengan total aplikasi
    await updateBadge();
    
    return jobData;

  } catch (error) {
    console.error('Error in saveJobApplication:', error);
    throw error;
  }
}

// Fungsi untuk mengambil semua aplikasi pekerjaan
async function getJobApplications() {
  try {
    const result = await chrome.storage.local.get(['jobApplications']);
    const applications = result.jobApplications || [];
    
    // Urutkan berdasarkan tanggal apply terbaru
    applications.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
    
    return applications;
  } catch (error) {
    console.error('Error in getJobApplications:', error);
    throw error;
  }
}

// Fungsi untuk menghapus aplikasi pekerjaan
async function deleteJobApplication(jobId, platform) {
  try {
    const result = await chrome.storage.local.get(['jobApplications']);
    let applications = result.jobApplications || [];

    // Filter out aplikasi yang akan dihapus
    applications = applications.filter(
      app => !(app.id === jobId && app.platform === platform)
    );

    // Simpan kembali ke storage
    await chrome.storage.local.set({ jobApplications: applications });
    
    // Update badge
    await updateBadge();
    
    console.log(`Deleted ${platform} job application with ID:`, jobId);
  } catch (error) {
    console.error('Error in deleteJobApplication:', error);
    throw error;
  }
}

// Fungsi untuk mengupdate status pekerjaan
async function updateJobStatus(jobId, platform, newStatus) {
  try {
    const result = await chrome.storage.local.get(['jobApplications']);
    let applications = result.jobApplications || [];

    // Cari dan update status
    const jobIndex = applications.findIndex(
      app => app.id === jobId && app.platform === platform
    );

    if (jobIndex !== -1) {
      applications[jobIndex].status = newStatus;
      applications[jobIndex].updatedDate = new Date().toISOString();

      // Simpan kembali ke storage
      await chrome.storage.local.set({ jobApplications: applications });
      
      console.log(`Updated ${platform} job status to:`, newStatus);
    }
  } catch (error) {
    console.error('Error in updateJobStatus:', error);
    throw error;
  }
}

// Fungsi untuk mengupdate badge dengan jumlah aplikasi
async function updateBadge() {
  try {
    const result = await chrome.storage.local.get(['jobApplications']);
    const applications = result.jobApplications || [];
    const count = applications.length;

    if (count > 0) {
      await chrome.action.setBadgeText({ text: count.toString() });
      await chrome.action.setBadgeBackgroundColor({ color: '#FF6B35' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Fungsi untuk menginisialisasi badge saat extension dimuat
async function initializeBadge() {
  await updateBadge();
}

// Event listener saat extension pertama kali diinstall atau diupdate
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  initializeBadge();
});

// Event listener saat extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
  initializeBadge();
});

// Inisialisasi badge saat script dimuat
initializeBadge();