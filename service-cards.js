// Open service cards while preserving their independent discussion links.
(() => {
  const cards = document.querySelectorAll('.svc-sub');
  if (!cards.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'service-dialog';
  dialog.setAttribute('aria-labelledby', 'service-dialog-title');
  dialog.innerHTML = '<button type="button" class="service-dialog-close" aria-label="Закрыть">×</button><p class="service-dialog-category"></p><h2 id="service-dialog-title"></h2><p class="service-dialog-price"></p><p class="service-dialog-context-label">О направлении</p><p class="service-dialog-description"></p><a class="btn btn-accent" target="_blank" rel="noopener noreferrer">Обсудить эту услугу ↗</a>';
  document.body.append(dialog);
  const close = dialog.querySelector('button');
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  let savedOverflow;
  dialog.addEventListener('close', () => { document.body.style.overflow = savedOverflow; });
  cards.forEach(card => {
    const heading = card.querySelector('h3');
    const title = heading.textContent.trim();
    const opener = document.createElement('button');
    opener.type = 'button';
    opener.className = 'service-card-open';
    opener.textContent = title;
    opener.setAttribute('aria-haspopup', 'dialog');
    heading.replaceChildren(opener);
    const hint = document.createElement('span');
    hint.className = 'service-card-hint';
    hint.textContent = 'Подробнее →';
    hint.setAttribute('aria-hidden', 'true');
    heading.after(hint);
    opener.addEventListener('click', () => {
      dialog.querySelector('h2').textContent = title;
      dialog.querySelector('.service-dialog-category').textContent = document.querySelector('.page-hero h1').textContent;
      dialog.querySelector('.service-dialog-price').textContent = card.querySelector('.svc-sub-price').textContent;
      dialog.querySelector('.service-dialog-description').textContent = document.querySelector('.page-hero-desc').textContent;
      dialog.querySelector('a').href = 'https://t.me/cvvjesuss?text=' + encodeURIComponent('Здравствуйте! Интересует услуга: ' + title);
      savedOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
  });
})();
