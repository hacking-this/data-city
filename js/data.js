/* =====================================================================
   CITY DATA — Akshat Shukla's career, encoded as districts.
   Content sourced from résumé + real project repositories.
   ===================================================================== */

const CITY = {
  hero: {
    name: "Akshat Shukla",
    role: "Data Engineer · AI Builder",
    tagline: "Building cities powered by data.",
  },

  districts: [
    {
      id: "hq",
      isHQ: true,
      name: "Akshat Shukla",
      railLabel: "Mission Control",
      role: "Data Engineer · AI Builder",
      kicker: "Mission Control · HQ",
      accent: "#cfe3ff",
      glow: "#ffffff",
      short: "Mission Control — the engineer behind the city.",
      shape: "hq",
      grid: { x: 0, y: 0, w: 2, d: 2, h: 322 },
      summary:
        "Data Engineer at EY, building the lakehouse infrastructure that moves 25M+ records a day from legacy enterprise systems to Snowflake on Databricks. I treat data systems like products: governed, reliable, and boring in the best way — so the AI and analytics built on top of them can be ambitious.",
      stats: [
        { v: "2 yrs", k: "shipping data infra" },
        { v: "25M+", k: "records / day in prod" },
        { v: "5", k: "active certifications" },
      ],
      current: {
        role: "Data Engineer",
        org: "EY Global Delivery Services",
        location: "Bengaluru, India",
        period: "Feb 2024 – Present",
        focus: "Oracle DB2 → Snowflake migration · Spark performance · MCP-driven SDLC automation",
      },
      shipping: {
        title: "What I'm building this quarter",
        items: [
          "Iceberg-based historical layer on Snowflake so we can reprocess years of data as a query, not a backfill job.",
          "Internal MCP tooling that lets engineers update Jira from inside their editor — code changes write their own context.",
          "Personal R&D: agentic platforms (NEXUS, WhatsApp Agent) — pressure-testing how far typed-tool LLM agents go on real, daily workloads.",
        ],
      },
      mission:
        "Turn messy, bespoke data plumbing into infrastructure people can trust — so engineers ship features instead of debating column types, and analysts ask better questions instead of doubting their dashboards.",
      future:
        "I'm heading toward platform & agentic-AI engineering: self-serve data platforms that golden-path the right thing, and LLM agents that act safely on the data infrastructure underneath. The teams that win the next decade will run intelligence on infrastructure they can trust — I want to build both halves.",
    },

    {
      id: "databricks",
      name: "Databricks Tower",
      kicker: "Lakehouse Core",
      accent: "#ff5b3a",
      glow: "#ff7a4d",
      short: "The lakehouse engine room — Spark, PySpark, and enterprise-scale ETL.",
      shape: "tiered",
      grid: { x: 0, y: 0, w: 2.2, d: 2.2, h: 258 },
      stats: [
        { v: "25M+", k: "records / day" },
        { v: "40%", k: "faster pipelines" },
        { v: "99%", k: "less manual effort" },
      ],
      overview:
        "The tallest tower in the city — the lakehouse engine where I spend my days at EY. Apache Spark and PySpark turn enterprise source systems into governed, query-ready data, processing 25M+ records every day on Databricks.",
      experience: [
        {
          role: "Data Engineer",
          org: "EY Global Delivery Services · Bengaluru",
          period: "Feb 2024 – Present",
          points: [
            "Built scalable ETL pipelines on Databricks (Spark / PySpark) migrating enterprise data from Oracle DB2 to Snowflake, processing 25M+ records daily.",
            "Optimized distributed Spark workloads with partitioning and broadcast joins, cutting pipeline runtime by 40%.",
            "Authored reusable Python data-processing utilities for standardization and ETL automation, reducing manual deployment effort by 99%.",
          ],
        },
      ],
      projects: [
        {
          title: "Distributed Spark Optimization",
          desc: "Tuned distributed Spark workloads with partitioning strategies and broadcast joins, cutting end-to-end pipeline runtime by 40% on large enterprise datasets.",
          tags: ["Spark", "Partitioning", "Broadcast Joins", "Performance"],
        },
        {
          title: "Reusable Python ETL Utilities",
          desc: "Built a library of Python data-processing utilities for standardization and ETL automation, reducing manual deployment effort by 99% across the team.",
          tags: ["Python", "ETL Automation", "Tooling"],
        },
      ],
      achievements: [
        "Databricks Certified Data Engineer Professional",
        "Databricks Certified Data Engineer Associate",
        "Cut pipeline runtime 40% via Spark tuning",
      ],
      caseStudy: {
        title: "Oracle DB2 → Snowflake Migration",
        kicker: "Case Study",
        sub: "Moving an enterprise source-of-truth off a legacy warehouse without dropping a row.",
        problem:
          "Decades of business data lived in Oracle DB2 — the source-of-truth for analytics across multiple downstream teams. The org was moving to Snowflake for elastic compute and Iceberg-based schema evolution, but the migration couldn't pause reports, couldn't lose history, and couldn't tolerate silent drift between the two systems while both were live.",
        constraints: [
          { k: "Zero-downtime tolerance", v: "Downstream dashboards and finance reports ran continuously against DB2 — readers had to be flipped over without an outage window." },
          { k: "Schema drift on the source", v: "DB2 schemas were occasionally hand-edited by upstream teams; the pipeline had to absorb new/renamed columns without breaking." },
          { k: "Regulated data, traceable rows", v: "Every row had to be reconcilable end-to-end (DB2 → Bronze → Silver → Gold → Snowflake) for audit purposes." },
          { k: "Cost discipline", v: "Running DB2 and Snowflake in parallel for weeks meant double-billing — the cutover window had to be measured in weeks, not quarters." },
        ],
        approach: [
          { k: "Medallion on Databricks", v: "Bronze (raw DB2 extracts, immutable), Silver (cleansed + typed), Gold (business-modelled marts). Each layer is idempotent — re-running a day yields the same output." },
          { k: "Partitioned bulk + daily delta", v: "Initial backfill in date-partitioned batches; ongoing loads as small daily deltas keyed by source change-timestamps. Both share the same PySpark transformation code." },
          { k: "Iceberg on Snowflake", v: "Gold layer lands as Apache Iceberg tables on Snowflake — schema evolution lets new source columns flow through without rewrites, and time-travel makes reprocessing a query, not a job." },
          { k: "Spark tuning where it mattered", v: "Skew-aware partitioning on high-cardinality join keys and broadcast joins for small dimension tables took the heaviest pipelines from hours to minutes — 40% off end-to-end runtime." },
        ],
        cutover: [
          "Dual-load phase — every table writes to both DB2-mirror and Snowflake in parallel for two weeks. No reader switched yet; the goal was just to prove the new pipeline produces the same shape of truth.",
          "Reader migration in batches — moved one reporting team at a time, smallest first. Each batch ran A/B for ~48 hours: the team ran their reports against both systems and signed off on parity before we flipped them permanently.",
          "DB2 frozen, not dropped — the legacy source went read-only for 30 days as a fallback. Only when no reads landed on it for two weeks did we decommission ingestion.",
        ],
        reconciliation: [
          { k: "Row-count parity", v: "Daily job compared row counts per table per partition between DB2 and Snowflake; any delta over 0.01% paged the on-call." },
          { k: "Column-level hashes", v: "MD5 of concatenated values per primary key on a 1% sample, stored as a Snowflake table — anything mismatched stayed open until resolved." },
          { k: "Freshness SLOs", v: "Gold tables had a 'last-loaded' timestamp surfaced in a Snowflake view; Airflow alerted if any table fell behind its SLA by 30 minutes." },
        ],
        whatBroke: [
          "Silent timezone bug: DB2 stored some columns as `TIMESTAMP WITHOUT TIME ZONE`. Spark inferred them as session-local, which silently shifted dates by ±5.5 hours during the IST→UTC normalization. Caught in reconciliation — a 0.4% row mismatch on one fact table that traced back to date keys, not values.",
          "Skewed key join melted a cluster: one customer ID had ~30% of all rows for a fact table. The first version did a regular shuffle join and hung at 99%. Fix was a salted broadcast join with the small dimension and key salting for the few hot IDs.",
          "Source schema drift mid-load: upstream renamed a column in DB2 without notice. Iceberg absorbed it as a new column instead of failing — surfaced via a daily 'unexpected schema' check, fixed in a 4-line config change, no replay needed.",
        ],
        impact: [
          { v: "25M+", k: "records / day in production" },
          { v: "40%", k: "end-to-end runtime cut via Spark tuning" },
          { v: "75%", k: "less reprocessing thanks to Iceberg time-travel" },
          { v: "0", k: "rows lost across the cutover" },
        ],
      },
      diagram: "db2-snowflake-topology",
    },

    {
      id: "snowflake",
      name: "Snowflake District",
      kicker: "Warehouse Grid",
      accent: "#39c6ff",
      glow: "#7fe0ff",
      short: "Crystalline warehouse — Iceberg tables, schema evolution, cloud ingestion.",
      shape: "crystal",
      grid: { x: 3.2, y: -0.2, w: 2, d: 2, h: 222 },
      stats: [
        { v: "75%", k: "less reprocessing" },
        { v: "Iceberg", k: "open table format" },
        { v: "DB2→❄", k: "migration target" },
      ],
      overview:
        "A crystalline spire — the analytics warehouse. Apache Iceberg tables on Snowflake bring schema evolution and historical tracking to enterprise data, while cloud ingestion keeps the warehouse fed from object storage.",
      projects: [
        {
          title: "Iceberg Table Architecture",
          desc: "Implemented Apache Iceberg table architecture on Snowflake to support schema evolution and historical tracking, reducing data reprocessing effort by 75%.",
          tags: ["Snowflake", "Iceberg", "Schema Evolution", "Time Travel"],
        },
        {
          title: "S3 → Snowflake Ingestion",
          desc: "Built external-stage ingestion loading multi-source sales datasets from AWS S3 into Snowflake, modeling them for downstream analytics and reporting.",
          tags: ["Snowflake", "AWS S3", "External Stages", "SQL"],
        },
      ],
      achievements: [
        "Reduced reprocessing effort 75% with Iceberg",
        "Enabled schema evolution + historical tracking on Snowflake",
        "Modeled multi-source data for analytics consumption",
      ],
      diagram: "warehouse",
    },

    {
      id: "ai-lab",
      name: "AI Research Lab",
      kicker: "Intelligence Wing",
      accent: "#b06bff",
      glow: "#cf9bff",
      short: "Where data becomes reasoning — LLM agents, MCP servers, and GenAI tooling.",
      shape: "dome",
      grid: { x: 1.4, y: 3.2, w: 2.1, d: 2.1, h: 188 },
      stats: [
        { v: "Claude", k: "Opus-powered agents" },
        { v: "MCP", k: "servers & tooling" },
        { v: "GenAI", k: "SDLC acceleration" },
      ],
      overview:
        "The glowing dome at the city's edge — where pipelines learn to think. A personal lab of LLM agents and Model Context Protocol servers, plus GenAI workflows that accelerate the day job at EY.",
      projects: [
        {
          title: "WhatsApp AI Agent",
          desc: "A fully agentic personal assistant living inside WhatsApp, powered by Claude — typed tool layer, scheduled morning/evening check-ins, goal planning, and persistent memory.",
          tags: ["Claude", "LLM Agents", "TypeScript", "Tool Use"],
        },
        {
          title: "NEXUS — Personal Operating System",
          desc: "A Telegram AI 'chief of staff': daily planning, habit tracking, structured reviews, long-term memory and AI coaching over a clean services architecture.",
          tags: ["Python", "Telegram Bot", "LLM", "SQLite"],
        },
        {
          title: "MCP Servers · GitHub · Spotify · Jira",
          desc: "Built Model Context Protocol servers (GitHub, Spotify music assistant) and, at EY, integrated MCP with GitHub + Jira to auto-update contextual Jira tickets from code changes.",
          tags: ["MCP", "GenAI", "Python", "Automation"],
        },
      ],
      achievements: [
        "Microsoft Certified: Azure AI Fundamentals (AI-900)",
        "Microsoft Certified: GitHub Copilot (GH-300)",
        "Automated contextual Jira updates from code via MCP",
      ],
      sideProjects: [
        { name: "DSA Tracker", desc: "Full-stack app to track data-structures & algorithms practice.", tag: "Next.js · Prisma" },
        { name: "Money Tracker", desc: "Personal finance tracking experiment.", tag: "Side project" },
        { name: "LinkedIn Party Popper", desc: "Browser extension that celebrates a profile with confetti.", tag: "Browser Extension" },
      ],
      diagram: "rag",
    },

    {
      id: "analytics",
      name: "Analytics Arena",
      kicker: "Insight Stadium",
      accent: "#19e3a0",
      glow: "#5dffc6",
      short: "The arena where data goes live — trading signals, dashboards, backtests.",
      shape: "arena",
      grid: { x: 4.4, y: 2.6, w: 2.3, d: 2.3, h: 104 },
      stats: [
        { v: "Live", k: "market signals" },
        { v: "LLM", k: "trade commentary" },
        { v: "Auto", k: "backtesting" },
      ],
      overview:
        "A circular stadium pulsing with live metrics — the presentation layer of Master Trade AI. Streamlit dashboards surface signals and analytics, with LangChain generating human-readable market commentary on top of the data.",
      projects: [
        {
          title: "Master Trade AI — Insights Layer",
          desc: "Interactive Streamlit dashboards delivering live trading signals, performance views, and LangChain-generated market commentary for fast, explainable decisions.",
          tags: ["Streamlit", "LangChain", "Data Viz", "Python"],
        },
        {
          title: "Signal & Backtesting Engine",
          desc: "Automated signal generation and backtesting workflows over financial market datasets, turning raw price data into evaluated trading strategies.",
          tags: ["Backtesting", "ML Signals", "Analytics"],
        },
      ],
      achievements: [
        "Built an end-to-end AI trading & analytics platform",
        "Live dashboards with LLM-driven commentary",
        "Automated retraining + backtesting loops",
      ],
      diagram: "analytics",
    },

    {
      id: "pipeline",
      name: "Pipeline Station",
      kicker: "Transit Hub",
      accent: "#ffd23a",
      glow: "#ffe588",
      short: "The transit hub — Airflow orchestration, Kafka streaming, CI/CD rails.",
      shape: "twin",
      grid: { x: -2.4, y: 2.6, w: 2.1, d: 2.1, h: 182 },
      stats: [
        { v: "25M+", k: "records / day" },
        { v: "Airflow", k: "+ Autosys · Matillion" },
        { v: "Kafka", k: "real-time streams" },
      ],
      overview:
        "The transit hub where every data train arrives and departs. Airflow DAGs and enterprise schedulers (Autosys, Matillion) move batch workloads on time, while a Kafka streaming proof-of-concept handles real-time ingestion.",
      projects: [
        {
          title: "Master Trade AI — Airflow Orchestration",
          desc: "Apache Airflow DAGs orchestrating ETL of financial market datasets with scheduled retraining and backtesting, deployed via Docker with CI/CD on GitHub Actions.",
          tags: ["Airflow", "Docker", "GitHub Actions", "CI/CD"],
        },
        {
          title: "Kafka Streaming POC",
          desc: "Real-time producer/consumer pipeline ingesting market index streams, containerized with Docker — a hands-on exploration of streaming data infrastructure.",
          tags: ["Kafka", "Streaming", "Docker", "Python"],
        },
      ],
      achievements: [
        "Orchestrated enterprise batch pipelines (Airflow · Autosys · Matillion)",
        "Automated CI/CD with Docker + GitHub Actions",
        "Prototyped real-time streaming with Kafka",
      ],
      diagram: "pipeline",
    },

    {
      id: "skills",
      name: "Skills Center",
      kicker: "Power Grid",
      accent: "#ff48b0",
      glow: "#ff86cf",
      short: "The reactor core — the stack, certifications, and foundations.",
      shape: "reactor",
      grid: { x: 1.5, y: -3, w: 1.9, d: 1.9, h: 178 },
      stats: [
        { v: "2+ yrs", k: "experience" },
        { v: "5", k: "certifications" },
        { v: "15+", k: "technologies" },
      ],
      overview:
        "The reactor at the heart of the grid — the energy source for every district. The technologies, certifications, and academic foundation that keep the lights on across the city.",
      skillGroups: [
        { group: "Data Engineering", items: ["Databricks", "Apache Spark", "PySpark", "Snowflake", "Delta Lake", "Iceberg", "ETL", "Data Warehousing"] },
        { group: "Programming", items: ["Python", "SQL"] },
        { group: "Orchestration", items: ["Airflow", "Matillion", "Autosys"] },
        { group: "Cloud", items: ["Azure", "ADLS", "AWS S3"] },
        { group: "AI / GenAI", items: ["LLMs", "MCP", "LangChain", "GitHub Copilot"] },
        { group: "DevOps", items: ["Docker", "Git", "GitHub Actions"] },
      ],
      education: [
        {
          school: "Vellore Institute of Technology",
          degree: "B.Tech, Computer Science",
          period: "2019 – 2023",
          note: "CGPA 7.9 / 10",
        },
      ],
      achievements: [
        "Databricks Certified Data Engineer Professional",
        "Databricks Certified Data Engineer Associate",
        "Microsoft Certified: Azure AI Fundamentals (AI-900)",
        "Microsoft Certified: Azure Fundamentals (AZ-900)",
        "Microsoft Certified: GitHub Copilot (GH-300)",
      ],
      diagram: "stack",
    },

    {
      id: "platform-eng",
      name: "Platform Engineering",
      kicker: "Under Construction · Next District",
      accent: "#ffae42",
      glow: "#ffd591",
      short: "Breaking ground — self-serve data platforms & developer experience.",
      shape: "construction",
      underConstruction: true,
      status: "Under Construction",
      grid: { x: 0, y: 0, w: 2, d: 2, h: 200 },
      stats: [
        { v: "2026", k: "breaking ground" },
        { v: "Phase 1", k: "foundations" },
        { v: "Self-serve", k: "north star" },
      ],
      overview:
        "The newest district — still under construction. As pipelines mature, the next frontier is platform engineering: turning bespoke data plumbing into self-serve internal platforms, golden paths, and developer experience, so every team ships data products without reinventing the infrastructure.",
      roadmap: [
        { title: "Self-Serve Data Platform", desc: "Golden paths and templates so teams launch governed pipelines without touching infra." },
        { title: "Internal Developer Portal", desc: "One pane for data assets, lineage, ownership, and SLAs — discoverability by default." },
        { title: "Infrastructure as Code", desc: "Reproducible environments, CI/CD, and policy-as-code guardrails baked in." },
        { title: "Observability & Reliability", desc: "SLOs, cost controls, and self-healing for data systems at scale." },
      ],
      plannedStack: ["Terraform", "Kubernetes", "Backstage", "ArgoCD", "GitHub Actions", "OpenTelemetry", "Docker"],
      diagram: "platform",
    },
  ],

  /* Facility 00 — the site itself, the engine credit. Not a building in
     the city; it lives at the top of the rail as the meta-project that
     proves the engineering claims the rest of the site makes. */
  facility00: {
    id: "facility-00",
    name: "Facility 00 · This Site",
    kicker: "Meta · The Engine",
    accent: "#c8d4ff",
    glow: "#ffffff",
    overview:
      "You're inside it. This portfolio is a hand-built isometric data city — no frameworks, no Three.js, no rendering library. One HTML file, one stylesheet, three small JS modules, and a custom 2D canvas engine that draws every building, every road, every photon of moonlight.",
    why: "I wanted the site itself to be the strongest project on it — not a wrapper around a résumé, but evidence I can ship a polished, performant interactive system end-to-end.",
    specs: [
      { v: "0", k: "runtime dependencies" },
      { v: "60fps", k: "target frame rate" },
      { v: "1 canvas", k: "no DOM-per-building" },
    ],
    highlights: [
      {
        title: "Custom isometric projection",
        desc: "Iso → screen transform with camera pan, zoom, and adaptive scaling. Painter's-algorithm depth sort so 100+ buildings stack correctly without a 3D library.",
      },
      {
        title: "Polygon hit-testing on building faces",
        desc: "Hover and tap detection ray-cast through each landmark's three visible quads (left, right, top), front-to-back. Mobile taps hit-test on pointerdown so touch-only devices select correctly.",
      },
      {
        title: "Performance tiering",
        desc: "Eliminated per-frame canvas shadowBlur on the road and traffic hot path — the main mobile bottleneck — and faked the glow with layered translucent strokes. DPR capped at 1.5 on phones. Landmark face-glow off on small screens; neon edges retained.",
      },
      {
        title: "Procedural skyline",
        desc: "Deterministic mulberry32 RNG seeds the filler buildings so the city is the same every load, but the layout looks organic. Sparse plot occupancy keeps the planned core readable.",
      },
      {
        title: "Districts as data",
        desc: "Each district is one object in data.js — geometry, content, accent color, building shape. Adding the Platform Engineering district was a 12-line change. Districts are content, not code.",
      },
      {
        title: "Eight distinct building forms",
        desc: "Stepped tower, crystalline spire, dome, drum arena, twin towers + sky bridge, reactor with energy rings, command spire with radar sweep, and an under-construction site with a tower crane — all built from primitives (frustums, cylinders, rings, pyramids), all in pure 2D canvas.",
      },
    ],
    stack: ["Vanilla JS", "Canvas 2D", "Vanilla CSS", "No frameworks", "No build step"],
    repo: "https://github.com/hacking-this/data-city",
  },

  /* The moon above the skyline — the Spotify "Sound District". */
  spotify: {
    id: "spotify",
    name: "The Moonlight",
    kicker: "Sound District · Spotify",
    accent: "#7dffb0",
    glow: "#d8ffe6",
    short: "The moon over the city — what scores the late-night builds.",
    url: "https://open.spotify.com/user/22p2zijorj6hcucgtt4naq4ti?si=8b84acef60a949ae",
    overview:
      "Every city runs on a rhythm. This is the moon hanging over the skyline — the soundtrack to late-night pipelines, long refactors, and the quiet hours when the best engineering happens. Moonlight on the streets, music in the build.",
    note: "Currents of sound, not data — but they power the city all the same.",
    playlists: [
      {
        name: "Goatest 🐐",
        blurb: "The electronic core — hard techno, melodic techno, and dance. High-BPM fuel for deep-focus builds and the late hours when the city hums loudest.",
        url: "https://open.spotify.com/embed/playlist/50b9X02HUOyfQadNZX6KEn?utm_source=generator&theme=0",
      },
      {
        name: "Rock",
        blurb: "The other side of the moon — guitars, grit, and the classics. Turned up when the work calls for a little more attitude.",
        url: "https://open.spotify.com/embed/playlist/5u9IozcKXyxB0dNltGdSaH?utm_source=generator&theme=0",
      },
    ],
  },

  contact: {
    email: "akshatshukla.work411@gmail.com",
    links: [
      { label: "GitHub", href: "https://github.com/hacking-this" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/akshatshukla411" },
      { label: "Résumé", href: "assets/Akshat_Shukla_Resume.pdf" },
    ],
  },
};

/* ---------------------------------------------------------------------
   Inline SVG architecture diagrams, rendered inside each district panel.
   --------------------------------------------------------------------- */
const DIAGRAMS = {
  medallion: (c) => `
    <svg viewBox="0 0 520 150" class="diagram" role="img" aria-label="Lakehouse ETL">
      ${flowBoxes(c, [
        ["Oracle DB2", "source system"],
        ["Spark ETL", "Databricks"],
        ["Delta", "bronze→gold"],
        ["Snowflake", "warehouse"],
      ])}
    </svg>`,
  warehouse: (c) => `
    <svg viewBox="0 0 520 150" class="diagram" role="img" aria-label="Iceberg on Snowflake">
      ${flowBoxes(c, [
        ["S3", "object storage"],
        ["Stage", "external"],
        ["Iceberg", "schema evolution"],
        ["Marts", "analytics"],
      ])}
    </svg>`,
  rag: (c) => `
    <svg viewBox="0 0 520 150" class="diagram" role="img" aria-label="Agent + MCP">
      ${flowBoxes(c, [
        ["User", "chat / intent"],
        ["LLM Agent", "Claude"],
        ["MCP Tools", "GitHub · Jira"],
        ["Action", "grounded reply"],
      ])}
    </svg>`,
  analytics: (c) => `
    <svg viewBox="0 0 520 150" class="diagram" role="img" aria-label="Trading analytics">
      ${flowBoxes(c, [
        ["Market Data", "ingested"],
        ["Signals", "ML models"],
        ["Backtest", "evaluate"],
        ["Streamlit", "dashboards"],
      ])}
    </svg>`,
  pipeline: (c) => `
    <svg viewBox="0 0 520 150" class="diagram" role="img" aria-label="Orchestration">
      ${flowBoxes(c, [
        ["Sources", "APIs · streams"],
        ["Kafka", "real-time"],
        ["Airflow", "DAG orchestration"],
        ["Deliver", "downstream"],
      ])}
    </svg>`,
  stack: (c) => `
    <svg viewBox="0 0 520 150" class="diagram" role="img" aria-label="Stack reactor">
      ${flowBoxes(c, [
        ["Languages", "Python · SQL"],
        ["Compute", "Spark · Snowflake"],
        ["Orchestrate", "Airflow"],
        ["Intelligence", "LLM · MCP"],
      ])}
    </svg>`,
  platform: (c) => `
    <svg viewBox="0 0 520 150" class="diagram" role="img" aria-label="Platform engineering">
      ${flowBoxes(c, [
        ["Teams", "self-serve"],
        ["Golden Paths", "templates"],
        ["IaC", "guardrails"],
        ["Platform", "data products"],
      ])}
    </svg>`,

  // Real DB2→Snowflake migration topology — NOT a generic 4-box flow.
  // Shows: medallion layers on Databricks, daily delta vs initial bulk,
  // Iceberg target, reconciliation feedback loop, frozen-DB2 fallback.
  "db2-snowflake-topology": (c) => {
    const muted = "rgba(149,160,192,0.55)";
    const box = (x, y, w, h, label, sub, fill, stroke) => `
      <g>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"
              fill="${fill || 'rgba(255,255,255,0.03)'}"
              stroke="${stroke || c}" stroke-width="1.4" opacity="0.95"/>
        <text x="${x + w / 2}" y="${y + 21}" text-anchor="middle" fill="#fff" font-size="12" font-weight="600">${label}</text>
        <text x="${x + w / 2}" y="${y + 36}" text-anchor="middle" fill="${c}" font-size="10" opacity="0.85">${sub}</text>
      </g>`;
    const arrow = (x1, y1, x2, y2, color, dashed) => `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
            stroke="${color || c}" stroke-width="1.6" opacity="0.85"
            ${dashed ? 'stroke-dasharray="4 4"' : ''}/>
      <polygon points="${x2},${y2} ${x2 - 6 * Math.cos(Math.atan2(y2 - y1, x2 - x1) - 0.4)},${y2 - 6 * Math.sin(Math.atan2(y2 - y1, x2 - x1) - 0.4)} ${x2 - 6 * Math.cos(Math.atan2(y2 - y1, x2 - x1) + 0.4)},${y2 - 6 * Math.sin(Math.atan2(y2 - y1, x2 - x1) + 0.4)}"
        fill="${color || c}" opacity="0.85"/>`;
    return `
      <svg viewBox="0 0 560 230" class="diagram" role="img" aria-label="DB2 to Snowflake migration topology">
        <!-- source -->
        ${box(8, 92, 76, 46, "Oracle DB2", "source-of-truth", 'rgba(255,255,255,0.02)', muted)}

        <!-- ingest paths: initial bulk + daily delta -->
        ${arrow(86, 102, 130, 102)}
        ${arrow(86, 130, 130, 130, muted)}
        <text x="108" y="98" text-anchor="middle" fill="${c}" font-size="9" opacity="0.85">delta</text>
        <text x="108" y="142" text-anchor="middle" fill="${muted}" font-size="9">bulk (one-time)</text>

        <!-- medallion -->
        ${box(132, 80, 84, 46, "Bronze", "raw · immutable", null, c)}
        ${box(132, 134, 84, 46, "Backfill", "partitioned", 'rgba(255,255,255,0.02)', muted)}
        ${arrow(218, 103, 250, 103)}
        ${arrow(218, 157, 250, 130, muted)}
        ${box(252, 80, 80, 46, "Silver", "typed · cleansed", null, c)}
        ${arrow(334, 103, 366, 103)}
        ${box(368, 80, 80, 46, "Gold", "business marts", null, c)}

        <!-- Iceberg on Snowflake -->
        ${arrow(450, 103, 472, 103)}
        ${box(474, 80, 78, 46, "Iceberg ❄", "Snowflake", null, c)}

        <!-- reconciliation feedback (dashed) -->
        ${box(252, 178, 196, 32, "Reconciliation", "row counts · MD5 sample · freshness", 'rgba(255,255,255,0.02)', muted)}
        <line x1="350" y1="178" x2="350" y2="126" stroke="${muted}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.7"/>
        <line x1="46" y1="138" x2="46" y2="200" stroke="${muted}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.7"/>
        <line x1="46" y1="200" x2="252" y2="200" stroke="${muted}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.7"/>

        <!-- legend -->
        <text x="280" y="20" text-anchor="middle" fill="#95a0c0" font-family="JetBrains Mono, monospace" font-size="10" letter-spacing="2">DB2 → DATABRICKS MEDALLION → SNOWFLAKE</text>
        <line x1="0" y1="58" x2="560" y2="58" stroke="${c}" stroke-width="0.5" opacity="0.25"/>
      </svg>`;
  },
};

/* Horizontal flow of glowing nodes connected by energy arrows. */
function flowBoxes(c, nodes) {
  const W = 118, GAP = 16, H = 64, Y = 42;
  let out = "";
  nodes.forEach((n, i) => {
    const x = i * (W + GAP) + 4;
    if (i > 0) {
      const ax = x - GAP - 2;
      out += `
        <line x1="${ax - 12}" y1="${Y + H / 2}" x2="${ax + 12}" y2="${Y + H / 2}"
              stroke="${c}" stroke-width="2" opacity="0.55"/>
        <polygon points="${ax + 12},${Y + H / 2} ${ax + 5},${Y + H / 2 - 4} ${ax + 5},${Y + H / 2 + 4}" fill="${c}"/>`;
    }
    out += `
      <g>
        <rect x="${x}" y="${Y}" width="${W}" height="${H}" rx="11"
              fill="rgba(255,255,255,0.03)" stroke="${c}" stroke-width="1.4" opacity="0.95"/>
        <rect x="${x}" y="${Y}" width="${W}" height="${H}" rx="11" fill="${c}" opacity="0.06"/>
        <text x="${x + W / 2}" y="${Y + 27}" text-anchor="middle"
              fill="#fff" font-size="14" font-weight="600">${n[0]}</text>
        <text x="${x + W / 2}" y="${Y + 46}" text-anchor="middle"
              fill="${c}" font-size="10.5" opacity="0.85">${n[1]}</text>
      </g>`;
  });
  return out;
}
