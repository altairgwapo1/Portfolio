document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const menuIcon = document.getElementById('menu-icon');
  const navbar = document.querySelector('.navbar');

  if (!lightbox || !lightboxImg || !closeBtn) return;

  // Mobile menu toggle: open/close nav panel, close on link click or resize
  if (menuIcon && navbar) {
    // set accessibility hints
    menuIcon.setAttribute('role', 'button');
    menuIcon.setAttribute('aria-controls', 'main-nav');
    menuIcon.setAttribute('aria-expanded', 'false');
    menuIcon.addEventListener('click', () => {
      navbar.classList.toggle('open');
      const isOpen = navbar.classList.contains('open');
      menuIcon.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    navbar.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (navbar.classList.contains('open')) {
          navbar.classList.remove('open');
          menuIcon.setAttribute('aria-expanded', 'false');
        }
      });
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && navbar.classList.contains('open')) {
        navbar.classList.remove('open');
        menuIcon.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Per-card carousel initialization
  document.querySelectorAll('.journal-carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.querySelectorAll('img'));
    let idx = 0;

    function show(i){
      slides.forEach((s, k) => s.classList.toggle('active', k === i));
    }

    show(idx);

    const prev = carousel.querySelector('.carousel-prev');
    const next = carousel.querySelector('.carousel-next');

    prev.addEventListener('click', () => { idx = (idx - 1 + slides.length) % slides.length; show(idx); });
    next.addEventListener('click', () => { idx = (idx + 1) % slides.length; show(idx); });

    // Clicking a slide opens the lightbox with the carousel's images
    slides.forEach((slideEl, slideIndex) => {
      slideEl.addEventListener('click', () => {
        openLightboxWith(slides.map(s => s.src), slideIndex);
      });
    });
  });

  // For single-image cards: fall back to existing behavior
  document.querySelectorAll('.journal-card img').forEach(img => {
    img.addEventListener('click', (e) => {
      // if this image is inside a carousel, carousel handler will already open lightbox
      if (img.closest('.journal-carousel')) return;
      openLightboxWith([img.src], 0);
    });
  });

  /* Gallery carousel initialization + autoplay */
  document.querySelectorAll('.gallery-carousel').forEach(carousel => {
    const track = carousel.querySelector('.gtrack');
    const slides = Array.from(track.querySelectorAll('.gslide'));
    const prev = carousel.querySelector('.gprev');
    const next = carousel.querySelector('.gnext');
    let idx = 0;
    let timer = null;
    let pauseTimeout = null;
    const AUTOPLAY_DELAY = 3000; // 3s between slides
    const PAUSE_AFTER_CLICK = 3500; // pause 3.5s after click

    function slidesToShow(){
      const w = window.innerWidth;
      if (w >= 900) return 3;
      if (w >= 600) return 2;
      return 1;
    }

    function update(){
      const slideEl = slides[0];
      if (!slideEl) return;
      const slideWidth = slideEl.getBoundingClientRect().width || 0;
      track.style.transform = `translateX(${-(idx * slideWidth)}px)`;
    }

    function clampIndex(i){
      const max = Math.max(0, slides.length - slidesToShow());
      if (i < 0) return max; // wrap to end
      if (i > max) return 0; // wrap to start
      return i;
    }

    function startAutoplay(){
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        idx = clampIndex(idx + 1);
        update();
      }, AUTOPLAY_DELAY);
    }

    function pauseAutoplayFor(ms){
      if (timer) { clearInterval(timer); timer = null; }
      if (pauseTimeout) clearTimeout(pauseTimeout);
      pauseTimeout = setTimeout(() => { startAutoplay(); pauseTimeout = null; }, ms);
    }

    // Initial layout
    window.addEventListener('resize', () => { idx = clampIndex(idx); update(); });
    window.addEventListener('load', () => { update(); });
    update();
    startAutoplay();

    prev.addEventListener('click', () => { idx = clampIndex(idx - 1); update(); pauseAutoplayFor(AUTOPLAY_DELAY * 1.2); });
    next.addEventListener('click', () => { idx = clampIndex(idx + 1); update(); pauseAutoplayFor(AUTOPLAY_DELAY * 1.2); });

    // Clicking a slide opens the lightbox and pauses autoplay briefly
    slides.forEach((s, i) => {
      const img = s.querySelector('img');
      if (!img) return;
      img.addEventListener('click', () => {
        // open lightbox with all gallery image sources
        const list = slides.map(x => x.querySelector('img')?.src).filter(Boolean);
        openLightboxWith(list, i);
        pauseAutoplayFor(PAUSE_AFTER_CLICK);
      });
    });
  });

  // Lightbox controller
  let currentList = [];
  let currentIndex = 0;

  function openLightboxWith(list, index){
    currentList = list;
    currentIndex = index;
    lightboxImg.src = currentList[currentIndex];
    lightboxImg.alt = '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    // clear src to stop large image from lingering
    setTimeout(() => lightboxImg.src = '', 200);
    currentList = [];
    currentIndex = 0;
  }

  closeBtn.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Lightbox prev/next
  if (prevBtn && nextBtn){
    prevBtn.addEventListener('click', () => {
      if (!currentList.length) return;
      currentIndex = (currentIndex - 1 + currentList.length) % currentList.length;
      lightboxImg.src = currentList[currentIndex];
    });
    nextBtn.addEventListener('click', () => {
      if (!currentList.length) return;
      currentIndex = (currentIndex + 1) % currentList.length;
      lightboxImg.src = currentList[currentIndex];
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && lightbox.classList.contains('open')){
      if (!currentList.length) return;
      if (e.key === 'ArrowLeft'){ currentIndex = (currentIndex - 1 + currentList.length) % currentList.length; }
      if (e.key === 'ArrowRight'){ currentIndex = (currentIndex + 1) % currentList.length; }
      lightboxImg.src = currentList[currentIndex];
    }
  });

  // Contact form handling
  const contactForm = document.getElementById('contact-form');
  const contactSuccess = document.getElementById('contact-success');
  if (contactForm){
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const name = data.get('name')?.toString().trim();
      const email = data.get('email')?.toString().trim();
      const message = data.get('message')?.toString().trim();

      if (!name || !email || !message){
        contactSuccess.hidden = false;
        contactSuccess.textContent = 'Please fill in required fields.';
        contactSuccess.style.color = '#f8b4a6';
        setTimeout(() => { contactSuccess.hidden = true; }, 2400);
        return;
      }

      // Simulate send
      contactSuccess.hidden = false;
      contactSuccess.textContent = 'Sending message...';
      contactSuccess.style.color = '#cfe9d3';

      // Simulate an async send and then clear
      setTimeout(() => {
        contactSuccess.textContent = 'Message sent. Thank you!';
        form.reset();
        setTimeout(() => { contactSuccess.hidden = true; }, 2600);
      }, 900);
    });
  }

});