document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("publications");

  // ⛔ Not on publications page → do nothing
  if (!container) return;

  container.innerHTML = `<div class="pub-desc">Loading publications…</div>`;

  try {
    const res = await fetch("https://ghilab.ryangrui.workers.dev/");
    if (!res.ok) throw new Error("Fetch failed");

    const pubs = await res.json();
    container.innerHTML = "";

    pubs.forEach(p => {
      const item = document.createElement("div");
      item.className = "pub-card";

      item.innerHTML = `
        <div class="pub-title">
          <a href="${p.url}" target="_blank" rel="noopener">${p.title}</a>
        </div>
        <div class="pub-desc">
          ${p.authors}<br>
          <em>${p.journal}</em> (${p.year})
        </div>
      `;

      container.appendChild(item);
    });

  } catch (err) {
    container.innerHTML =
      `<div class="pub-desc">Failed to load publications.</div>`;
    console.error(err);
  }
});
