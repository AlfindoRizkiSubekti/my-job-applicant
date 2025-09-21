(function () {
  // Contoh scraping sederhana
  const jobs = [];
  document.querySelectorAll('.job-card').forEach(card => {
    jobs.push({
      title: card.querySelector('.job-title')?.innerText,
      company: card.querySelector('.company-name')?.innerText,
      date: card.querySelector('.applied-date')?.innerText,
    });
  });

  // Simpan ke chrome.storage.local
  chrome.storage.local.set({ jobstreetApplications: jobs }, () => {
    console.log('Data lamaran disimpan:', jobs);
  });
})();
