// Reachly Chrome Extension — Popup Logic

const API_BASE = 'http://localhost:3000';

// Check connection
async function checkConnection() {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  const status = document.getElementById('status');
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      dot.className = 'dot';
      text.textContent = 'Connected to Reachly';
      status.className = 'status';
    } else { throw new Error(); }
  } catch {
    dot.className = 'dot off';
    text.textContent = 'Not connected — start Reachly app';
    status.className = 'status disconnected';
  }
}

// Search contacts
document.getElementById('searchBtn').addEventListener('click', async () => {
  const domain = document.getElementById('domain').value.trim();
  const role = document.getElementById('role').value.trim();
  if (!domain) { alert('Enter a domain'); return; }

  const btn = document.getElementById('searchBtn');
  btn.textContent = '⏳ Searching...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/leads/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, role }),
    });
    const data = await res.json();

    const list = document.getElementById('contactList');
    const results = document.getElementById('results');

    if (data.contacts && data.contacts.length > 0) {
      results.style.display = 'block';
      list.innerHTML = data.contacts.map(c => `
        <div class="lead-card">
          <div class="lead-name">${c.first_name} ${c.last_name}</div>
          <div class="lead-info">${c.position} at ${c.company}</div>
          ${c.email ? `<div class="lead-email">📧 ${c.email} <span class="badge badge-green">${c.confidence}%</span></div>` : ''}
          ${c.linkedin ? `<div class="lead-info"><a href="${c.linkedin}" target="_blank" style="color:#0077b5;">LinkedIn →</a></div>` : ''}
          <div style="margin-top:6px;">
            <span class="badge badge-blue">${c.source}</span>
          </div>
        </div>
      `).join('');
    } else {
      results.style.display = 'block';
      list.innerHTML = '<div class="empty">No contacts found for this domain</div>';
    }
  } catch (e) {
    alert('Search failed: ' + e.message);
  } finally {
    btn.textContent = '🔍 Find Contacts';
    btn.disabled = false;
  }
});

// Check if on LinkedIn and extract profile data
async function checkLinkedIn() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url && tab.url.includes('linkedin.com/in/')) {
      // Try to extract data from the page
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const name = document.querySelector('h1')?.textContent?.trim() || '';
          const headline = document.querySelector('.text-body-medium')?.textContent?.trim() || '';
          const company = document.querySelector('[data-field="experience_company_logo"]')?.closest('li')?.querySelector('span[aria-hidden]')?.textContent?.trim() || '';
          return { name, headline, company, url: window.location.href };
        },
      });

      if (result?.result?.name) {
        const data = result.result;
        const section = document.getElementById('linkedinSection');
        const card = document.getElementById('linkedinCard');
        section.style.display = 'block';
        card.innerHTML = `
          <div class="lead-card">
            <div class="lead-name">${data.name}</div>
            <div class="lead-info">${data.headline}</div>
            ${data.company ? `<div class="lead-info">🏢 ${data.company}</div>` : ''}
          </div>
        `;

        // Pre-fill domain search
        if (data.company) {
          document.getElementById('domain').value = data.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
        }
      }
    }
  } catch { /* Not on LinkedIn or permissions not granted */ }
}

// Init
checkConnection();
checkLinkedIn();
