# Data City — Portfolio of Akshat Shukla

A portfolio that renders a Data Engineer's career as an explorable, neon-lit
isometric city. Each district is a building you can explore to reveal projects,
architecture diagrams, achievements, and the tech stack behind them.

**Tagline:** _Building cities powered by data._

## Districts

| District | Represents |
|---|---|
| **Databricks Tower** | Lakehouse · Spark · Delta Lake |
| **Snowflake District** | Warehouse modeling · dbt · semantic layer |
| **AI Research Lab** | LLM agents · RAG · applied ML |
| **Analytics Arena** | BI · experimentation · metrics |
| **Pipeline Station** | Ingestion · orchestration · streaming |
| **Skills Center** | Tech stack · certifications |

## Run it

It's a fully static, dependency-free site. Serve the folder with anything:

```bash
# any static server works
npx serve .
# or
python3 -m http.server 4173
```

Then open the served URL.

## Structure

```
index.html        # shell: hero, rail, panel, contact
css/styles.css    # premium dark cyberpunk theme
js/data.js        # all content + inline SVG architecture diagrams
js/city.js        # canvas isometric city engine (buildings, roads, data flows)
js/app.js         # UI wiring: hero, district rail, detail panels
```

## Editing content

Everything you'd want to change — districts, projects, stats, achievements,
skills, contact links — lives in [`js/data.js`](js/data.js). The city geometry
(`grid` per district) and `accent`/`glow` colors are defined there too, so
rearranging or recoloring the skyline is a data edit, not a code change.

## Notes

- No frameworks, no build step, no external runtime deps.
- The city is rendered on a single `<canvas>`: neon cuboids, emissive windows,
  glowing ground pads, and data particles that flow along the roads.
- Respects `prefers-reduced-motion` (disables idle float, particle flow, twinkle).
- Responsive: the camera auto-scales the skyline down on tablet/mobile.
- Interactions: **drag** to pan, **scroll** to zoom, **click** a building or a
  rail item to explore, **Esc** to close a panel.
