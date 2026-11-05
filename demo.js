const flow = {
  shell: document.querySelector('#demo-shell'),
  stage: document.querySelector('.flow-stage'),
  player: document.querySelector('#flow-player'),
  source: document.querySelector('#source-video'),
  phone: document.querySelector('#flow-phone'),
  drop: document.querySelector('#flow-drop'),
  action: document.querySelector('#flow-action'),
  quality: document.querySelector('#flow-quality'),
  progress: document.querySelector('#flow-progress'),
  percent: document.querySelector('#flow-percent'),
  fill: document.querySelector('#flow-progress-fill'),
  files: document.querySelector('#flow-files'),
  saved: document.querySelector('#flow-saved'),
  open: document.querySelector('#flow-open'),
  nav: document.querySelector('#flow-nav-pulse'),
  flight: document.querySelector('#flow-flight'),
  flightVideo: document.querySelector('#flow-flight video'),
  cursor: document.querySelector('#flow-cursor'),
  halo: document.querySelector('.flow-halo'),
  status: document.querySelector('#demo-status-text'),
  steps: [...document.querySelectorAll('.flow-steps [data-step]')],
  replay: document.querySelector('#demo-replay'),
  pause: document.querySelector('#demo-pause'),
  share: document.querySelector('.flow-social:last-child'),
};
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let timeline = null;
let flightTimeline = null;
let started = false;

function stageStatus(label, number, phase) {
  flow.status.textContent = label;
  flow.steps.forEach((step) => step.classList.toggle('is-active', Number(step.dataset.step) === number));
  window.dispatchEvent(new CustomEvent('diva-demo-stage', { detail: { phase } }));
}

function centerInStage(element) {
  const box = element.getBoundingClientRect();
  const stage = flow.stage.getBoundingClientRect();
  return { x: box.left - stage.left + box.width / 2, y: box.top - stage.top + box.height / 2, width: box.width, height: box.height };
}

function prepareFlight(source) {
  const start = centerInStage(source);
  const stage = flow.stage.getBoundingClientRect();
  gsap.set(flow.flight, {
    left: start.x - start.width / 2,
    top: start.y - start.height / 2,
    width: start.width,
    height: start.height,
    x: 0, y: 0, scale: 1, rotation: 0, rotationY: 0,
    borderRadius: source === flow.player ? 3 : 23,
    autoAlpha: 1,
  });
  try { flow.flightVideo.currentTime = flow.source.currentTime || 0; } catch {}
  flow.flightVideo.play().catch(() => {});
  return { ...start, stage };
}

function resetDemo() {
  if (timeline) timeline.kill();
  if (flightTimeline) flightTimeline.kill();
  gsap.set([flow.drop, flow.action, flow.quality, flow.progress, flow.files, flow.saved, flow.open, flow.nav, flow.flight, flow.cursor], { autoAlpha: 0, clearProps: 'x,y,scale,rotation,rotationY' });
  gsap.set([flow.files, flow.open], { x: 25 });
  gsap.set(flow.saved, { y: 20 });
  gsap.set(flow.player, { opacity: 1 });
  gsap.set(flow.fill, { width: '0%' });
  gsap.set(flow.halo, { opacity: .6, scale: 1 });
  flow.percent.textContent = '0%';
  document.querySelectorAll('.flow-quality-row span').forEach((item) => item.classList.remove('is-selected'));
  flow.pause.textContent = 'Пауза';
  flow.pause.setAttribute('aria-label', 'Приостановить анимацию');
  stageStatus('Готово к просмотру', 1, 'idle');
}

function showReducedMotion() {
  resetDemo();
  gsap.set([flow.files, flow.open, flow.saved], { autoAlpha: 1, x: 0, y: 0 });
  stageStatus('Видео открыто в «Моих файлах»', 4, 'complete');
  flow.pause.disabled = true;
}

function playDemo() {
  if (reduceMotion.matches) { showReducedMotion(); return; }
  resetDemo();
  flow.pause.disabled = false;
  started = true;
  flow.source.play().catch(() => {});
  const share = centerInStage(flow.share);
  const player = centerInStage(flow.player);
  gsap.set(flow.cursor, { left: share.x + 45, top: share.y + 58, autoAlpha: 0 });

  const tl = gsap.timeline({ onComplete: () => {
    flow.flightVideo.pause();
    flow.pause.textContent = 'Повторить';
    flow.pause.setAttribute('aria-label', 'Повторить анимацию');
  }});
  timeline = tl;
  tl.call(() => stageStatus('Видео воспроизводится', 1, 'watch'))
    .to(flow.cursor, { autoAlpha: 1, duration: .28 }, .55)
    .to(flow.cursor, { left: share.x, top: share.y, duration: .72, ease: 'power2.inOut' }, .7)
    .to(flow.share, { backgroundColor: '#414141', duration: .18, yoyo: true, repeat: 1 }, 1.47)
    .to(flow.cursor, { scale: .73, duration: .1, yoyo: true, repeat: 1 }, 1.48)
    .to(flow.cursor, { left: player.x + player.width * .2, top: player.y - player.height * .2, duration: .5, ease: 'power2.inOut' }, 1.76)
    .call(() => {
      stageStatus('Видео переходит в DIVA', 2, 'transfer');
      const start = prepareFlight(flow.player);
      const target = centerInStage(flow.drop);
      const dx = target.x - start.x;
      const dy = target.y - start.y;
      const targetScale = target.width / start.width;
      flightTimeline = gsap.timeline()
        .to(flow.player, { opacity: .24, duration: .28 }, 0)
        .to(flow.halo, { opacity: 1, scale: 1.4, duration: .55, ease: 'sine.out' }, 0)
        .to(flow.flight, { x: dx * .52, y: dy * .26 - 110, scale: Math.max(.67,targetScale * 1.5), rotationY: -42, rotation: -7, duration: .66, ease: 'power2.out' }, 0)
        .to(flow.flight, { x: dx, y: dy, scale: targetScale, rotationY: 0, rotation: 0, borderRadius: 23, duration: .86, ease: 'power3.inOut' }, .66)
        .to(flow.drop, { autoAlpha: 1, duration: .18 }, 1.43)
        .to(flow.flight, { autoAlpha: 0, duration: .18 }, 1.46)
        .to(flow.halo, { opacity: .55, scale: 1, duration: .7 }, 1.5)
        .call(() => { flow.flightVideo.pause(); flow.drop.querySelector('video').play().catch(() => {}); }, null, 1.63);
    }, null, 2.27)
    .call(() => { if (window.innerWidth <= 900) flow.phone.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, null, 3.05)
    .to(flow.cursor, { autoAlpha: 0, duration: .2 }, 2.36)
    .to({}, { duration: 1.75 }, 2.28)
    .call(() => stageStatus('Видео добавлено', 2, 'arrived'), null, 4.08)
    .fromTo(flow.action, { autoAlpha: 0, y: 25, scale: .94 }, { autoAlpha: 1, y: 0, scale: 1, duration: .5, ease: 'back.out(1.35)' }, 4.12)
    .to('.flow-glass-button', { scale: .96, duration: .11, yoyo: true, repeat: 1 }, 5.12)
    .to(flow.action, { autoAlpha: 0, y: -10, duration: .28 }, 5.35)
    .call(() => stageStatus('Выбор качества', 3, 'quality'), null, 5.48)
    .fromTo(flow.quality, { autoAlpha: 0, y: 26, scale: .94 }, { autoAlpha: 1, y: 0, scale: 1, duration: .48, ease: 'back.out(1.25)' }, 5.5)
    .call(() => document.querySelector('.flow-quality-row span').classList.add('is-selected'), null, 6.42)
    .to(flow.quality, { autoAlpha: 0, y: -10, duration: .28 }, 6.68)
    .call(() => stageStatus('Загрузка · 480p', 3, 'download'), null, 6.93)
    .fromTo(flow.progress, { autoAlpha: 0, y: 25 }, { autoAlpha: 1, y: 0, duration: .42, ease: 'power2.out' }, 6.94)
    .to(flow.fill, { width: '100%', duration: 1.45, ease: 'power1.inOut', onUpdate: () => { flow.percent.textContent = `${Math.round(parseFloat(gsap.getProperty(flow.fill, 'width')) / flow.progress.querySelector('.flow-progress-track').clientWidth * 100)}%`; } }, 7.37)
    .call(() => { flow.percent.textContent = '100%'; stageStatus('Сохранено в DIVA', 4, 'saved'); }, null, 8.84)
    .to(flow.progress, { autoAlpha: 0, y: -10, duration: .27 }, 9.03)
    .to(flow.nav, { autoAlpha: 1, scale: 1.12, duration: .32, yoyo: true, repeat: 1 }, 9.15)
    .call(() => {
      const start = prepareFlight(flow.drop);
      const nav = centerInStage(flow.nav);
      const target = centerInStage(flow.saved.querySelector('img'));
      const dxNav = nav.x - start.x, dyNav = nav.y - start.y;
      const dx = target.x - start.x, dy = target.y - start.y;
      flightTimeline = gsap.timeline()
        .to(flow.flight, { x: dxNav, y: dyNav, scale: .17, rotationY: 90, rotation: 16, duration: .65, ease: 'power2.in' }, 0)
        .to(flow.drop, { autoAlpha: 0, duration: .28 }, .15)
        .to(flow.files, { autoAlpha: 1, x: 0, duration: .52, ease: 'power2.out' }, .52)
        .to(flow.flight, { x: dx, y: dy, scale: target.width / start.width, rotationY: 0, rotation: 0, borderRadius: 8, duration: .58, ease: 'power2.out' }, .65)
        .to(flow.saved, { autoAlpha: 1, y: 0, duration: .3 }, 1.12)
        .to(flow.flight, { autoAlpha: 0, duration: .18 }, 1.2)
        .to(flow.nav, { autoAlpha: 0, duration: .25 }, 1.28)
        .call(() => flow.flightVideo.pause(), null, 1.4);
    }, null, 9.72)
    .to({}, { duration: 1.55 }, 9.72)
    .call(() => stageStatus('Открываем «Мои файлы»', 4, 'library'), null, 11.32)
    .to(flow.saved, { scale: .97, duration: .13, yoyo: true, repeat: 1 }, 11.54)
    .to(flow.files, { autoAlpha: 0, x: -22, duration: .42 }, 11.78)
    .to(flow.open, { autoAlpha: 1, x: 0, duration: .48, ease: 'power2.out' }, 11.83)
    .call(() => {
      flow.open.querySelector('video').play().catch(() => {});
      stageStatus('Видео открыто в «Моих файлах»', 4, 'complete');
    }, null, 12.28);
}

flow.replay.addEventListener('click', playDemo);
flow.pause.addEventListener('click', () => {
  if (!started || !timeline || !timeline.isActive() && timeline.progress() === 1) { playDemo(); return; }
  if (timeline.paused()) {
    timeline.resume(); if (flightTimeline) flightTimeline.resume(); flow.source.play().catch(() => {});
    flow.pause.textContent = 'Пауза';
    flow.pause.setAttribute('aria-label', 'Приостановить анимацию');
  } else {
    timeline.pause(); if (flightTimeline) flightTimeline.pause(); flow.source.pause();
    flow.pause.textContent = 'Продолжить';
    flow.pause.setAttribute('aria-label', 'Продолжить анимацию');
  }
});

if (reduceMotion.matches) showReducedMotion();
else {
  resetDemo();
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !started) { started = true; playDemo(); observer.disconnect(); }
  }, { threshold: .32 });
  observer.observe(flow.shell);
}
