document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("publications");

  // Not on publications page → do nothing
  if (!container) return;

  // ✅ No "Loading..." text
  container.innerHTML = "";

  try {
    const res = await fetch("https://ghilab.ryangrui.workers.dev/");
    if (!res.ok) throw new Error("Fetch failed");

    const pubs = await res.json();
    container.innerHTML = "";

    pubs.forEach(p => {
      const item = document.createElement("div");
      item.className = "pub-dynamic-item";

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
    // Optional: show nothing on failure (or keep an error message)
    container.innerHTML = "";
    console.error(err);
  }
});
