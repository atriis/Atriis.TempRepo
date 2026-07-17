// QA Automation Field Guide — shell interactions only.
// No repository scanning or data loading happens here; all Repository Explorer
// items come from the static markup already in index.html.

(function () {
  // Step Explorer button appears in the header on every page. Navigate to the
  // explorer page, resolving the correct relative path from chapters/ or root.
  const stepExplorerBtn = document.getElementById('stepExplorerBtn');
  if (stepExplorerBtn && stepExplorerBtn.getAttribute('aria-current') !== 'page') {
    stepExplorerBtn.addEventListener('click', () => {
      const prefix = window.location.pathname.includes('/chapters/') ? '../' : '';
      window.location.href = prefix + 'step-explorer.html';
    });
  }

  const repoPanel = document.getElementById('repoPanel');
  const repoToggle = document.getElementById('repoToggle');

  if (repoToggle && repoPanel) {
    repoToggle.addEventListener('click', () => {
      const isOpen = repoPanel.classList.toggle('is-open');
      repoToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const infoCard = document.getElementById('infoCard');
  const infoBackdrop = document.getElementById('infoBackdrop');
  const infoCardTitle = document.getElementById('infoCardTitle');
  const infoCardLocation = document.getElementById('infoCardLocation');
  const infoCardClose = document.getElementById('infoCardClose');

  function openInfoCard(node) {
    const name = node.getAttribute('data-name');
    const type = node.getAttribute('data-type');
    infoCardTitle.textContent = name;
    infoCardLocation.textContent = type === 'folder' ? `${name} (folder, repository root)` : `${name} (file, repository root)`;
    infoCard.hidden = false;
    infoBackdrop.classList.add('is-open');

    document.querySelectorAll('.repo-node[aria-selected="true"]').forEach((el) => el.removeAttribute('aria-selected'));
    node.setAttribute('aria-selected', 'true');

    infoCardClose.focus();
  }

  function closeInfoCard() {
    infoCard.hidden = true;
    infoBackdrop.classList.remove('is-open');
  }

  document.querySelectorAll('.repo-node').forEach((node) => {
    node.addEventListener('click', () => {
      if (node.getAttribute('data-type') === 'folder') {
        const expanded = node.getAttribute('aria-expanded') === 'true';
        node.setAttribute('aria-expanded', String(!expanded));
        const twisty = node.querySelector('.twisty');
        if (twisty) twisty.textContent = expanded ? '▸' : '▾';
      }
      openInfoCard(node);
    });
  });

  if (infoCardClose) infoCardClose.addEventListener('click', closeInfoCard);
  if (infoBackdrop) infoBackdrop.addEventListener('click', closeInfoCard);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !infoCard.hidden) {
      closeInfoCard();
    }
  });

  const tocMenu = document.getElementById('tocMenu');
  const tocTrigger = document.getElementById('tocMenuTrigger');
  const tocDropdown = document.getElementById('tocDropdown');

  if (tocMenu && tocTrigger && tocDropdown) {
    tocTrigger.addEventListener('click', (event) => {
      event.preventDefault();
      const isOpen = tocDropdown.classList.toggle('is-open');
      tocTrigger.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (event) => {
      if (!tocMenu.contains(event.target)) {
        tocDropdown.classList.remove('is-open');
        tocTrigger.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && tocDropdown.classList.contains('is-open')) {
        tocDropdown.classList.remove('is-open');
        tocTrigger.setAttribute('aria-expanded', 'false');
        tocTrigger.focus();
      }
    });
  }
})();
