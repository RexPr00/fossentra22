(() => {
  const body = document.body;
  const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lockCount = 0;
  const lockBody = () => {
    lockCount += 1;
    body.classList.add('lock-scroll');
  };
  const unlockBody = () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) body.classList.remove('lock-scroll');
  };

  const createFocusTrap = (container, closeFn) => {
    const keyHandler = (event) => {
      if (event.key === 'Escape') {
        closeFn();
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = [...container.querySelectorAll(focusableSelector)].filter((node) => node.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  };

  const drawer = document.querySelector('[data-drawer]');
  const drawerOverlay = document.querySelector('[data-drawer-overlay]');
  const drawerOpenBtn = document.querySelector('[data-open-drawer]');
  const drawerCloseBtn = document.querySelector('[data-close-drawer]');
  let releaseDrawerTrap = null;

  const closeDrawer = () => {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawerOverlay?.classList.remove('show');
    unlockBody();
    if (releaseDrawerTrap) releaseDrawerTrap();
    releaseDrawerTrap = null;
  };
  const openDrawer = () => {
    if (!drawer) return;
    drawer.classList.add('open');
    drawerOverlay?.classList.add('show');
    lockBody();
    releaseDrawerTrap = createFocusTrap(drawer, closeDrawer);
    const target = drawer.querySelector('button, a');
    target?.focus();
  };
  drawerOpenBtn?.addEventListener('click', openDrawer);
  drawerCloseBtn?.addEventListener('click', closeDrawer);
  drawerOverlay?.addEventListener('click', closeDrawer);

  const langBlocks = document.querySelectorAll('[data-lang]');
  langBlocks.forEach((block) => {
    const trigger = block.querySelector('[data-lang-trigger]');
    trigger?.addEventListener('click', () => block.classList.toggle('open'));
  });
  document.addEventListener('click', (event) => {
    langBlocks.forEach((block) => {
      if (!block.contains(event.target)) block.classList.remove('open');
    });
  });

  document.querySelectorAll('[data-lang-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const hash = window.location.hash || '';
      window.location.href = `${link.getAttribute('href')}${hash}`;
    });
  });

  const modal = document.querySelector('[data-modal]');
  const modalOpen = document.querySelector('[data-open-modal]');
  const modalClose = document.querySelectorAll('[data-close-modal]');
  let releaseModalTrap = null;

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    unlockBody();
    if (releaseModalTrap) releaseModalTrap();
    releaseModalTrap = null;
  };
  const openModal = () => {
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    lockBody();
    const dialog = modal.querySelector('.modal-dialog');
    releaseModalTrap = createFocusTrap(dialog, closeModal);
    dialog.querySelector('button, a')?.focus();
  };
  modalOpen?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });
  modalClose.forEach((btn) => btn.addEventListener('click', closeModal));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.querySelectorAll('.accordion-item .accordion-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item').forEach((node) => {
        node.classList.remove('open');
        const btn = node.querySelector('.accordion-trigger');
        btn?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  const revealNodes = document.querySelectorAll('.reveal');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    revealNodes.forEach((node) => revealObserver.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add('in'));
  }

  const animateCounter = (node) => {
    const target = Number(node.dataset.target || 0);
    const suffix = node.dataset.suffix || '';
    const duration = 1300;
    let start;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const value = Math.floor(progress * target);
      node.textContent = `${value.toLocaleString()}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counterNodes = document.querySelectorAll('[data-target]');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.45 });
    counterNodes.forEach((node) => counterObserver.observe(node));
  } else {
    counterNodes.forEach((node) => {
      node.textContent = `${Number(node.dataset.target).toLocaleString()}${node.dataset.suffix || ''}`;
    });
  }

  const bars = document.querySelectorAll('.metric-bar-fill');
  const animateBars = () => {
    bars.forEach((bar) => {
      bar.style.width = `${bar.dataset.value || 0}%`;
    });
  };
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const barObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateBars();
          barObserver.disconnect();
        }
      });
    }, { threshold: 0.4 });
    const targetSection = document.querySelector('#metrics');
    if (targetSection) barObserver.observe(targetSection);
  } else {
    animateBars();
  }

  const toast = document.querySelector('[data-toast]');
  const showToast = () => {
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  };

  document.querySelectorAll('.lead-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const fullName = form.querySelector('[name="name"]');
      const email = form.querySelector('[name="email"]');
      const phone = form.querySelector('[name="phone"]');
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      if (!fullName.value.trim() || !emailValid || phone.value.trim().length < 7) {
        form.reportValidity();
        return;
      }
      form.reset();
      showToast();
    });
  });
})();
