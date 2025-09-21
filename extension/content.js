// Content script untuk mengekstrak informasi lamaran kerja dari Jobstreet
console.log('Job Application Auto Tracker: Content script loaded');

// Fungsi untuk mengekstrak data pekerjaan dari halaman detail job
function extractJobData() {
  const jobData = {
    id: '',
    title: '',
    company: '',
    location: '',
    salary: '',
    jobType: '',
    description: '',
    requirements: '',
    url: '',
    appliedDate: new Date().toISOString(),
    status: 'applied'
  };

  try {
    // Ekstrak ID dari URL
    const urlMatch = window.location.href.match(/job\/(\d+)/);
    if (urlMatch) {
      jobData.id = urlMatch[1];
      // Buat URL yang bersih hanya sampai job ID
      jobData.url = `https://id.jobstreet.com/id/job/${urlMatch[1]}`;
    }

    // Ekstrak judul pekerjaan
    const titleElement = document.querySelector('h1[data-automation="job-detail-title"]') || 
                        document.querySelector('h1.job-title') ||
                        document.querySelector('h1');
    if (titleElement) {
      jobData.title = titleElement.textContent.trim();
    }

    // Ekstrak nama perusahaan
    const companyElement = document.querySelector('[data-automation="advertiser-name"]') ||
                          document.querySelector('.company-name') ||
                          document.querySelector('a[href*="/companies/"]');
    if (companyElement) {
      jobData.company = companyElement.textContent.trim();
    }

    // Ekstrak lokasi
    const locationElement = document.querySelector('[data-automation="job-detail-location"]') ||
                           document.querySelector('.location') ||
                           document.querySelector('span[title*="location"]');
    if (locationElement) {
      jobData.location = locationElement.textContent.trim();
    }

    // Ekstrak gaji
    const salaryElement = document.querySelector('[data-automation="job-detail-salary"]') ||
                         document.querySelector('.salary') ||
                         document.querySelector('span[data-automation="job-card-salary"]');
    if (salaryElement) {
      jobData.salary = salaryElement.textContent.trim();
    }

    // Ekstrak tipe pekerjaan
    const jobTypeElement = document.querySelector('[data-automation="job-detail-work-type"]') ||
                          document.querySelector('.work-type') ||
                          document.querySelector('span[title*="type"]');
    if (jobTypeElement) {
      jobData.jobType = jobTypeElement.textContent.trim();
    }

    // Ekstrak deskripsi pekerjaan
    const descriptionElement = document.querySelector('[data-automation="job-detail-description"]') ||
                              document.querySelector('.job-description') ||
                              document.querySelector('#job-description');
    if (descriptionElement) {
      jobData.description = descriptionElement.textContent.trim().substring(0, 1000); // Limit 1000 karakter
    }

    // Ekstrak requirements
    const requirementsElement = document.querySelector('[data-automation="job-detail-requirements"]') ||
                               document.querySelector('.job-requirements') ||
                               document.querySelector('#job-requirements');
    if (requirementsElement) {
      jobData.requirements = requirementsElement.textContent.trim().substring(0, 1000); // Limit 1000 karakter
    }

  } catch (error) {
    console.error('Error extracting job data:', error);
  }

  return jobData;
}

// Fungsi untuk menyimpan data ke Chrome storage
function saveJobData(jobData) {
  chrome.runtime.sendMessage({
    action: 'saveJobData',
    data: jobData
  }, (response) => {
    if (response && response.success) {
      console.log('Job data saved successfully:', jobData.title);
      showNotification('✅ Data lamaran berhasil disimpan!', 'success');
    } else {
      console.error('Failed to save job data');
      showNotification('❌ Gagal menyimpan data lamaran', 'error');
    }
  });
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
  // Hapus notifikasi yang ada
  const existingNotification = document.getElementById('job-tracker-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Buat notifikasi baru
  const notification = document.createElement('div');
  notification.id = 'job-tracker-notification';
  
  let backgroundColor;
  switch(type) {
    case 'success':
      backgroundColor = '#4CAF50';
      break;
    case 'error':
      backgroundColor = '#f44336';
      break;
    case 'warning':
      backgroundColor = '#ff9800';
      break;
    default:
      backgroundColor = '#2196F3';
  }
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background-color: ${backgroundColor};
    color: white;
    border-radius: 5px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 300px;
    transition: all 0.3s ease;
    line-height: 1.4;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Hapus notifikasi setelah 4 detik untuk warning, 3 detik untuk lainnya
  const timeout = type === 'warning' ? 4000 : 3000;
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, timeout);
}

// Fungsi untuk mendeteksi halaman success atau detail job
function detectPageType() {
  const url = window.location.href;
  
  // Halaman success setelah apply
  if (url.includes('/apply/success')) {
    return 'success';
  }
  
  // Halaman detail job
  if (url.match(/\/job\/\d+/)) {
    return 'job_detail';
  }
  
  return 'other';
}

// Fungsi alternatif untuk fetch data dari URL detail job
async function fetchJobDataFromUrl(jobUrl) {
  try {
    console.log('Fetching job data from URL:', jobUrl);
    
    const response = await fetch(jobUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'User-Agent': navigator.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const jobData = {
      id: '',
      title: '',
      company: '',
      location: '',
      salary: '',
      jobType: '',
      url: jobUrl,
      appliedDate: new Date().toISOString(),
      status: 'applied'
    };
    
    // Ekstrak ID dari URL
    const urlMatch = jobUrl.match(/job\/(\d+)/);
    if (urlMatch) {
      jobData.id = urlMatch[1];
    }
    
    // Ekstrak title
    const titleSelectors = [
      'h1[data-automation="job-detail-title"]',
      'h1[class*="title"]',
      'title',
      'h1'
    ];
    
    for (const selector of titleSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        let titleText = element.textContent.trim();
        // Clean up title from page title
        titleText = titleText.replace(/\s*-\s*JobStreet\.com.*$/i, '');
        titleText = titleText.replace(/\s*\|\s*JobStreet.*$/i, '');
        
        if (titleText && !titleText.includes('berhasil') && titleText.length > 3) {
          jobData.title = titleText;
          break;
        }
      }
    }
    
    // Ekstrak company
    const companySelectors = [
      '[data-automation="advertiser-name"]',
      'a[href*="/companies/"]',
      '.company-name',
      'span[class*="company"]'
    ];
    
    for (const selector of companySelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const companyText = element.textContent.trim();
        if (companyText && !companyText.includes('Alfindo') && companyText.length > 1) {
          jobData.company = companyText;
          break;
        }
      }
    }
    
    // Ekstrak location
    const locationSelectors = [
      '[data-automation="job-detail-location"]',
      '.location',
      'span[class*="location"]'
    ];
    
    for (const selector of locationSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        jobData.location = element.textContent.trim();
        if (jobData.location) break;
      }
    }
    
    console.log('Fetched job data:', jobData);
    return jobData;
    
  } catch (error) {
    console.error('Error fetching job data from URL:', error);
    return null;
  }
}

// Fungsi untuk menambahkan tombol manual save
function addManualSaveButton() {
  // Cek apakah tombol sudah ada
  if (document.getElementById('manual-save-job-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'manual-save-job-btn';
  button.innerHTML = '💾 Simpan Data Lamaran';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background-color: #FF6B35;
    color: white;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
    transition: all 0.3s ease;
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#E55A2B';
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 16px rgba(255, 107, 53, 0.4)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#FF6B35';
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.3)';
  });
  
  button.addEventListener('click', () => {
    const jobData = extractJobData();
    if (jobData.title || jobData.company) {
      saveJobData(jobData);
    } else {
      showNotification('❌ Tidak dapat mengekstrak data pekerjaan', 'error');
    }
  });

  document.body.appendChild(button);
}

// Fungsi untuk mendapatkan URL job yang bersih dari halaman success
function getCleanJobUrl() {
  const currentUrl = window.location.href;
  const jobIdMatch = currentUrl.match(/job\/(\d+)/);
  
  if (jobIdMatch) {
    return `https://id.jobstreet.com/id/job/${jobIdMatch[1]}`;
  }
  
  return currentUrl;
}

// Auto-detect dan ekstrak data berdasarkan tipe halaman dengan fetch fallback
async function autoDetectAndExtract() {
  const pageType = detectPageType();
  
  if (pageType === 'success') {
    console.log('Success page detected');
    
    setTimeout(async () => {
      // Coba ekstrak dari halaman success terlebih dahulu
      let jobData = extractJobData();
      
      // Jika data tidak lengkap, coba fetch dari halaman detail
      if (jobData.id && (!jobData.company || !jobData.title)) {
        console.log('Incomplete data from success page, trying to fetch from detail page');
        
        const fetchedData = await fetchJobDataFromUrl(jobData.url);
        if (fetchedData && (fetchedData.title || fetchedData.company)) {
          // Gabungkan data
          jobData = {
            ...jobData,
            ...fetchedData,
            appliedDate: jobData.appliedDate // Keep original applied date
          };
          console.log('Enhanced job data:', jobData);
        }
      }
      
      // Simpan jika ada data yang valid
      if (jobData.id) {
        // Jika masih tidak ada company/title, tandai perlu update
        if (!jobData.company || !jobData.title) {
          jobData.needsUpdate = true;
          jobData.title = jobData.title || `Job ${jobData.id} (Perlu Update)`;
          jobData.company = jobData.company || 'Data akan diperbarui saat mengunjungi detail';
        }
        
        await saveJobData(jobData);
        
        const message = jobData.needsUpdate 
          ? '⚠️ Data dasar tersimpan! Kunjungi halaman detail untuk data lengkap'
          : '✅ Data lamaran berhasil disimpan!';
        showNotification(message, jobData.needsUpdate ? 'warning' : 'success');
      }
    }, 2000);
  } else if (pageType === 'job_detail') {
    // Halaman detail job - tambahkan tombol manual dan cek update data
    setTimeout(async () => {
      addManualSaveButton();
      
      // Cek apakah ada data yang perlu di-update untuk job ini
      const currentJobId = getCurrentJobId();
      if (currentJobId) {
        await checkAndUpdateJobData(currentJobId);
      }
    }, 1000);
  }
}

// Fungsi untuk mendapatkan job ID dari URL saat ini
function getCurrentJobId() {
  const urlMatch = window.location.href.match(/job\/(\d+)/);
  return urlMatch ? urlMatch[1] : null;
}

// Fungsi untuk cek dan update data job yang incomplete
async function checkAndUpdateJobData(jobId) {
  try {
    // Ambil data yang sudah ada
    chrome.runtime.sendMessage({
      action: 'getJobApplications'
    }, async (response) => {
      if (response && response.success) {
        const existingJob = response.data.find(job => job.id === jobId);
        
        if (existingJob && existingJob.needsUpdate) {
          console.log('Found incomplete job data, updating...');
          
          // Tunggu sebentar untuk DOM fully load
          setTimeout(async () => {
            const updatedJobData = extractJobData();
            
            // Hanya update jika berhasil mendapat data lengkap
            if (updatedJobData.title && updatedJobData.company && 
                !updatedJobData.title.includes('Perlu Update')) {
              
              // Gabungkan dengan data existing
              const completeJobData = {
                ...existingJob,
                ...updatedJobData,
                needsUpdate: false,
                updatedDate: new Date().toISOString()
              };
              
              await saveJobData(completeJobData);
              showNotification('🔄 Data pekerjaan berhasil diperbarui!', 'success');
            }
          }, 2000);
        }
      }
    });
  } catch (error) {
    console.error('Error checking job data update:', error);
  }
}

// Jalankan auto-detect saat halaman dimuat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoDetectAndExtract);
} else {
  autoDetectAndExtract();
}

// Monitor perubahan URL untuk SPA navigation
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('URL changed, re-running auto-detect');
    setTimeout(autoDetectAndExtract, 1000);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});