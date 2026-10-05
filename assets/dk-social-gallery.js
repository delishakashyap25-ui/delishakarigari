(function () {
  if (window.dkSocialGalleryInitialized) return;
  window.dkSocialGalleryInitialized = true;

  function initializeGrids(root) {
    var grids = root.querySelectorAll('.dk-ig-grid:not([data-feed-loaded])');

    grids.forEach(function (grid) {
      grid.setAttribute('data-feed-loaded', 'true');

      var feedUrl = grid.getAttribute('data-feed-url');
      if (!feedUrl || !feedUrl.trim()) return;

      var handle = grid.getAttribute('data-ig-handle') || 'delishakarigari';

      fetch(feedUrl)
        .then(function (response) {
          if (!response.ok) throw new Error('Feed fetch failed');
          return response.json();
        })
        .then(function (data) {
          var posts = Array.isArray(data)
            ? data
            : data.data || data.posts || [];

          if (!Array.isArray(posts)) return;

          var cards = [];
          posts.slice(0, 6).forEach(function (post) {
            var imageUrl = post.mediaUrl || post.media_url || post.thumbnailUrl ||
              post.thumbnail_url ||
              (post.images && post.images.standard_resolution &&
                post.images.standard_resolution.url);
            if (!imageUrl) return;

            var image;
            var permalink;
            try {
              image = new URL(imageUrl, window.location.href);
              permalink = new URL(
                post.permalink || post.link || 'https://www.instagram.com/' + handle + '/',
                window.location.href
              );
            } catch (error) {
              return;
            }
            if (!['http:', 'https:'].includes(image.protocol) ||
                !['http:', 'https:'].includes(permalink.protocol)) return;

            var card = document.createElement('a');
            card.href = permalink.href;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.className = 'dk-ig-card';
            card.setAttribute('aria-label', 'View post on Instagram');

            var frame = document.createElement('div');
            frame.className = 'dk-ig-card__frame';

            var img = document.createElement('img');
            img.src = image.href;
            img.alt = String(post.caption || post.text || 'Delisha Karigari Instagram Post').slice(0, 80);
            img.className = 'dk-ig-card__img';
            img.loading = 'lazy';
            img.width = 600;
            img.height = 600;
            frame.appendChild(img);

            var overlay = document.createElement('div');
            overlay.className = 'dk-ig-card__overlay';
            var icon = document.createElement('span');
            icon.className = 'dk-ig-card__icon-ring';
            icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>';
            overlay.appendChild(icon);

            var label = document.createElement('span');
            label.className = 'dk-ig-card__btn-pill';
            label.textContent = 'VIEW POST ↗';
            overlay.appendChild(label);

            frame.appendChild(overlay);
            card.appendChild(frame);
            cards.push(card);
          });

          if (cards.length) grid.replaceChildren.apply(grid, cards);
        })
        .catch(function (error) {
          console.warn('Delisha Karigari live Instagram feed notice:', error);
        });
    });
  }

  initializeGrids(document);
  document.addEventListener('shopify:section:load', function (event) {
    initializeGrids(event.target);
  });
})();
