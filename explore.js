import { scroll, animate } from 'motion';
import Lenis from 'lenis';
import * as THREE from './assets/vendor/three.module.js';

const section = document.querySelector('#explore');
const scene = document.querySelector('#orb-scene');
const cards = [...scene.querySelectorAll('.orb-card')];
const phone = document.querySelector('#explore-phone');
const phonePerspective = document.querySelector('#explore-phone-perspective');
const received = document.querySelector('#explore-received');
const panel = document.querySelector('#explore-panel');
const panelLabel = document.querySelector('#explore-panel-label');
const panelTitle = document.querySelector('#explore-panel-title');
const panelActions = document.querySelector('#explore-panel-actions');
const progress = document.querySelector('#explore-panel-progress');
const progressFill = document.querySelector('#explore-progress-fill');
const progressText = document.querySelector('#explore-progress-text');
const signature = document.querySelector('#explore-signature');
const signaturePath = signature.querySelector('path');
const library = document.querySelector('#explore-library');
const libraryFile = document.querySelector('#explore-library-file');
const opened = document.querySelector('#explore-open');
const openMedia = document.querySelector('#explore-open-media');
const openName = document.querySelector('#explore-open-name');
const openInfo = document.querySelector('#explore-open-info');
const status = document.querySelector('#explore-status');
const resetButton = document.querySelector('#explore-reset');
const filesTab = document.querySelector('#explore-files-tab');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const gs = window.gsap;
let lenis = null;
let selected = null;
let outputName = '';
let signed = false;
let busy = false;
let scrollYaw = 0;
let dragYaw = 0;
let dragPitch = 0;
let phoneDrag = null;
let sphereDrag = null;

if (!reduceMotion.matches && matchMedia('(min-width: 901px)').matches) {
  lenis = new Lenis({ autoRaf: true, anchors: true, lerp: .085, smoothWheel: true, syncTouch: false });
  if (window.ScrollTrigger) lenis.on('scroll', window.ScrollTrigger.update);
  document.documentElement.classList.add('diva-lenis');
}

function radius() { return scene.clientWidth < 400 ? 139 : scene.clientWidth < 600 ? 166 : 198; }
function renderSphere() {
  const rad = radius();
  const euler = new THREE.Euler(dragPitch + Math.sin(scrollYaw) * .1, scrollYaw + dragYaw, 0, 'YXZ');
  cards.forEach((card) => {
    const lat = THREE.MathUtils.degToRad(Number(card.dataset.lat));
    const lon = THREE.MathUtils.degToRad(Number(card.dataset.lon));
    const vector = new THREE.Vector3(Math.sin(lon) * Math.cos(lat), -Math.sin(lat), Math.cos(lon) * Math.cos(lat)).multiplyScalar(rad).applyEuler(euler);
    card.style.transform = `translate(-50%, -50%) translate3d(${vector.x.toFixed(2)}px, ${vector.y.toFixed(2)}px, ${vector.z.toFixed(2)}px)`;
    card.style.zIndex = String(Math.round(vector.z + 220));
    card.style.opacity = String(Math.max(.29, Math.min(1, .62 + vector.z / (rad * 1.8))));
    card.style.pointerEvents = vector.z < -rad * .5 ? 'none' : 'auto';
  });
}
renderSphere();
new ResizeObserver(renderSphere).observe(scene);
if (!reduceMotion.matches) {
  scroll((progressValue) => { scrollYaw = progressValue * Math.PI * 1.9; renderSphere(); }, { target: section, offset: ['start start', 'end end'] });
  animate(document.querySelector('.orb-glow'), { opacity: [.5, 1, .5], scale: [.94, 1.08, .94] }, { duration: 6, repeat: Infinity, ease: 'easeInOut' });
}

scene.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  sphereDrag = { x: event.clientX, y: event.clientY, yaw: dragYaw, pitch: dragPitch };
  scene.setPointerCapture(event.pointerId);
});
scene.addEventListener('pointermove', (event) => {
  if (!sphereDrag) return;
  dragYaw = sphereDrag.yaw + (event.clientX - sphereDrag.x) * .008;
  dragPitch = THREE.MathUtils.clamp(sphereDrag.pitch + (event.clientY - sphereDrag.y) * .006, -.55, .55);
  renderSphere();
});
scene.addEventListener('pointerup', () => { sphereDrag = null; });
scene.addEventListener('pointercancel', () => { sphereDrag = null; });
scene.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault(); dragYaw += event.key === 'ArrowRight' ? .28 : -.28; renderSphere();
  }
});

if (gs && !reduceMotion.matches) gs.set(phone, { rotationY: -8, rotationX: 3 });
phone.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  phoneDrag = { x: event.clientX, y: event.clientY, pitch: Number(gs?.getProperty(phone, 'rotationX') || 3), yaw: Number(gs?.getProperty(phone, 'rotationY') || -8) };
  phone.setPointerCapture(event.pointerId);
});
phone.addEventListener('pointermove', (event) => {
  if (!phoneDrag || !gs || reduceMotion.matches) return;
  const yaw = THREE.MathUtils.clamp(phoneDrag.yaw + (event.clientX - phoneDrag.x) * .1, -24, 24);
  const pitch = THREE.MathUtils.clamp(phoneDrag.pitch - (event.clientY - phoneDrag.y) * .08, -19, 19);
  gs.set(phone, { rotationY: yaw, rotationX: pitch });
});
function releasePhone() {
  if (!phoneDrag) return;
  phoneDrag = null;
  if (gs && !reduceMotion.matches) gs.to(phone, { rotationY: selected ? 0 : -8, rotationX: selected ? 0 : 3, duration: .75, ease: 'power3.out' });
}
phone.addEventListener('pointerup', releasePhone);
phone.addEventListener('pointercancel', releasePhone);

function updateStatus(message) { status.textContent = message; }
function escapeText(value) { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function hide(element) { if (gs) gs.set(element, { autoAlpha: 0 }); else { element.style.opacity = '0'; element.style.visibility = 'hidden'; } }
function show(element) { if (gs) gs.set(element, { autoAlpha: 1 }); else { element.style.opacity = '1'; element.style.visibility = 'visible'; } }
function paperMarkup(kind) { return `<div class="received-sheet"><b>${kind === 'doc' ? 'DOCX' : 'PDF'}</b><i></i><i></i><i></i></div>`; }
function waveMarkup() { return '<div class="orb-wave">' + '<i></i>'.repeat(9) + '</div>'; }
function imageFor(card) { return card.querySelector('.orb-art img')?.getAttribute('src') || 'assets/pixabay-sunset.jpg'; }

function setReceived(card) {
  received.className = 'explore-received';
  const name = escapeText(card.dataset.file);
  if (card.dataset.kind === 'pdf' || card.dataset.kind === 'doc') {
    received.classList.add('is-paper');
    received.innerHTML = `${paperMarkup(card.dataset.kind)}<span class="received-name">${name}</span>`;
  } else if (card.dataset.kind === 'audio') {
    received.classList.add('is-audio');
    received.innerHTML = `${waveMarkup()}<span class="received-name">${name}<small>Аудиофайл</small></span>`;
  } else {
    received.innerHTML = `<img class="received-image" src="${imageFor(card)}" alt="" /><span class="received-shade"></span><span class="received-name">${name}<small>${card.dataset.kind === 'video' ? 'Видео' : 'Изображение'} в DIVA</small></span>`;
  }
}
function setPanel(label, title, actions, grid = false) {
  panelLabel.textContent = label;
  panelTitle.textContent = title;
  panelActions.classList.toggle('is-grid', grid);
  panelActions.innerHTML = actions.map(({ action, label: text, primary }) => `<button type="button" data-action="${action}" class="${primary ? 'primary' : ''}">${escapeText(text)}</button>`).join('');
  progress.classList.remove('is-visible');
  progressFill.style.width = '0%';
  progressText.textContent = '0%';
  show(panel);
  if (gs && !reduceMotion.matches) gs.fromTo(panel, { y: 22, scale: .96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .48, ease: 'back.out(1.3)' });
}
function initialPanel() {
  const type = selected.dataset.kind;
  const filename = selected.dataset.file;
  if (type === 'video') setPanel('ВИДЕО / MP4', filename, [{ action: 'video-quality', label: 'Загрузить видео　↓', primary: true }]);
  if (type === 'pdf') setPanel('ДОКУМЕНТ / PDF', filename, [{ action: 'pdf-sign', label: 'Подписать PDF　✎', primary: true }, { action: 'pdf-compress', label: 'Сжать PDF' }]);
  if (type === 'doc') setPanel('ДОКУМЕНТ / DOCX', filename, [{ action: 'doc-convert', label: 'Конвертировать в PDF　↗', primary: true }]);
  if (type === 'image') setPanel('ИЗОБРАЖЕНИЕ', filename, [{ action: 'image-convert', label: 'Конвертировать в JPEG　↗', primary: true }, { action: 'image-compress', label: 'Сжать изображение' }]);
  if (type === 'audio') setPanel('АУДИО / WAV', filename, [{ action: 'audio-trim', label: 'Обрезать фрагмент　✂', primary: true }]);
}

function cloneForFlight(element) {
  const box = element.getBoundingClientRect();
  const clone = element.cloneNode(true);
  clone.removeAttribute('id');
  clone.classList.remove('is-picked');
  clone.classList.add('explore-fly');
  clone.setAttribute('aria-hidden', 'true');
  clone.style.cssText += `;left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px;transform:none;opacity:1;visibility:visible;pointer-events:none;`;
  document.body.append(clone);
  if (gs) gs.set(clone, { x: 0, y: 0, rotation: 0, rotationY: 0, scaleX: 1, scaleY: 1 });
  return { clone, box };
}
function center(box) { return { x: box.left + box.width / 2, y: box.top + box.height / 2 }; }
async function waitForPhone() {
  if (innerWidth > 900) return;
  if (reduceMotion.matches) { phonePerspective.scrollIntoView({ block: 'center' }); return; }
  if (lenis) await new Promise((resolve) => lenis.scrollTo(phonePerspective, { duration: .75, offset: -20, onComplete: resolve }));
  else {
    phonePerspective.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise((resolve) => setTimeout(resolve, 680));
  }
}
async function flyToDrop(card) {
  const { clone, box } = cloneForFlight(card);
  card.classList.add('is-picked');
  updateStatus(`${card.dataset.file} → DIVA`);
  await waitForPhone();
  const target = received.getBoundingClientRect();
  const dx = center(target).x - center(box).x;
  const dy = center(target).y - center(box).y;
  if (gs && !reduceMotion.matches) {
    gs.to(phone, { rotationY: 0, rotationX: 0, scale: 1.02, duration: .65, ease: 'power2.out' });
    await new Promise((resolve) => gs.timeline({ onComplete: resolve })
      .to(clone, { x: dx * .5, y: dy * .27 - 85, rotationY: -42, rotation: -7, scale: .85, duration: .58, ease: 'power2.out' })
      .to(clone, { x: dx, y: dy, rotationY: 0, rotation: 0, scaleX: target.width / box.width, scaleY: target.height / box.height, borderRadius: 24, duration: .72, ease: 'power3.inOut' }));
  }
  clone.remove();
  setReceived(card);
  show(received);
  if (gs && !reduceMotion.matches) gs.fromTo(received, { scale: .94, opacity: 0 }, { scale: 1, opacity: 1, duration: .32, ease: 'power2.out' });
  initialPanel();
  updateStatus(`Выберите действие для ${card.dataset.file}`);
}

function resetExplore() {
  if (busy) return;
  selected = null; outputName = ''; signed = false;
  cards.forEach((card) => card.classList.remove('is-picked'));
  [received, panel, signature, library, opened].forEach(hide);
  filesTab.disabled = true;
  panelActions.innerHTML = '';
  received.innerHTML = '';
  openMedia.innerHTML = '';
  if (gs && !reduceMotion.matches) gs.to(phone, { rotationY: -8, rotationX: 3, scale: 1, duration: .65, ease: 'power3.out' });
  updateStatus('Выберите файл в сфере');
}

cards.forEach((card) => card.addEventListener('click', async () => {
  if (busy) return;
  if (selected) resetExplore();
  selected = card; outputName = card.dataset.file; signed = false; busy = true;
  await flyToDrop(card);
  busy = false;
}));
resetButton.addEventListener('click', resetExplore);

async function showProgress(label, nextName = outputName) {
  busy = true;
  outputName = nextName;
  panelLabel.textContent = 'ОБРАБОТКА ФАЙЛА';
  panelTitle.textContent = label;
  panelActions.innerHTML = '';
  progress.classList.add('is-visible');
  updateStatus(label);
  if (gs && !reduceMotion.matches) {
    await new Promise((resolve) => gs.to(progressFill, { width: '100%', duration: 1.35, ease: 'power1.inOut', onUpdate: () => {
      const track = progressFill.parentElement.clientWidth;
      progressText.textContent = `${Math.min(100, Math.round(parseFloat(gs.getProperty(progressFill, 'width')) / track * 100))}%`;
    }, onComplete: resolve }));
  } else { progressFill.style.width = '100%'; }
  progressText.textContent = '100%';
  busy = false;
  setPanel('РЕЗУЛЬТАТ ГОТОВ', outputName, [{ action: 'save', label: 'Сохранить в Мои файлы　↗', primary: true }]);
  updateStatus(`${outputName} готов к сохранению`);
}

async function signPdf() {
  busy = true;
  panelLabel.textContent = 'ПОДПИСЬ PDF';
  panelTitle.textContent = 'Ставим подпись';
  panelActions.innerHTML = '';
  const length = signaturePath.getTotalLength();
  signaturePath.style.strokeDasharray = String(length);
  signaturePath.style.strokeDashoffset = String(length);
  show(signature);
  updateStatus('Подписываем agreement.pdf');
  if (gs && !reduceMotion.matches) await new Promise((resolve) => gs.to(signaturePath, { strokeDashoffset: 0, duration: 1.65, ease: 'power1.inOut', onComplete: resolve }));
  else signaturePath.style.strokeDashoffset = '0';
  signed = true; busy = false;
  setPanel('PDF ПОДПИСАН', selected.dataset.file, [{ action: 'save', label: 'Сохранить в Мои файлы　↗', primary: true }]);
  updateStatus('Подпись готова. Сохраните PDF');
}

async function saveFile() {
  if (busy) return;
  busy = true;
  updateStatus(`${outputName} → Мои файлы`);
  setLibraryFile();
  const { clone, box } = cloneForFlight(received);
  filesTab.disabled = false;
  const target = filesTab.getBoundingClientRect();
  const dx = center(target).x - center(box).x;
  const dy = center(target).y - center(box).y;
  if (gs && !reduceMotion.matches) {
    await new Promise((resolve) => gs.timeline({ onComplete: resolve })
      .to(clone, { x: dx * .45, y: dy * .45 - 35, rotationY: 55, rotation: 9, scale: .55, duration: .42, ease: 'power2.in' })
      .to(clone, { x: dx, y: dy, rotationY: 0, rotation: 0, scaleX: .15, scaleY: .24, duration: .5, ease: 'power2.inOut' }));
  }
  clone.remove();
  hide(received); hide(panel); hide(signature);
  show(library);
  if (gs && !reduceMotion.matches) gs.fromTo(library, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: .42, ease: 'power2.out' });
  busy = false;
  updateStatus(`${outputName} сохранён в «Моих файлах»`);
}
function setLibraryFile() {
  const kind = selected.dataset.kind;
  const label = kind === 'video' ? 'Видео' : kind === 'pdf' || kind === 'doc' ? 'Документ' : kind === 'image' ? 'Изображение' : 'Аудио';
  const image = kind === 'video' || kind === 'image' ? `<img src="${imageFor(selected)}" alt="" />` : `<span class="file-type-icon">${kind === 'audio' ? 'WAV' : 'PDF'}</span>`;
  libraryFile.innerHTML = `${image}<span><strong>${escapeText(outputName)}</strong><small>${label} · только что</small></span><b>›</b>`;
}
function openSaved() {
  if (!selected || busy) return;
  const kind = selected.dataset.kind;
  hide(library); show(opened);
  if (gs && !reduceMotion.matches) gs.fromTo(opened, { x: 23, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: 'power2.out' });
  if (kind === 'video') openMedia.innerHTML = '<video src="assets/mountain-video.mp4" muted autoplay loop playsinline></video>';
  else if (kind === 'image') openMedia.innerHTML = `<img src="${imageFor(selected)}" alt="" />`;
  else if (kind === 'audio') openMedia.innerHTML = `<div class="open-paper">♫　WAV</div>`;
  else openMedia.innerHTML = `<div class="open-paper open-document"><b>PDF</b><i></i><i></i><i></i>${signed ? `<svg viewBox="0 0 240 100" aria-label="Подпись на документе"><path d="${signaturePath.getAttribute('d')}" /></svg>` : ''}</div>`;
  openName.textContent = outputName;
  openInfo.textContent = `${kind === 'video' ? 'Видео' : kind === 'audio' ? 'Аудио' : kind === 'image' ? 'Изображение' : 'Документ'} · сохранено в DIVA`;
  updateStatus(`${outputName} открыт`);
}
libraryFile.addEventListener('click', openSaved);
filesTab.addEventListener('click', () => { if (!selected) return; hide(opened); show(library); updateStatus('Мои файлы'); });

panelActions.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || !selected || busy) return;
  const action = button.dataset.action;
  if (action === 'video-quality') {
    setPanel('КАЧЕСТВО ВИДЕО', 'Выберите разрешение', [
      { action: 'quality-480', label: '480p' }, { action: 'quality-720', label: '720p' }, { action: 'quality-1080', label: '1080p' },
    ], true);
    updateStatus('Выберите качество видео');
  } else if (action.startsWith('quality-')) await showProgress(`Загрузка видео · ${action.slice(8)}p`);
  else if (action === 'pdf-sign') await signPdf();
  else if (action === 'pdf-compress') await showProgress('Сжатие PDF', selected.dataset.file.replace('.pdf', '-small.pdf'));
  else if (action === 'doc-convert') await showProgress('Конвертация DOCX в PDF', selected.dataset.file.replace('.docx', '.pdf'));
  else if (action === 'image-convert') await showProgress('Конвертация изображения', selected.dataset.file.replace(/\.[^.]+$/, '.jpeg'));
  else if (action === 'image-compress') await showProgress('Сжатие изображения', selected.dataset.file.replace(/(\.[^.]+)$/, '-small$1'));
  else if (action === 'audio-trim') await showProgress('Обрезка аудио · 00:12–00:29', selected.dataset.file.replace(/(\.[^.]+)$/, '-trimmed$1'));
  else if (action === 'save') await saveFile();
});
