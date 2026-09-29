// All pages use the same build so a refreshed workbook cannot leave stale tabs.
(() => {
  const tag = document.currentScript;
  const root = new URL('.', tag.src);
  const page = document.baseURI;
  function script(url) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = url;
      el.onload = resolve;
      el.onerror = () => reject(new Error(`Nie można wczytać ${url}`));
      document.body.appendChild(el);
    });
  }
  window.inpplReady = (async () => {
    let build = String(Date.now());
    try {
      const response = await fetch(new URL(`version.json?t=${build}`, root), {cache: 'no-store'});
      if (response.ok) {
        const version = await response.json();
        if (version.build != null) build = String(version.build);
      }
    } catch (_) { /* file:// and unavailable manifests still allow loading data. */ }
    const data = new URL('data.js', root);
    data.searchParams.set('v', build);
    await script(data.href);
    for (const name of (tag.dataset.scripts || '').split(/\s+/).filter(Boolean)) {
      const url = new URL(name, page);
      url.searchParams.set('v', build);
      await script(url.href);
    }
  })();
  window.inpplReady.catch(error => {
    console.error(error);
    const notice = document.createElement('p');
    notice.setAttribute('role', 'alert');
    notice.textContent = 'Nie udało się wczytać danych strony. Odśwież stronę lub spróbuj ponownie później.';
    (document.querySelector('main') || document.body).prepend(notice);
  });
})();
