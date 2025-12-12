(function () {
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  const CONTACT = {
    phoneLabel: '📞 Teléfono: 5512027462',
    phoneNumber: '5512027462',
    whatsappLabel: '💬 WhatsApp',
    whatsappNumber: '5512027462',
    whatsappMessage: 'Hola, estoy a la orden. ¿En qué puedo ayudarte?',
    emailLabel: '✉️ Correo',
    email: 'contacto@ejemplo.com',
  };

  const digitsOnly = (v) => String(v || '').replace(/\D+/g, '');

  // Year
  const y = qs('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());

  // Header elevate on scroll
  const header = qs('[data-elevate]');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-elevated', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav
  const toggle = qs('.nav__toggle');
  const menu = qs('#navMenu');

  const closeMenu = () => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
  };

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    qsa('a', menu).forEach((a) => a.addEventListener('click', closeMenu));

    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('is-open')) return;
      const t = e.target;
      if (t instanceof Node && !menu.contains(t) && !toggle.contains(t)) closeMenu();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // Reveal on scroll
  const revealEls = qsa('[data-reveal]');
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  // Lightbox
  const lb = qs('[data-lightbox]');
  const lbImg = lb ? qs('.lightbox__img', lb) : null;
  const lbClose = lb ? qs('.lightbox__close', lb) : null;
  const lbBack = lb ? qs('.lightbox__back', lb) : null;
  const lbPrev = lb ? qs('.lightbox__nav--prev', lb) : null;
  const lbNext = lb ? qs('.lightbox__nav--next', lb) : null;

  const galleryButtons = qsa('[data-gallery] .gItem');
  const sources = galleryButtons.map((b) => b.getAttribute('data-src')).filter(Boolean);
  let index = 0;
  let lastFocus = null;

  const setImage = (i) => {
    if (!lbImg) return;
    index = (i + sources.length) % sources.length;
    lbImg.src = sources[index];
  };

  const openLightbox = (i) => {
    if (!lb || !lbImg || !sources.length) return;
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    setImage(i);
    if (lbClose) lbClose.focus();
  };

  const closeLightbox = () => {
    if (!lb) return;
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lbImg) lbImg.src = '';
    if (lastFocus && lastFocus instanceof HTMLElement) lastFocus.focus();
  };

  galleryButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => openLightbox(i));
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbBack) lbBack.addEventListener('click', closeLightbox);

  if (lbPrev) lbPrev.addEventListener('click', () => setImage(index - 1));
  if (lbNext) lbNext.addEventListener('click', () => setImage(index + 1));

  window.addEventListener('keydown', (e) => {
    if (!lb || lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') setImage(index - 1);
    if (e.key === 'ArrowRight') setImage(index + 1);
  });

  // Direct contact buttons
  const contactLinks = qsa('[data-contact-link]');
  if (contactLinks.length) {
    const phoneDigits = digitsOnly(CONTACT.phoneNumber);
    const whatsappDigits = digitsOnly(CONTACT.whatsappNumber);
    const email = String(CONTACT.email || '').trim();
    const whatsappText = encodeURIComponent(String(CONTACT.whatsappMessage || '').trim());

    const map = {
      phone: {
        ok: Boolean(phoneDigits),
        href: phoneDigits ? `tel:${phoneDigits}` : '#',
        label: CONTACT.phoneLabel || (CONTACT.phoneNumber ? CONTACT.phoneNumber : 'Teléfono'),
      },
      whatsapp: {
        ok: Boolean(whatsappDigits),
        href: whatsappDigits ? `https://wa.me/${whatsappDigits}${whatsappText ? `?text=${whatsappText}` : ''}` : '#',
        label: CONTACT.whatsappLabel || (CONTACT.whatsappNumber ? CONTACT.whatsappNumber : 'WhatsApp'),
      },
      email: {
        ok: Boolean(email),
        href: email ? `mailto:${email}` : '#',
        label: CONTACT.emailLabel || (CONTACT.email ? CONTACT.email : 'Correo'),
      },
    };

    contactLinks.forEach((a) => {
      const key = a.getAttribute('data-contact-link');
      const conf = key && key in map ? map[key] : null;
      if (!conf) return;
      if (!conf.ok) {
        a.hidden = true;
        a.setAttribute('aria-hidden', 'true');
        return;
      }
      a.hidden = false;
      a.removeAttribute('aria-hidden');
      a.setAttribute('href', conf.href);
      a.textContent = conf.label;
      if (key === 'whatsapp') a.setAttribute('target', '_blank');
      if (key === 'whatsapp') a.setAttribute('rel', 'noreferrer noopener');
    });
  }

  // Form validation (basic) + mailto fallback
  const form = qs('[data-form]');
  const hint = qs('[data-formHint]');

  const setHint = (msg, ok = false) => {
    if (!hint) return;
    hint.textContent = msg;
    hint.style.color = ok ? 'var(--accent)' : 'var(--muted)';
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const nombre = String(fd.get('nombre') || '').trim();
      const correo = String(fd.get('correo') || '').trim();
      const motivo = String(fd.get('motivo') || '').trim();
      const mensaje = String(fd.get('mensaje') || '').trim();

      if (nombre.length < 2) return setHint('Escribe tu nombre (mínimo 2 caracteres).');
      if (!correo.includes('@')) return setHint('Escribe un correo válido.');
      if (!motivo) return setHint('Selecciona un motivo.');
      if (mensaje.length < 10) return setHint('Escribe un mensaje un poco más largo (mínimo 10 caracteres).');

      setHint('Listo. Abriendo tu correo para enviar el mensaje…', true);

      const subject = encodeURIComponent(`Contacto CEy (${motivo})`);
      const body = encodeURIComponent(`Nombre: ${nombre}\nCorreo: ${correo}\nMotivo: ${motivo}\n\nMensaje:\n${mensaje}`);

      // Cambia el destinatario aquí si ya tienes correo
      const to = String(CONTACT.email || '').trim();
      const mailto = `mailto:${to}?subject=${subject}&body=${body}`;
      window.location.href = mailto;

      form.reset();
      setTimeout(() => setHint('Si no se abrió tu app de correo, copia el mensaje y envíalo por tu canal preferido.', true), 900);
    });
  }

  // PWA: Service Worker (solo funciona en http/https o localhost)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const isHttp = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (!isHttp) return;
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    });
  }
})();
