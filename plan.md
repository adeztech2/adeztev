# ADEZ TV

## Implementation

ADEZ TV is a React/Express web experience backed by the Megan Movies REST API. The browser only calls same-origin `/api/movies/*` routes; Express injects the saved `MEGAN_API_KEY` server-side and proxies the upstream home feed and movie/TV detail endpoints. The home payload is normalized into rails and a deduplicated local catalog so search, tabs, genres, and My List work without exposing credentials or depending on a second search API.

The first version focuses on the streaming-discovery loop: featured hero, content rails, card interactions, local My List persistence, client-side catalog search, genre filters, and a full-screen detail sheet backed by live metadata. It is responsive from mobile through wide desktop and uses the supplied React/Tailwind stack plus lucide icons.

### Project structure

- `client/src/pages/Home.tsx`: ADEZ TV shell, data loading, search/filter state, rails, cards, hero, and detail sheet.
- `client/src/index.css`: cinematic visual system, layout primitives, poster treatments, responsive navigation, and motion.
- `server/_core/index.ts`: secure same-origin proxy routes for the Megan Movies API and existing platform server startup.
- `public/manus-routes.json`: page route manifest for the single-page experience.
- `TODO.md`: outcome-oriented delivery criteria.

## Design

### Unselected directions

- Neon editorial cinema — probability 0.07
- Warm arthouse streaming lounge — probability 0.06
- Minimal monochrome film archive — probability 0.05

### Chosen direction: Neon editorial cinema

**Design movement:** premium streaming UI meets late-night editorial magazine, with a restrained neon-lime accent and cinematic poster surfaces.

**Core principles:** let artwork lead; keep chrome quiet; use high-contrast hierarchy; make browsing feel like a confident editorial recommendation rather than a database.

**Color philosophy:** near-black ink and smoky blue-black surfaces make the posters glow, while a single electric lime accent signals action without turning the interface into a gamer dashboard. Muted lavender-grey text keeps metadata readable and calm.

**Layout paradigm:** a wide cinematic hero establishes the current story, then content spills into horizontal rails that invite sideways exploration. Search and filters collapse into a focused discovery mode instead of competing with the home narrative.

**Signature elements:** a small lime playback mark in the ADEZ wordmark; oversized editorial section numbers and eyebrow labels; poster cards with subtle lift, edge glow, and metadata tucked under the artwork.

**Interaction philosophy:** every card is a doorway. Hover reveals a soft play affordance; buttons distinguish “watch” from “save”; horizontal rails preserve the feeling of channel surfing. The mobile nav stays thumb-reachable.

**Animation:** use short ease-out fades and 180–260ms poster lifts; hero image gradients stay still and atmospheric. Avoid bouncy motion and avoid animating large layout shifts.

**Typography system:** use `Space Grotesk` for display and UI with `DM Sans` for supporting copy; strong titles use tight tracking and sentence case, while metadata uses compact uppercase labels.

**Brand essence:** ADEZ TV is the sharp, cinematic way to find what deserves your next watch. Personality: editorial, nocturnal, assured.

**Brand voice:** headlines sound like a confident programmer, never a generic catalog. Example lines: “Tonight’s signal” and “Find your next obsession.”

**Wordmark & logo:** ADEZ is set as a compact editorial masthead with a lime square/play mark replacing the crossbar energy of the E; “TV” sits as a small, tracked utility label.

**Signature brand color:** `#c8ff3d`, an electric lime that reads as a signal light against the blue-black interface.
