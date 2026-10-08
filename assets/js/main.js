/* Characters School · interações da página (reconstruídas, sem dependências externas) */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var I18N = window.CS_I18N || {};
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  root.classList.add('js');

  /* ano e relógio da barra de tarefas */
  var year = $('#year'); if (year) year.textContent = new Date().getFullYear();
  var tray = $('.taskbar .tray');
  function clock() {
    if (!tray) return;
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    tray.textContent = ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' AM' : ' PM');
  }
  clock(); setInterval(clock, 30000);

  /* barra de progresso + barra fixa de compra */
  var progress = $('.progress'), sticky = $('.sticky'), hero = $('.hero'), pricing = $('#pricing'), ticking = false;
  function onScroll() {
    ticking = false;
    var max = root.scrollHeight - innerHeight, y = window.scrollY || root.scrollTop;
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (sticky) {
      var past = hero ? y > hero.offsetHeight * 0.7 : y > 500, inPricing = false;
      if (pricing) { var r = pricing.getBoundingClientRect(); inPricing = r.top < innerHeight * 0.55 && r.bottom > innerHeight * 0.45; }
      sticky.classList.toggle('show', past && !inPricing);
    }
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();

  /* entrada dos blocos ao rolar */
  var reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + 'ms'; io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('in'); }); }

  /* carrossel da turma: anda sozinho e pode ser arrastado */
  $$('[data-marquee]').forEach(function (mq, idx) {
    var track = $('.marquee__track', mq); if (!track) return;
    var dir = idx % 2 ? 1 : -1, speed = 0.45, x = 0, half = 0, dragging = false, lastX = 0, vel = 0, hover = false;
    function measure() { half = track.scrollWidth / 2; if (dir > 0 && x === 0) x = -half; }
    function wrap() { if (!half) return; while (x <= -half) x += half; while (x > 0) x -= half; }
    function frame() {
      if (!dragging) {
        if (Math.abs(vel) > 0.1) { x += vel; vel *= 0.94; }
        else if (!hover && !reduced) x += dir * speed;
      }
      wrap(); track.style.transform = 'translate3d(' + x + 'px,0,0)';
      requestAnimationFrame(frame);
    }
    mq.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; vel = 0; mq.setPointerCapture(e.pointerId); });
    mq.addEventListener('pointermove', function (e) { if (!dragging) return; var dx = e.clientX - lastX; lastX = e.clientX; x += dx; vel = dx; });
    ['pointerup', 'pointercancel'].forEach(function (t) { mq.addEventListener(t, function () { dragging = false; }); });
    mq.addEventListener('mouseenter', function () { hover = true; });
    mq.addEventListener('mouseleave', function () { hover = false; });
    measure(); addEventListener('load', measure); addEventListener('resize', measure);
    requestAnimationFrame(frame);
  });

  /* reels: carregam ao aparecer, tocam mudos; toque liga o som */
  var phones = $$('.phone');
  function setSound(phone, on) {
    var v = $('video', phone), b = $('.phone__sound', phone); if (!v) return;
    v.muted = !on;
    if (b) { b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', on ? (I18N.soundOff || 'Desativar som') : (I18N.soundOn || 'Ativar som')); }
  }
  phones.forEach(function (phone) {
    phone.addEventListener('click', function () {
      var v = $('video', phone); if (!v) return;
      var turnOn = v.muted;
      phones.forEach(function (p) { setSound(p, false); });
      setSound(phone, turnOn);
      if (v.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    });
  });
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.src && v.dataset.src) v.src = v.dataset.src;
          var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        } else { v.pause(); if (!v.muted) setSound(v.closest('.phone'), false); }
      });
    }, { threshold: 0.35 });
    $$('.phone__video').forEach(function (v) { vio.observe(v); });
  }

  /* janelas do comentarios.exe: arrastar e fechar */
  var desk = $('.desktop'), z = 5;
  if (desk) {
    $$('.win', desk).forEach(function (win) {
      var bar = $('.win__bar', win), sx, sy, ox, oy, drag = false;
      win.addEventListener('pointerdown', function () { win.style.zIndex = ++z; });
      if (bar) {
        bar.addEventListener('pointerdown', function (e) {
          if (e.target.closest('button') || getComputedStyle(win).position !== 'absolute') return;
          drag = true; sx = e.clientX; sy = e.clientY;
          var m = (win.dataset.pos || '0,0').split(','); ox = +m[0]; oy = +m[1];
          bar.setPointerCapture(e.pointerId);
        });
        bar.addEventListener('pointermove', function (e) {
          if (!drag) return;
          var nx = ox + e.clientX - sx, ny = oy + e.clientY - sy;
          win.dataset.pos = nx + ',' + ny; win.style.transform = 'translate(' + nx + 'px,' + ny + 'px)';
        });
        ['pointerup', 'pointercancel'].forEach(function (t) { bar.addEventListener(t, function () { drag = false; }); });
      }
      $$('[data-close]', win).forEach(function (btn) {
        btn.addEventListener('click', function () {
          win.classList.add('closing');
          setTimeout(function () { win.style.visibility = 'hidden'; win.classList.remove('closing'); }, 190);
          setTimeout(function () { win.style.visibility = ''; }, 4200);
        });
      });
    });
  }

  /* tarjas pretas do dossiê */
  var tips = I18N.tips || ['Confidencial.'], tipN = 0;
  $$('.redact').forEach(function (r) {
    var tip = $('.redact__tip', r), timer;
    r.addEventListener('click', function () {
      if (tip) tip.textContent = tips[tipN++ % tips.length];
      r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake', 'tip');
      clearTimeout(timer); timer = setTimeout(function () { r.classList.remove('tip', 'shake'); }, 1600);
    });
  });

  /* checklist dos módulos */
  $$('.module__head').forEach(function (head) {
    head.addEventListener('click', function () {
      var mod = head.parentElement, open = !mod.classList.contains('open');
      mod.classList.toggle('open', open); head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* FAQ: abre uma por vez */
  var qas = $$('details.qa');
  qas.forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) qas.forEach(function (o) { if (o !== d) o.open = false; }); });
  });

  /* bolhas do topo (só em telas grandes) */
  var box = $('.bubbles');
  if (box && hero && !reduced && innerWidth > 760) {
    hero.classList.add('has-bubbles');
    var spawn = function () {
      if (doc.hidden || box.childElementCount > 9) return;
      var b = doc.createElement('span'), s = 26 + Math.random() * 46, side = Math.random() < 0.5;
      b.className = 'bubble';
      b.style.width = b.style.height = s + 'px';
      b.style.left = (side ? 3 + Math.random() * 22 : 75 + Math.random() * 22) + '%';
      b.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
      b.style.animationDuration = (11 + Math.random() * 9) + 's';
      b.addEventListener('animationend', function () { b.remove(); });
      b.addEventListener('pointerdown', function () { b.classList.add('pop'); });
      box.appendChild(b);
    };
    for (var i = 0; i < 3; i++) setTimeout(spawn, i * 900);
    setInterval(spawn, 2400);
  }
})();
