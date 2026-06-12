/* =====================================================================
   APP — wires the city engine to the UI: hero, district rail, panels.
   ===================================================================== */

(function () {
  const canvas = document.getElementById("city");
  const tip = document.getElementById("tip");
  const panel = document.getElementById("panel");
  const panelBody = document.getElementById("panel-body");
  const scrim = document.getElementById("scrim");
  const rail = document.getElementById("rail");
  const hero = document.getElementById("hero");
  const enterBtn = document.getElementById("enter");

  /* ---- hero content ---- */
  document.getElementById("hero-name").textContent = CITY.hero.name;
  document.getElementById("hero-role").textContent = CITY.hero.role;
  document.getElementById("hero-tag").textContent = CITY.hero.tagline;

  /* ---- engine ---- */
  const engine = new CityEngine(canvas, CITY.districts, {
    onHover: handleHover,
    onSelect: openDistrict,
  });
  engine.start();

  /* ---- district rail ---- */
  CITY.districts.forEach((d) => {
    const b = document.createElement("button");
    b.className = "rail-item" + (d.isHQ ? " rail-hq" : "");
    b.style.setProperty("--accent", d.accent);
    const marker = d.isHQ
      ? `<span class="hq-mark"></span>`
      : `<span class="dot ${d.underConstruction ? "dot-wip" : ""}"></span>`;
    b.innerHTML = marker +
      `<span class="rail-label">${d.railLabel || d.name}</span>` +
      (d.underConstruction ? `<span class="rail-soon">SOON</span>` : "");
    b.addEventListener("click", () => openDistrict(d.id));
    b.addEventListener("mouseenter", () => { engine.setActive(d.id); });
    b.addEventListener("mouseleave", () => { if (!panel.classList.contains("open")) engine.setActive(null); });
    rail.appendChild(b);
  });

  // Facility 00 — meta entry at the bottom of the rail, visually set apart
  if (CITY.facility00) {
    const sep = document.createElement("div");
    sep.className = "rail-sep";
    rail.appendChild(sep);
    const b = document.createElement("button");
    b.className = "rail-item rail-meta";
    b.style.setProperty("--accent", CITY.facility00.accent);
    b.innerHTML =
      `<span class="meta-mark">⌥</span>` +
      `<span class="rail-label">${CITY.facility00.name}</span>`;
    b.addEventListener("click", () => openDistrict("facility-00"));
    rail.appendChild(b);
  }

  /* ---- hover tooltip ---- */
  function handleHover(id) {
    if (!id) { tip.classList.remove("show"); engine.setActive(panel.classList.contains("open") ? engine.activeId : null); return; }
    const d = id === "spotify" ? CITY.spotify : CITY.districts.find((x) => x.id === id);
    if (!panel.classList.contains("open")) engine.setActive(id);
    tip.innerHTML = `<span class="tip-kicker" style="color:${d.accent}">${d.kicker}</span>
      <span class="tip-name">${d.name}</span>
      <span class="tip-desc">${d.short}</span>
      <span class="tip-hint">${id === "spotify" ? "Click to listen →" : "Click to explore →"}</span>`;
    tip.classList.add("show");
  }
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    tip.style.left = (e.clientX - r.left) + "px";
    tip.style.top = (e.clientY - r.top) + "px";
  });

  /* ---- collapse / expand the district rail ---- */
  const railToggle = document.getElementById("rail-toggle");
  railToggle.addEventListener("click", () => {
    const collapsed = document.body.classList.toggle("rail-collapsed");
    engine.setRailCollapsed(collapsed);
  });

  /* ---- enter the city ---- */
  enterBtn.addEventListener("click", () => {
    hero.classList.add("dismiss");
    document.body.classList.add("entered");
    setTimeout(() => { hero.style.display = "none"; }, 1100);
  });

  /* ---- panel ---- */
  function openDistrict(id) {
    let d;
    if (id === "spotify") d = CITY.spotify;
    else if (id === "facility-00") d = CITY.facility00;
    else d = CITY.districts.find((x) => x.id === id);
    if (!d) return;
    // ensure we've entered the city
    if (!document.body.classList.contains("entered")) enterBtn.click();

    if (id !== "facility-00") { engine.setActive(id); engine.focus(id); }
    tip.classList.remove("show");

    panel.style.setProperty("--accent", d.accent);
    panel.style.setProperty("--glow", d.glow);
    panelBody.innerHTML = d.isHQ ? renderHQ(d)
      : id === "spotify" ? renderSpotify(d)
      : id === "facility-00" ? renderFacility(d)
      : renderDistrict(d);
    panelBody.scrollTop = 0;
    panel.classList.add("open");
    scrim.classList.add("show");
    document.body.classList.add("panel-open");

    // wire nav between districts inside panel
    panelBody.querySelectorAll("[data-goto]").forEach((el) =>
      el.addEventListener("click", () => openDistrict(el.getAttribute("data-goto")))
    );
  }

  function closePanel() {
    panel.classList.remove("open");
    scrim.classList.remove("show");
    document.body.classList.remove("panel-open");
    engine.setActive(null);
    engine.reset();
  }
  document.getElementById("panel-close").addEventListener("click", closePanel);
  scrim.addEventListener("click", closePanel);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

  /* ---- panel template ---- */
  function renderDistrict(d) {
    const idx = CITY.districts.findIndex((x) => x.id === d.id);
    const next = CITY.districts[(idx + 1) % CITY.districts.length];

    const stats = (d.stats || []).map((s) => `
      <div class="stat">
        <div class="stat-v">${s.v}</div>
        <div class="stat-k">${s.k}</div>
      </div>`).join("");

    const projects = (d.projects || []).map((p) => `
      <article class="project">
        <h4>${p.title}</h4>
        <p>${p.desc}</p>
        <div class="tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      </article>`).join("");

    const skills = d.skillGroups ? `
      <section class="block">
        <h3 class="block-title">Tech Stack</h3>
        <div class="skill-grid">
          ${d.skillGroups.map((g) => `
            <div class="skill-group">
              <div class="skill-group-name">${g.group}</div>
              <div class="chips">${g.items.map((i) => `<span class="chip">${i}</span>`).join("")}</div>
            </div>`).join("")}
        </div>
      </section>` : "";

    const projectsBlock = d.projects ? `
      <section class="block">
        <h3 class="block-title">Selected Work</h3>
        <div class="projects">${projects}</div>
      </section>` : "";

    const experience = d.experience ? `
      <section class="block">
        <h3 class="block-title">Experience</h3>
        ${d.experience.map((x) => `
          <article class="xp">
            <div class="xp-head">
              <div>
                <div class="xp-role">${x.role}</div>
                <div class="xp-org">${x.org}</div>
              </div>
              <div class="xp-period">${x.period}</div>
            </div>
            <ul class="xp-points">${x.points.map((p) => `<li>${p}</li>`).join("")}</ul>
          </article>`).join("")}
      </section>` : "";

    const education = d.education ? `
      <section class="block">
        <h3 class="block-title">Education</h3>
        ${d.education.map((x) => `
          <article class="xp">
            <div class="xp-head">
              <div>
                <div class="xp-role">${x.degree}</div>
                <div class="xp-org">${x.school}</div>
              </div>
              <div class="xp-period">${x.period}</div>
            </div>
            ${x.note ? `<div class="xp-note">${x.note}</div>` : ""}
          </article>`).join("")}
      </section>` : "";

    const achievements = (d.achievements || []).map((a) => `
      <li><span class="bolt">⚡</span>${a}</li>`).join("");

    const sideProjects = d.sideProjects ? `
      <section class="block">
        <h3 class="block-title">Side Projects</h3>
        <div class="side">
          ${d.sideProjects.map((s) => `
            <div class="side-item">
              <div class="side-row">
                <span class="side-name">${s.name}</span>
                <span class="side-tag">${s.tag}</span>
              </div>
              <p class="side-desc">${s.desc}</p>
            </div>`).join("")}
        </div>
      </section>` : "";

    const diagram = DIAGRAMS[d.diagram] ? `
      <section class="block">
        <h3 class="block-title">${d.underConstruction ? "Planned Architecture" : "Architecture"}</h3>
        <div class="diagram-wrap">${DIAGRAMS[d.diagram](d.accent)}</div>
      </section>` : "";

    const roadmap = d.roadmap ? `
      <section class="block">
        <h3 class="block-title">On The Roadmap</h3>
        <div class="roadmap">
          ${d.roadmap.map((r) => `
            <div class="rm-item">
              <span class="rm-marker"></span>
              <div>
                <div class="rm-title">${r.title}</div>
                <p class="rm-desc">${r.desc}</p>
              </div>
            </div>`).join("")}
        </div>
      </section>` : "";

    const plannedStack = d.plannedStack ? `
      <section class="block">
        <h3 class="block-title">Planned Stack</h3>
        <div class="chips">${d.plannedStack.map((t) => `<span class="chip">${t}</span>`).join("")}</div>
      </section>` : "";

    const badge = d.underConstruction ? `
      <div class="wip-badge"><span class="wip-dot"></span>${d.status || "Under Construction"}</div>` : "";

    const achievementsBlock = (d.achievements && d.achievements.length) ? `
      <section class="block">
        <h3 class="block-title">Achievements</h3>
        <ul class="achievements">${achievements}</ul>
      </section>` : "";

    return `
      <header class="panel-head ${d.underConstruction ? "is-wip" : ""}">
        <div class="panel-kicker">${d.kicker}</div>
        ${badge}
        <h2 class="panel-title">${d.name}</h2>
        <p class="panel-lede">${d.overview}</p>
        <div class="stats">${stats}</div>
      </header>
      ${experience}
      ${projectsBlock}
      ${roadmap}
      ${skills}
      ${plannedStack}
      ${sideProjects}
      ${education}
      ${diagram}
      ${achievementsBlock}
      <footer class="panel-foot">
        <button class="next-district" data-goto="${next.id}" style="--accent:${next.accent}">
          <span>Next district</span>
          <strong>${next.name} →</strong>
        </button>
      </footer>`;
  }

  /* ---- Facility 00 — the meta panel: this site itself ---- */
  function renderFacility(d) {
    const first = CITY.districts[0];
    const specs = d.specs.map((s) => `
      <div class="stat">
        <div class="stat-v">${s.v}</div>
        <div class="stat-k">${s.k}</div>
      </div>`).join("");
    return `
      <header class="panel-head">
        <div class="panel-kicker">${d.kicker}</div>
        <h2 class="panel-title">${d.name}</h2>
        <p class="panel-lede">${d.overview}</p>
        <div class="stats">${specs}</div>
      </header>
      <section class="block">
        <h3 class="block-title">Why</h3>
        <p class="hq-future">${d.why}</p>
      </section>
      <section class="block">
        <h3 class="block-title">What's actually inside</h3>
        <div class="projects">
          ${d.highlights.map((h) => `
            <article class="project">
              <h4>${h.title}</h4>
              <p>${h.desc}</p>
            </article>`).join("")}
        </div>
      </section>
      <section class="block">
        <h3 class="block-title">Stack</h3>
        <div class="chips">${d.stack.map((s) => `<span class="chip">${s}</span>`).join("")}</div>
      </section>
      <section class="block">
        <h3 class="block-title">Source</h3>
        <a class="repo-cta" href="${d.repo}" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.94 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.54.12-3.21 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.67.25 2.9.12 3.21.77.84 1.24 1.92 1.24 3.23 0 4.62-2.8 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0012 .5z"/>
          </svg>
          <span>github.com/hacking-this/data-city</span>
        </a>
      </section>
      <footer class="panel-foot">
        <button class="next-district" data-goto="${first.id}" style="--accent:${first.accent}">
          <span>Back to the city</span>
          <strong>${first.name} →</strong>
        </button>
      </footer>`;
  }

  /* ---- mission control HQ panel ---- */
  function renderHQ(d) {
    const c = CITY.contact;
    const links = [`<a href="mailto:${c.email}">Email</a>`]
      .concat(c.links.map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`))
      .join("");
    return `
      <header class="panel-head hq-head">
        <div class="panel-kicker">${d.kicker}</div>
        <h2 class="panel-title">${d.name}</h2>
        <div class="hq-role">${d.role}</div>
        <p class="panel-lede">${d.summary}</p>
      </header>
      <section class="block">
        <h3 class="block-title">Currently</h3>
        <article class="xp">
          <div class="xp-head">
            <div>
              <div class="xp-role">${d.current.role}</div>
              <div class="xp-org">${d.current.org} · ${d.current.location}</div>
            </div>
            <div class="xp-period">${d.current.period}</div>
          </div>
        </article>
      </section>
      <section class="block">
        <h3 class="block-title">Mission</h3>
        <blockquote class="hq-mission">${d.mission}</blockquote>
      </section>
      <section class="block">
        <h3 class="block-title">Where I'm Headed</h3>
        <p class="hq-future">${d.future}</p>
      </section>
      <section class="block">
        <h3 class="block-title">Direct Line</h3>
        <div class="hq-contact">${links}</div>
      </section>
      <footer class="panel-foot">
        <button class="next-district" data-goto="databricks" style="--accent:#ff5b3a">
          <span>Start exploring</span>
          <strong>Databricks Tower →</strong>
        </button>
      </footer>`;
  }

  /* ---- spotify (moon) panel ---- */
  function renderSpotify(d) {
    const first = CITY.districts[0];
    const bars = Array.from({ length: 28 }, (_, i) =>
      `<span class="eq-bar" style="--i:${i}"></span>`).join("");
    return `
      <header class="panel-head">
        <div class="panel-kicker">${d.kicker}</div>
        <h2 class="panel-title">${d.name}</h2>
        <p class="panel-lede">${d.overview}</p>
      </header>
      <section class="block">
        <div class="moon-card">
          <div class="moon-orb"></div>
          <div class="eq" aria-hidden="true">${bars}</div>
          <a class="spotify-btn" href="${d.url}" target="_blank" rel="noopener">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.59 14.43a.62.62 0 01-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 11-.28-1.21c3.82-.88 7.1-.51 9.72 1.1.3.18.39.57.21.86zm1.22-2.72a.78.78 0 01-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 11-.45-1.49c3.63-1.1 8.15-.56 11.23 1.33.37.23.49.71.26 1.07zm.11-2.84C14.8 8.99 9.39 8.8 6.23 9.76a.93.93 0 11-.54-1.78c3.63-1.1 9.6-.89 13.18 1.24a.93.93 0 11-.95 1.6z"/>
            </svg>
            <span>Open my Spotify</span>
          </a>
          <p class="moon-note">${d.note}</p>
        </div>
      </section>
      ${d.playlists ? `
      <section class="block">
        <h3 class="block-title">On Repeat</h3>
        <div class="sp-embeds">
          ${d.playlists.map((p) => `
            <div class="sp-item">
              <div class="sp-meta">
                <span class="sp-name">${p.name}</span>
                <p class="sp-blurb">${p.blurb}</p>
              </div>
              <iframe class="sp-embed" src="${p.url}" width="100%" height="352"
                frameborder="0" loading="lazy" allowfullscreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
            </div>`).join("")}
        </div>
      </section>` : ""}
      <footer class="panel-foot">
        <button class="next-district" data-goto="${first.id}" style="--accent:${first.accent}">
          <span>Back to the city</span>
          <strong>${first.name} →</strong>
        </button>
      </footer>`;
  }

  /* ---- footer contact ---- */
  const contactLinks = document.getElementById("contact-links");
  if (contactLinks) {
    contactLinks.innerHTML = CITY.contact.links
      .map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join("") +
      `<a href="mailto:${CITY.contact.email}">Email</a>`;
  }
})();
