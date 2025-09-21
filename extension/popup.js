// Popup script untuk Job Application Auto Tracker
document.addEventListener('DOMContentLoaded', function() {
  console.log('Job Tracker popup loaded');
  
  // Elements
  const totalApplicationsEl = document.getElementById('totalApplications');
  const applicationsListEl = document.getElementById('applicationsList');
  const emptyStateEl = document.getElementById('emptyState');
  const loadingEl = document.getElementById('loading');
  const searchInputEl = document.getElementById('searchInput');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const confirmModal = document.getElementById('confirmModal');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');
  const confirmMessage = document.getElementById('confirmMessage');
  
  let allApplications = [];
  let filteredApplications = [];
  let currentAction = null;
  
  // Initialize popup
  init();
  
  async function init() {
    showLoading(true);
    await loadApplications();
    showLoading(false);
    setupEventListeners();
  }
  
  // Load applications from storage
  async function loadApplications() {
    try {
      const response = await sendMessage({ action: 'getJobApplications' });
      if (response.success) {
        allApplications = response.data;
        filteredApplications = [...allApplications];
        updateUI();
      } else {
        console.error('Failed to load applications');
        showEmptyState(true);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      showEmptyState(true);
    }
  }
  
  // Update UI with current data
  function updateUI() {
    totalApplicationsEl.textContent = allApplications.length;
    
    if (filteredApplications.length === 0) {
      showEmptyState(true);
      return;
    }
    
    showEmptyState(false);
    renderApplications(filteredApplications);
  }
  
  // Render applications list
  function renderApplications(applications) {
    applicationsListEl.innerHTML = '';
    
    applications.forEach(app => {
      const appElement = createApplicationElement(app);
      applicationsListEl.appendChild(appElement);
    });
  }
  
  // Create single application element
  function createApplicationElement(app) {
    const div = document.createElement('div');
    div.className = 'application-item';
    
    // Tambahkan class khusus jika data perlu update
    if (app.needsUpdate) {
      div.classList.add('needs-update');
    }
    
    div.innerHTML = `
      <div class="app-header">
        <div>
          <div class="app-title">${escapeHtml(app.title || 'N/A')}${app.needsUpdate ? ' ⚠️' : ''}</div>
          <div class="app-company">${escapeHtml(app.company || 'N/A')}</div>
        </div>
      </div>
      <div class="app-details">
        <div class="app-location">
          📍 ${escapeHtml(app.location || 'N/A')}
        </div>
        <div class="app-date">
          ${formatDate(app.appliedDate)}
        </div>
      </div>
      ${app.salary ? `<div style="font-size: 11px; color: #28a745; margin-top: 4px;">💰 ${escapeHtml(app.salary)}</div>` : ''}
      ${app.needsUpdate ? '<div class="update-notice">⚠️ Kunjungi halaman detail untuk data lengkap</div>' : ''}
      <div class="app-actions">
        <button class="btn btn-small btn-link" data-url="${app.url || ''}">
          🔗 Lihat
        </button>
        <button class="btn btn-small btn-delete" data-job-id="${app.id}">
          🗑️ Hapus
        </button>
      </div>
    `;
    
    // Add event listeners for buttons
    const linkBtn = div.querySelector('.btn-link');
    const deleteBtn = div.querySelector('.btn-delete');
    
    if (linkBtn) {
      linkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = e.target.getAttribute('data-url');
        openJobUrl(url);
      });
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const jobId = e.target.getAttribute('data-job-id');
        deleteApplication(jobId);
      });
    }
    
    return div;
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Search functionality
    searchInputEl.addEventListener('input', handleSearch);
    
    // Refresh button
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '🔄 Memuat...';
      
      await loadApplications();
      
      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄 Refresh Data';
    });
    
    // Export button
    exportBtn.addEventListener('click', exportToCSV);
    
    // Clear all button
    clearAllBtn.addEventListener('click', () => {
      if (allApplications.length === 0) {
        return;
      }
      
      currentAction = 'clearAll';
      confirmMessage.textContent = `Hapus semua ${allApplications.length} data lamaran? Aksi ini tidak dapat dibatalkan.`;
      showModal(true);
    });
    
    // Modal buttons
    confirmYes.addEventListener('click', handleConfirmYes);
    confirmNo.addEventListener('click', () => showModal(false));
    
    // Close modal when clicking outside
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        showModal(false);
      }
    });
  }
  
  // Handle search
  function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
      filteredApplications = [...allApplications];
    } else {
      filteredApplications = allApplications.filter(app => 
        (app.title && app.title.toLowerCase().includes(query)) ||
        (app.company && app.company.toLowerCase().includes(query)) ||
        (app.location && app.location.toLowerCase().includes(query))
      );
    }
    
    updateUI();
  }
  
  // Handle confirm yes button
  async function handleConfirmYes() {
    showModal(false);
    
    if (currentAction === 'clearAll') {
      try {
        await chrome.storage.local.set({ jobApplications: [] });
        allApplications = [];
        filteredApplications = [];
        updateUI();
        showNotification('✅ Semua data berhasil dihapus', 'success');
      } catch (error) {
        console.error('Error clearing data:', error);
        showNotification('❌ Gagal menghapus data', 'error');
      }
    } else if (currentAction && currentAction.startsWith('delete_')) {
      const jobId = currentAction.replace('delete_', '');
      await handleDeleteApplication(jobId);
    }
    
    currentAction = null;
  }
  
  // Export to CSV
  function exportToCSV() {
    if (allApplications.length === 0) {
      showNotification('❌ Tidak ada data untuk diekspor', 'error');
      return;
    }
    
    const csvContent = generateCSV(allApplications);
    downloadCSV(csvContent, `job_applications_${new Date().getTime()}.csv`);
    showNotification('✅ Data berhasil diekspor', 'success');
  }
  
  // Generate CSV content
  function generateCSV(data) {
    const headers = [
      'Tanggal Lamar',
      'Posisi',
      'Perusahaan',
      'Lokasi',
      'Gaji',
      'Tipe Pekerjaan',
      'Status',
      'URL'
    ];
    
    const rows = data.map(app => [
      formatDateForCSV(app.appliedDate),
      escapeCSV(app.title || ''),
      escapeCSV(app.company || ''),
      escapeCSV(app.location || ''),
      escapeCSV(app.salary || ''),
      escapeCSV(app.jobType || ''),
      escapeCSV(app.status || ''),
      escapeCSV(app.url || '')
    ]);
    
    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
  
  // Download CSV file
  function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // Show/hide loading
  function showLoading(show) {
    loadingEl.style.display = show ? 'block' : 'none';
    applicationsListEl.style.display = show ? 'none' : 'block';
  }
  
  // Show/hide empty state
  function showEmptyState(show) {
    emptyStateEl.style.display = show ? 'block' : 'none';
    applicationsListEl.style.display = show ? 'none' : 'block';
  }
  
  // Show/hide modal
  function showModal(show) {
    confirmModal.style.display = show ? 'block' : 'none';
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    // Simple notification - could be enhanced
    console.log(`Notification [${type}]: ${message}`);
    
    // Create toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 12px 16px;
      background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#6c757d'};
      color: white;
      border-radius: 4px;
      z-index: 1001;
      font-size: 12px;
      max-width: 250px;
      word-wrap: break-word;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }
  
  // Send message to background script
  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
  
  // Utility functions
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function escapeCSV(text) {
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }
  
  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  }
  
  function formatDateForCSV(dateString) {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
      return '';
    }
  }
  
  // Open job URL function
  function openJobUrl(url) {
    if (url && url !== 'undefined' && url !== '') {
      chrome.tabs.create({ url: url });
    } else {
      showNotification('❌ URL tidak tersedia', 'error');
    }
  }
  
  // Delete application function
  function deleteApplication(jobId) {
    currentAction = `delete_${jobId}`;
    const app = allApplications.find(a => a.id === jobId);
    const appTitle = app ? app.title || app.company || 'aplikasi ini' : 'aplikasi ini';
    confirmMessage.textContent = `Hapus data lamaran "${appTitle}"?`;
    showModal(true);
  }
  
  // Handle delete application
  async function handleDeleteApplication(jobId) {
    try {
      const response = await sendMessage({ 
        action: 'deleteJobApplication', 
        jobId: jobId 
      });
      
      if (response.success) {
        // Remove from local arrays
        allApplications = allApplications.filter(app => app.id !== jobId);
        filteredApplications = filteredApplications.filter(app => app.id !== jobId);
        
        updateUI();
        showNotification('✅ Data berhasil dihapus', 'success');
      } else {
        showNotification('❌ Gagal menghapus data', 'error');
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      showNotification('❌ Gagal menghapus data', 'error');
    }
  }
});