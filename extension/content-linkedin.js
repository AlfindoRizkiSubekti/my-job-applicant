// Content script untuk mengekstrak informasi lamaran kerja dari LinkedIn
console.log('Job Application Auto Tracker: LinkedIn content script loaded');

// Fungsi untuk mengekstrak data pekerjaan dari halaman detail job LinkedIn
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
    platform: 'linkedin',
    appliedDate: new Date().toISOString(),
    status: 'applied'
  };

  try {
    // Ekstrak ID dari URL - lebih fleksibel untuk berbagai format URL LinkedIn
    const urlPatterns = [
      /jobs\/view\/(\d+)/,
      /currentJobId=(\d+)/,
      /postApplyJobId=(\d+)/,
      /job\/(\d+)/
    ];
    
    for (const pattern of urlPatterns) {
      const urlMatch = window.location.href.match(pattern);
      if (urlMatch) {
        jobData.id = urlMatch[1];
        jobData.url = `https://www.linkedin.com/jobs/view/${urlMatch[1]}`;
        break;
      }
    }

    // Ekstrak judul pekerjaan - selector yang lebih komprehensif
    const titleSelectors = [
      'h1.top-card-layout__title',
      'h1[data-test-id="job-title"]',
      '.jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title h1',
      'h1.t-24',
      '.jobs-search__job-details--container h1',
      '.job-details-module h1',
      '.jobs-details__main-content h1',
      'h1.jobs-details-top-card__job-title',
      '.p5 h1',
      '[data-job-id] h1'
    ];
    
    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) {
        jobData.title = titleElement.textContent.trim();
        console.log('Title found:', jobData.title);
        break;
      }
    }

    // Ekstrak nama perusahaan - selector yang diperbaiki
    const companySelectors = [
      '.jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__subtitle-primary-grouping a',
      'a[data-test-id="job-details-company-name"]',
      '.top-card-layout__card .top-card-layout__entity-info a',
      '.jobs-details-top-card__company-url',
      '.job-details-module .jobs-details-top-card__company-url',
      '.jobs-search__job-details--container .job-details-jobs-unified-top-card__company-name a',
      '[data-job-id] .job-details-jobs-unified-top-card__company-name a',
      '.artdeco-entity-lockup__title a'
    ];
    
    for (const selector of companySelectors) {
      const companyElement = document.querySelector(selector);
      if (companyElement && companyElement.textContent.trim()) {
        jobData.company = companyElement.textContent.trim();
        console.log('Company found:', jobData.company);
        break;
      }
    }

    // Ekstrak lokasi - selector yang lebih akurat
    const locationSelectors = [
      '.jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__subtitle-secondary-grouping',
      '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
      '[data-test-id="job-details-location"]',
      '.top-card-layout__first-subline',
      '.jobs-details-top-card__bullet',
      '.job-details-module .tvm__text',
      '.jobs-search__job-details--container .tvm__text'
    ];
    
    for (const selector of locationSelectors) {
      const locationElement = document.querySelector(selector);
      if (locationElement) {
        let locationText = locationElement.textContent.trim();
        // Filter lebih ketat untuk text lokasi
        const locationPattern = /^[A-Za-z\s,.-]+(?:,\s*[A-Za-z\s.-]+)*$/;
        if (locationText && 
            !locationText.includes('•') && 
            !locationText.includes('applicant') && 
            !locationText.includes('reposted') &&
            !locationText.includes('hour') &&
            !locationText.includes('day') &&
            locationText.length > 2 && 
            locationText.length < 100 &&
            locationPattern.test(locationText)) {
          jobData.location = locationText;
          console.log('Location found:', jobData.location);
          break;
        }
      }
    }

    // Ekstrak gaji - lebih komprehensif
    const salarySelectors = [
      '.jobs-unified-top-card__job-insight',
      '.job-details-jobs-unified-top-card__job-insight',
      '[data-test-id="job-salary"]',
      '.jobs-details__salary',
      '.job-details-module .job-details-jobs-unified-top-card__job-insight'
    ];
    
    for (const selector of salarySelectors) {
      const salaryElements = document.querySelectorAll(selector);
      for (const element of salaryElements) {
        const salaryText = element.textContent.trim();
        const salaryPattern = /(\$|IDR|Rp|USD|EUR|£)[\d,.]+(k|K|M|\/month|\/year|\/hour|\s*-\s*(\$|IDR|Rp|USD|EUR|£)[\d,.]+)/;
        if (salaryText && salaryPattern.test(salaryText)) {
          jobData.salary = salaryText;
          console.log('Salary found:', jobData.salary);
          break;
        }
      }
      if (jobData.salary) break;
    }

    // Ekstrak tipe pekerjaan - lebih akurat
    const jobTypeSelectors = [
      '.jobs-unified-top-card__job-insight',
      '.job-details-jobs-unified-top-card__job-insight',
      '.jobs-unified-top-card__workplace-type',
      '.job-details-module .job-details-jobs-unified-top-card__job-insight'
    ];
    
    const jobTypeKeywords = [
      'full-time', 'part-time', 'contract', 'temporary', 'internship',
      'remote', 'hybrid', 'on-site', 'freelance', 'volunteer'
    ];
    
    for (const selector of jobTypeSelectors) {
      const jobTypeElements = document.querySelectorAll(selector);
      for (const element of jobTypeElements) {
        const typeText = element.textContent.trim().toLowerCase();
        for (const keyword of jobTypeKeywords) {
          if (typeText.includes(keyword)) {
            jobData.jobType = element.textContent.trim();
            console.log('Job type found:', jobData.jobType);
            break;
          }
        }
        if (jobData.jobType) break;
      }
      if (jobData.jobType) break;
    }

    // Ekstrak deskripsi pekerjaan - selector yang diperbaiki
    const descriptionSelectors = [
      '.jobs-box__html-content',
      '.jobs-description__content',
      '.jobs-description-content__text',
      '#job-details',
      '.jobs-details__main-content',
      '.job-details-module .jobs-box__html-content',
      '.jobs-search__job-details--container .jobs-description-content__text',
      '.jobs-description .jobs-box__html-content'
    ];
    
    for (const selector of descriptionSelectors) {
      const descriptionElement = document.querySelector(selector);
      if (descriptionElement) {
        const descText = descriptionElement.textContent.trim();
        if (descText && descText.length > 50) {
          jobData.description = descText.substring(0, 2000); // Limit 2000 karakter
          console.log('Description found, length:', descText.length);
          break;
        }
      }
    }

  } catch (error) {
    console.error('Error extracting LinkedIn job data:', error);
  }

// Tambahkan debug console untuk melihat data yang diekstrak
function debugExtractedData(jobData) {
  console.group('=== LinkedIn Job Data Extraction Debug ===');
  console.log('Current URL:', window.location.href);
  console.log('Job ID:', jobData.id || 'NOT FOUND');
  console.log('Job Title:', jobData.title || 'NOT FOUND');
  console.log('Company:', jobData.company || 'NOT FOUND');
  console.log('Location:', jobData.location || 'NOT FOUND');
  console.log('Salary:', jobData.salary || 'NOT FOUND');
  console.log('Job Type:', jobData.jobType || 'NOT FOUND');
  console.log('Description length:', jobData.description ? jobData.description.length + ' chars' : 'NOT FOUND');
  console.log('Full extracted data:', jobData);
  console.groupEnd();
}

// Fungsi untuk menyimpan data ke Chrome storage
function saveJobData(jobData) {
  console.log('Attempting to save LinkedIn job data:', jobData);
  
  // Validasi data minimal
  if (!jobData.id && !jobData.title && !jobData.company) {
    console.error('No valid data to save');
    showNotification('❌ Tidak ada data valid untuk disimpan', 'error');
    return;
  }

  // Cek apakah chrome.runtime tersedia
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.error('Chrome runtime not available');
    showNotification('❌ Extension tidak aktif', 'error');
    return;
  }

  try {
    chrome.runtime.sendMessage({
      action: 'saveJobData',
      data: jobData
    }, (response) => {
      // Cek apakah ada error di runtime
      if (chrome.runtime.lastError) {
        console.error('Chrome runtime error:', chrome.runtime.lastError);
        showNotification('❌ Error extension: ' + chrome.runtime.lastError.message, 'error');
        return;
      }

      if (response && response.success) {
        console.log('LinkedIn job data saved successfully:', jobData.title);
        showNotification('✅ Data lamaran LinkedIn berhasil disimpan!', 'success');
      } else {
        console.error('Failed to save LinkedIn job data. Response:', response);
        showNotification('❌ Gagal menyimpan data lamaran LinkedIn', 'error');
      }
    });
  } catch (error) {
    console.error('Error sending message to background script:', error);
    showNotification('❌ Error komunikasi extension: ' + error.message, 'error');
  }
}

// Fungsi untuk menampilkan notifikasi dengan styling LinkedIn yang diperbaiki
function showNotification(message, type = 'info') {
  const existingNotification = document.getElementById('linkedin-job-tracker-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.id = 'linkedin-job-tracker-notification';
  
  let backgroundColor;
  switch(type) {
    case 'success':
      backgroundColor = '#057642';
      break;
    case 'error':
      backgroundColor = '#CC1016';
      break;
    case 'warning':
      backgroundColor = '#F5C75D';
      break;
    default:
      backgroundColor = '#0077b5';
  }
  
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 16px 20px;
    background-color: ${backgroundColor};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
    font-size: 14px;
    font-weight: 500;
    max-width: 350px;
    transition: all 0.3s ease;
    line-height: 1.4;
    border-left: 4px solid rgba(255, 255, 255, 0.3);
    animation: slideInRight 0.3s ease-out;
  `;
  
  const brandIndicator = document.createElement('div');
  brandIndicator.style.cssText = `
    display: inline-block;
    background-color: #0077b5;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: bold;
    margin-right: 8px;
    vertical-align: middle;
  `;
  brandIndicator.textContent = 'LINKEDIN';
  
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  
  notification.appendChild(brandIndicator);
  notification.appendChild(messageSpan);

  // Add animation styles if not exist
  if (!document.getElementById('linkedin-notification-animations')) {
    const style = document.createElement('style');
    style.id = 'linkedin-notification-animations';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  const timeout = type === 'warning' ? 4000 : 3000;
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, timeout);
}

// Fungsi untuk mendeteksi tipe halaman LinkedIn yang diperbaiki
function detectLinkedInPageType() {
  const url = window.location.href;
  
  // Halaman detail job
  if (url.includes('/jobs/view/') || url.includes('currentJobId=')) {
    return 'job_detail';
  }
  
  // Halaman sukses apply
  if (url.includes('/jobs/search/post-apply/') || url.includes('postApplyJobId=')) {
    return 'post_apply';
  }
  
  // Halaman pencarian job
  if (url.includes('/jobs/search/')) {
    return 'job_search';
  }
  
  // Halaman aplikasi
  if (url.includes('/jobs/applications/')) {
    return 'applications';
  }
  
  return 'other';
}

// Fungsi untuk menambahkan tombol manual save yang diperbaiki
function addManualSaveButton() {
  if (document.getElementById('linkedin-manual-save-job-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'linkedin-manual-save-job-btn';
  button.innerHTML = '💼 Simpan Data Lamaran';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #0077b5, #005885);
    color: white;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0, 119, 181, 0.3);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.background = 'linear-gradient(135deg, #005885, #004067)';
    button.style.transform = 'translateY(-2px) scale(1.05)';
    button.style.boxShadow = '0 6px 16px rgba(0, 119, 181, 0.4)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.background = 'linear-gradient(135deg, #0077b5, #005885)';
    button.style.transform = 'translateY(0) scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(0, 119, 181, 0.3)';
  });
  
  button.addEventListener('click', () => {
    console.log('Manual save button clicked');
    button.innerHTML = '⏳ Menyimpan...';
    button.disabled = true;
    
    setTimeout(() => {
      const jobData = extractJobData();
      
      // Force minimal data if nothing found
      if (!jobData.id && !jobData.title && !jobData.company) {
        // Try to get job ID from URL as fallback
        const urlMatch = window.location.href.match(/(\d{10})/);
        if (urlMatch) {
          jobData.id = urlMatch[1];
          jobData.title = `LinkedIn Job ${urlMatch[1]}`;
          jobData.company = 'LinkedIn Job';
          jobData.needsUpdate = true;
        }
      }
      
      if (jobData.id || jobData.title || jobData.company) {
        saveJobData(jobData);
      } else {
        console.error('No data could be extracted');
        showNotification('❌ Tidak dapat mengekstrak data dari halaman ini', 'error');
      }
      
      button.innerHTML = '💼 Simpan Data Lamaran';
      button.disabled = false;
    }, 1000);
  });

  document.body.appendChild(button);
}

// Fungsi untuk mendeteksi tombol apply yang diperbaiki
function detectApplyButton() {
  const applyButtonSelectors = [
    '.jobs-apply-button',
    '[data-control-name="jobdetails_topcard_inapply"]',
    '.jobs-s-apply--top-card',
    'button[aria-label*="Apply"]',
    '.jobs-apply-button--top-card',
    '.jobs-details-top-card .jobs-apply-button',
    'button[data-control-name*="apply"]',
    '.job-details-module .jobs-apply-button'
  ];
  
  for (const selector of applyButtonSelectors) {
    const applyButtons = document.querySelectorAll(selector);
    applyButtons.forEach((applyButton) => {
      if (applyButton && !applyButton.hasAttribute('linkedin-tracker-listener')) {
        applyButton.setAttribute('linkedin-tracker-listener', 'true');
        
        applyButton.addEventListener('click', () => {
          console.log('LinkedIn apply button clicked');
          showNotification('📝 Aplikasi terdeteksi, menyimpan data...', 'info');
          
          setTimeout(() => {
            const jobData = extractJobData();
            if (jobData.id && (jobData.title || jobData.company)) {
              saveJobData(jobData);
            } else if (jobData.id) {
              jobData.title = 'Applied - LinkedIn Job';
              jobData.company = 'Update Required';
              jobData.needsUpdate = true;
              saveJobData(jobData);
            }
          }, 2000);
        });
        
        console.log('Added click listener to LinkedIn apply button:', selector);
      }
    });
  }
}

// Fungsi untuk mendeteksi halaman sukses apply yang diperbaiki
function detectApplySuccess() {
  const successSelectors = [
    '.artdeco-inline-feedback--success',
    '[data-test-id="apply-success"]',
    '.jobs-apply-success',
    '.application-success',
    '.jobs-search__post-apply-success'
  ];
  
  const successTextPatterns = [
    /application\s+sent/i,
    /your\s+application\s+was\s+sent/i,
    /successfully\s+applied/i,
    /application\s+submitted/i
  ];

  // Check for success elements
  for (const selector of successSelectors) {
    const successElement = document.querySelector(selector);
    if (successElement) {
      console.log('LinkedIn apply success detected via selector:', selector);
      handleSuccessfulApplication();
      return true;
    }
  }

  // Check for success text patterns
  const bodyText = document.body.textContent;
  for (const pattern of successTextPatterns) {
    if (pattern.test(bodyText)) {
      console.log('LinkedIn apply success detected via text pattern');
      handleSuccessfulApplication();
      return true;
    }
  }

  // Check URL for post-apply pattern
  if (window.location.href.includes('/jobs/search/post-apply/') || 
      window.location.href.includes('postApplyJobId=')) {
    console.log('LinkedIn apply success detected via URL pattern');
    handleSuccessfulApplication();
    return true;
  }

  return false;
}

// Handler untuk aplikasi yang berhasil
function handleSuccessfulApplication() {
  showNotification('🎉 Aplikasi berhasil! Menyimpan data...', 'success');
  
  setTimeout(() => {
    const jobData = extractJobData();
    if (jobData.id) {
      if (!jobData.title || !jobData.company) {
        jobData.title = jobData.title || 'Applied Job - LinkedIn';
        jobData.company = jobData.company || 'Company Name Required';
        jobData.needsUpdate = true;
      }
      saveJobData(jobData);
    }
  }, 1500);
}

// Fungsi untuk menghandle dynamic content LinkedIn yang diperbaiki
function handleLinkedInDynamicContent() {
  const observer = new MutationObserver((mutations) => {
    let shouldRecheck = false;
    
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const nodeClasses = node.className ? node.className.toString() : '';
            const relevantClasses = [
              'jobs-search-results', 'jobs-details', 'jobs-apply-button',
              'job-details-module', 'jobs-unified-top-card', 'artdeco-inline-feedback'
            ];
            
            if (relevantClasses.some(cls => nodeClasses.includes(cls))) {
              shouldRecheck = true;
            }
          }
        });
      }
    });
    
    if (shouldRecheck) {
      setTimeout(() => {
        detectApplyButton();
        detectApplySuccess();
      }, 1000);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-test-id', 'data-control-name']
  });
}

// Auto-detect dan ekstrak data yang diperbaiki
function autoDetectAndExtract() {
  const pageType = detectLinkedInPageType();
  console.log('LinkedIn page type detected:', pageType);
  
  setTimeout(() => {
    if (pageType === 'job_detail' || pageType === 'job_search') {
      addManualSaveButton();
      detectApplyButton();
    }
    
    if (pageType === 'post_apply') {
      detectApplySuccess();
    }
  }, 1000);
  
  // Recheck after additional delay for dynamic content
  setTimeout(() => {
    detectApplyButton();
    detectApplySuccess();
  }, 3000);
}

// Initialize script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    autoDetectAndExtract();
    handleLinkedInDynamicContent();
  });
} else {
  autoDetectAndExtract();
  handleLinkedInDynamicContent();
}

// Monitor URL changes untuk SPA navigation
let currentLinkedInUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== currentLinkedInUrl) {
    currentLinkedInUrl = window.location.href;
    console.log('LinkedIn URL changed to:', currentLinkedInUrl);
    
    // Clean up existing elements
    const existingButton = document.getElementById('linkedin-manual-save-job-btn');
    if (existingButton) existingButton.remove();
    
    // Re-run detection
    setTimeout(autoDetectAndExtract, 1500);
  }
});

urlObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Handle navigation events
window.addEventListener('popstate', () => {
  setTimeout(autoDetectAndExtract, 1000);
});

// Override pushState untuk mendeteksi navigasi programmatik
const originalPushState = history.pushState;
history.pushState = function() {
  originalPushState.apply(history, arguments);
  setTimeout(autoDetectAndExtract, 1000);
};

const originalReplaceState = history.replaceState;
history.replaceState = function() {
  originalReplaceState.apply(history, arguments);
  setTimeout(autoDetectAndExtract, 1000);
};

// Test function untuk debugging manual
function testLinkedInExtraction() {
  console.log('=== MANUAL TEST LINKEDIN EXTRACTION ===');
  console.log('Extension available:', typeof chrome !== 'undefined' && !!chrome.runtime);
  
  const jobData = extractJobData();
  
  console.log('Test extraction result:', {
    hasId: !!jobData.id,
    hasTitle: !!jobData.title,
    hasCompany: !!jobData.company,
    data: jobData
  });
  
  // Test save if data exists
  if (jobData.id || jobData.title || jobData.company) {
    console.log('Testing save function...');
    saveJobData(jobData);
  } else {
    console.log('No data found to save');
  }
}

// Make test function globally available
window.testLinkedInExtraction = testLinkedInExtraction;