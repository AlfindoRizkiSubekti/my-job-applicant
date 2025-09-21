// content_scripts/linkedin_content.js
(function () {
  try {
    // contoh kasar: ambil job title, company, link
    const titleEl = document.querySelector('h1') // sesuaikan
    const companyEl = document.querySelector('.topcard__org-name-link') || document.querySelector('.topcard__flavor')
    const job = titleEl ? titleEl.innerText.trim() : ''
    const company = companyEl ? companyEl.innerText.trim() : ''
    const link = window.location.href
    const applyDate = new Date().toISOString().slice(0,10)

    const payload = { company_name: company, position: job, job_link: link, apply_date: applyDate }

    // kirim ke background
    chrome.runtime.sendMessage({ type: 'JOB_CAPTURE', payload }, (resp) => {
      console.log('sent to background', resp)
    })
  } catch (e) {
    console.error('content script error', e)
  }
})();
