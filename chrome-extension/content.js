/* Reachly Content Script — LinkedIn integration */
(function() {
  // Only run on LinkedIn profile pages
  if (!window.location.href.includes('/in/')) return;

  // Create floating action button
  const fab = document.createElement('div');
  fab.id = 'reachly-fab';
  fab.innerHTML = '⚡';
  fab.title = 'Save to Reachly';
  fab.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; width: 48px; height: 48px;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    color: white; font-size: 20px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 4px 20px rgba(59,130,246,0.4);
    z-index: 9999; transition: transform 0.2s;
  `;
  fab.onmouseenter = () => fab.style.transform = 'scale(1.1)';
  fab.onmouseleave = () => fab.style.transform = 'scale(1)';
  fab.onclick = () => {
    // Extract profile data
    const name = document.querySelector('h1')?.textContent?.trim() || '';
    const headline = document.querySelector('.text-body-medium')?.textContent?.trim() || '';
    const [firstName, ...lastParts] = name.split(' ');
    const lastName = lastParts.join(' ');

    // Notify popup
    chrome.runtime.sendMessage({
      type: 'LINKEDIN_PROFILE',
      data: { firstName, lastName, headline, url: window.location.href },
    });

    // Visual feedback
    fab.innerHTML = '✓';
    fab.style.background = '#22c55e';
    setTimeout(() => { fab.innerHTML = '⚡'; fab.style.background = 'linear-gradient(135deg, #3b82f6, #6366f1)'; }, 2000);
  };

  document.body.appendChild(fab);
})();
