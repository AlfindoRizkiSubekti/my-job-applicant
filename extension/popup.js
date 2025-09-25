// popup.js - Job Application Auto Tracker
console.log('Job Application Auto Tracker: Popup script loaded');

// Global variables
let allJobApplications = [];
let currentFilter = 'all';

// DOM Elements
const jobStreetCount = document.getElementById('jobstreet-count');
const linkedInCount = document.getElementById('linkedin-count');
const totalCount = document.getElementById('total-count');
const jobList = document.getElementById('job-list');
const emptyState = document.getElementById('empty-state');
const filterButtons = document.querySelectorAll('.filter-btn');

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup DOM loaded');
  loadJobApplications();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Filter button listeners
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const platform = e.target.getAttribute('data-platform');
      setActiveFilter(platform);
      filterJobApplications(platform);
    });
  });
}

// Load job applications from storage
async function loadJobApplications() {
  try {
    console.log('Loading job applications...');
    
    // Send message to background script to get applications
    chrome.runtime.sendMessage({ action: 'getJobApplications' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        showEmptyState();
        return;
      }

      if (response && response.success) {
        console.log('Applications loaded:', response.data);
        allJobApplications = response.data || [];
        updateUI();
      } else {
        console.error('Failed to load applications:', response);
        showEmptyState();
      }
    });
  } catch (error) {
    console.error('Error loading job applications:', error);
    showEmptyState();
  }
}

// Update UI with current data
function updateUI() {
  updateStats();
  filterJobApplications(currentFilter);
}

// Update statistics cards
function updateStats() {
  const jobStreetJobs = allJobApplications.filter(job => job.platform === 'jobstreet');
  const linkedInJobs = allJobApplications.filter(job => job.platform === 'linkedin');
  
  jobStreetCount.textContent = jobStreetJobs.length;
  linkedInCount.textContent = linkedInJobs.length;
  totalCount.textContent = allJobApplications.length;
}

// Filter job applications by platform
function filterJobApplications(platform) {
  currentFilter = platform;
  
  let filteredJobs;
  if (platform === 'all') {
    filteredJobs = allJobApplications;
  } else {
    filteredJobs = allJobApplications.filter(job => job.platform === platform);
  }
  
  renderJobList(filteredJobs);
}

// Set active filter button
function setActiveFilter(platform) {
  filterButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-platform') === platform) {
      btn.classList.add('active');
    }
  });
}

// Render job list
function renderJobList(jobs) {
  if (jobs.length === 0) {
    showEmptyState();
    return;
  }
  
  hideEmptyState();
  
  jobList.innerHTML = '';
  
  jobs.forEach(job => {
    const jobElement = createJobElement(job);
    jobList.appendChild(jobElement);
  });
}

// Create individual job element
function createJobElement(job) {
  const jobItem = document.createElement('div');
  jobItem.className = `job-item ${job.platform}`;
  
  // Format date
  const appliedDate = new Date(job.appliedDate);
  const formattedDate = appliedDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Get status indicator
  const statusClass = getStatusClass(job.status);
  
  // Create job HTML
  jobItem.innerHTML = `
    <div class="job-header">
      <h3 class="job-title">${escapeHtml(job.title || 'Judul tidak tersedia')}</h3>
      <span class="platform-badge ${job.platform}">${job.platform.toUpperCase()}</span>
    </div>
    <div class="job-company">${escapeHtml(job.company || 'Perusahaan tidak tersedia')}</div>
    ${job.location ? `<div class="job-location">📍 ${escapeHtml(job.location)}</div>` : ''}
    ${job.salary ? `<div class="job-salary">💰 ${escapeHtml(job.salary)}</div>` : ''}
    <div class="job-date">
      <span class="status-indicator ${statusClass}"></span>
      Dilamar: ${formattedDate}
      ${job.needsUpdate ? ' <span style="color: #ff9800; font-weight: bold;">(Perlu Update)</span>' : ''}
    </div>
    <div class="job-actions">
      <button class="action-btn view-btn" data-url="${job.url}" data-id="${job.id}" data-platform="${job.platform}">
        👁️ Lihat Detail
      </button>
      <button class="action-btn delete-btn" data-id="${job.id}" data-platform="${job.platform}">
        🗑️ Hapus
      </button>
    </div>
  `;
  
  // Add event listeners to buttons
  const viewBtn = jobItem.querySelector('.view-btn');
  const deleteBtn = jobItem.querySelector('.delete-btn');
  
  viewBtn.addEventListener('click', (e) => {
    const url = e.target.getAttribute('data-url');
    if (url) {
      chrome.tabs.create({ url: url });
      window.close(); // Close popup after opening tab
    }
  });
  
  deleteBtn.addEventListener('click', (e) => {
    const jobId = e.target.getAttribute('data-id');
    const platform = e.target.getAttribute('data-platform');
    deleteJobApplication(jobId, platform);
  });
  
  return jobItem;
}

// Get status CSS class
function getStatusClass(status) {
  switch (status) {
    case 'applied':
      return 'status-applied';
    case 'interview':
      return 'status-interview';
    case 'rejected':
      return 'status-rejected';
    case 'offer':
      return 'status-offer';
    default:
      return 'status-applied';
  }
}

// Delete job application
function deleteJobApplication(jobId, platform) {
  if (confirm('Apakah Anda yakin ingin menghapus data lamaran ini?')) {
    chrome.runtime.sendMessage({
      action: 'deleteJobApplication',
      id: jobId,
      platform: platform
    }, (response) => {
      if (response && response.success) {
        console.log('Job application deleted successfully');
        loadJobApplications(); // Reload data
      } else {
        console.error('Failed to delete job application:', response);
        alert('Gagal menghapus data lamaran. Silakan coba lagi.');
      }
    });
  }
}

// Show empty state
function showEmptyState() {
  jobList.style.display = 'none';
  emptyState.style.display = 'block';
}

// Hide empty state
function hideEmptyState() {
  jobList.style.display = 'block';
  emptyState.style.display = 'none';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Add refresh functionality
function refreshData() {
  console.log('Refreshing data...');
  loadJobApplications();
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Press R to refresh
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    refreshData();
  }
  
  // Press 1, 2, 3 for filters
  if (e.key === '1') {
    setActiveFilter('all');
    filterJobApplications('all');
  } else if (e.key === '2') {
    setActiveFilter('jobstreet');
    filterJobApplications('jobstreet');
  } else if (e.key === '3') {
    setActiveFilter('linkedin');
    filterJobApplications('linkedin');
  }
});

// Handle runtime errors
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      console.error('Port disconnected:', chrome.runtime.lastError);
    }
  });
});

// Add click tracking for analytics (optional)
function trackClick(action, platform = null) {
  console.log(`User action: ${action}${platform ? ` (${platform})` : ''}`);
}

// Enhanced error handling for message passing
function sendMessageWithRetry(message, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    
    function attempt() {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          retries++;
          if (retries < maxRetries) {
            console.log(`Retrying message (${retries}/${maxRetries}):`, chrome.runtime.lastError);
            setTimeout(attempt, 100 * retries); // Exponential backoff
          } else {
            reject(new Error(chrome.runtime.lastError.message));
          }
        } else {
          resolve(response);
        }
      });
    }
    
    attempt();
  });
}

// Add tooltips for better UX
function addTooltips() {
  const tooltipElements = [
    { selector: '.view-btn', text: 'Buka halaman detail pekerjaan' },
    { selector: '.delete-btn', text: 'Hapus data lamaran ini' },
    { selector: '.filter-btn', text: 'Filter berdasarkan platform' }
  ];
  
  tooltipElements.forEach(({ selector, text }) => {
    document.querySelectorAll(selector).forEach(el => {
      el.title = text;
    });
  });
}

// Auto-refresh data every 30 seconds when popup is open
let refreshInterval;
function startAutoRefresh() {
  refreshInterval = setInterval(() => {
    loadJobApplications();
  }, 30000); // 30 seconds
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
}

// Start auto-refresh when popup opens
window.addEventListener('focus', startAutoRefresh);
window.addEventListener('blur', stopAutoRefresh);

// Cleanup when popup closes
window.addEventListener('beforeunload', () => {
  stopAutoRefresh();
});