import {
  ArrowLeft,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Film,
  Heart,
  Info,
  Loader2,
  Menu,
  Play,
  Plus,
  Search,
  Star,
  Tv,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TitleType = "movie" | "tv";

type CatalogItem = {
  id: number;
  slug: string;
  title: string;
  year?: number | null;
  rating?: number | null;
  poster?: string | null;
  backdrop?: string | null;
  type: TitleType;
};

type CatalogRow = {
  key: string;
  title: string;
  type: TitleType | string;
  items: CatalogItem[];
};

type MovieDetails = CatalogItem & {
  tagline?: string | null;
  overview?: string | null;
  runtime?: number | null;
  votes?: number | null;
  genres?: string[];
  cast?: Array<{ id: number; name: string; character?: string; photo?: string }>;
  similar?: CatalogItem[];
};

type HomePayload = { data?: { rows?: CatalogRow[] } };
type DetailPayload = { data?: { movie?: MovieDetails; tv?: MovieDetails } };

type Tab = "home" | "movies" | "series" | "my-list";

const genreOptions = [
  { label: "Action", key: "action" },
  { label: "Comedy", key: "comedy" },
  { label: "Sci-Fi", key: "scifi" },
  { label: "Horror", key: "horror" },
  { label: "Crime", key: "crime" },
  { label: "Drama", key: "drama" },
];

const fallbackCopy = "A new night of stories is waiting.";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

function uniqueItems(rows: CatalogRow[]) {
  const items = new Map<string, CatalogItem>();
  rows.forEach(row => row.items.forEach(item => items.set(`${item.type}-${item.id}`, item)));
  return Array.from(items.values());
}

function Poster({ item, eager = false, className = "" }: { item: CatalogItem; eager?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`poster-frame ${className}`}>
      {!failed && item.poster ? (
        <img
          src={item.poster}
          alt={item.title}
          loading={eager ? "eager" : "lazy"}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="poster-fallback"><Film size={24} /><span>{item.title}</span></div>
      )}
      <div className="poster-sheen" />
    </div>
  );
}

function Rating({ value }: { value?: number | null }) {
  if (!value) return <span className="rating muted">Not rated</span>;
  return <span className="rating"><Star size={12} fill="currentColor" /> {value.toFixed(1)}</span>;
}

function MovieCard({
  item,
  saved,
  onOpen,
  onToggleSaved,
}: {
  item: CatalogItem;
  saved: boolean;
  onOpen: (item: CatalogItem) => void;
  onToggleSaved: (item: CatalogItem) => void;
}) {
  return (
    <article className="movie-card group" onClick={() => onOpen(item)}>
      <div className="card-poster-wrap">
        <Poster item={item} />
        <button
          className={`save-fab ${saved ? "is-saved" : ""}`}
          aria-label={saved ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
          onClick={event => { event.stopPropagation(); onToggleSaved(item); }}
        >
          {saved ? <Check size={15} /> : <Plus size={15} />}
        </button>
        <div className="card-play"><Play size={17} fill="currentColor" /></div>
      </div>
      <div className="card-copy">
        <div className="card-title-row"><h3>{item.title}</h3><Rating value={item.rating} /></div>
        <p>{item.year || "Coming soon"} <span>·</span> {item.type === "tv" ? "Series" : "Movie"}</p>
      </div>
    </article>
  );
}

function Rail({
  row,
  savedIds,
  onOpen,
  onToggleSaved,
}: {
  row: CatalogRow;
  savedIds: Set<string>;
  onOpen: (item: CatalogItem) => void;
  onToggleSaved: (item: CatalogItem) => void;
}) {
  const railId = `rail-${row.key}`;
  return (
    <section className="content-rail" aria-labelledby={railId}>
      <div className="rail-heading">
        <div><span className="eyebrow">Curated channel</span><h2 id={railId}>{row.title.replace(/^\S+\s/, "")}</h2></div>
        <div className="rail-controls">
          <button aria-label={`Scroll ${row.title} left`} onClick={() => document.getElementById(railId)?.parentElement?.querySelector(".rail-track")?.scrollBy({ left: -480, behavior: "smooth" })}><ChevronLeft size={17} /></button>
          <button aria-label={`Scroll ${row.title} right`} onClick={() => document.getElementById(railId)?.parentElement?.querySelector(".rail-track")?.scrollBy({ left: 480, behavior: "smooth" })}><ChevronRight size={17} /></button>
        </div>
      </div>
      <div className="rail-track">
        {row.items.map(item => <MovieCard key={`${item.type}-${item.id}`} item={item} saved={savedIds.has(`${item.type}-${item.id}`)} onOpen={onOpen} onToggleSaved={onToggleSaved} />)}
      </div>
    </section>
  );
}

function DetailSheet({
  item,
  detail,
  loading,
  saved,
  onClose,
  onToggleSaved,
  onOpen,
  onWatch,
}: {
  item: CatalogItem;
  detail?: MovieDetails;
  loading: boolean;
  saved: boolean;
  onClose: () => void;
  onToggleSaved: (item: CatalogItem) => void;
  onOpen: (item: CatalogItem) => void;
  onWatch: (item: CatalogItem) => void;
}) {
  const display = detail ?? item;
  return (
    <div className="detail-overlay" role="dialog" aria-modal="true" aria-label={`${display.title} details`} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="detail-sheet">
        <button className="detail-close" onClick={onClose} aria-label="Close details"><X size={20} /></button>
        <div className="detail-backdrop" style={{ backgroundImage: `linear-gradient(90deg, rgba(8,10,16,.98) 12%, rgba(8,10,16,.76) 48%, rgba(8,10,16,.22)), linear-gradient(0deg, #080a10 0%, transparent 62%), url(${detail?.backdrop || item.poster || ""})` }} />
        <div className="detail-content">
          <span className="eyebrow accent">ADEZ TV / TITLE PROFILE</span>
          <h2>{display.title}</h2>
          <div className="detail-meta"><span>{display.year || "—"}</span><span className="meta-dot">•</span><span>{display.type === "tv" ? "Series" : "Movie"}</span>{detail?.runtime ? <><span className="meta-dot">•</span><span>{detail.runtime} min</span></> : null}<Rating value={display.rating} /></div>
          {detail?.tagline ? <p className="detail-tagline">{detail.tagline}</p> : null}
          {loading ? <div className="detail-loading"><Loader2 className="spin" size={18} /> Loading title profile…</div> : <p className="detail-overview">{detail?.overview || fallbackCopy}</p>}
          <div className="detail-actions"><button className="primary-btn" onClick={() => onWatch(item)}><Play size={17} fill="currentColor" /> Watch now</button><button className={`secondary-btn ${saved ? "active" : ""}`} onClick={() => onToggleSaved(item)}>{saved ? <Check size={17} /> : <Plus size={17} />} {saved ? "In My List" : "Add to My List"}</button></div>
          {detail?.genres?.length ? <div className="genre-list">{detail.genres.map(genre => <span key={genre}>{genre}</span>)}</div> : null}
          {detail?.cast?.length ? <div className="cast-strip"><span className="eyebrow">Featuring</span><div className="cast-row">{detail.cast.slice(0, 5).map(person => <div className="cast-item" key={person.id}><div className="cast-photo">{person.photo ? <img src={person.photo} alt="" /> : <span>{person.name[0]}</span>}</div><div><b>{person.name}</b><small>{person.character}</small></div></div>)}</div></div> : null}
          {detail?.similar?.length ? <div className="related"><div className="rail-heading"><div><span className="eyebrow">Keep exploring</span><h3>Related titles</h3></div></div><div className="related-track">{detail.similar.slice(0, 6).map(related => <button key={related.id} onClick={() => onOpen(related)}><Poster item={related} /><span>{related.title}</span></button>)}</div></div> : null}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [detail, setDetail] = useState<MovieDetails>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("adez-my-list") || "[]"); } catch { return []; } });

  const savedIds = useMemo(() => new Set(saved), [saved]);
  const allItems = useMemo(() => uniqueItems(rows), [rows]);
  const featured = useMemo(() => rows.find(row => row.key === "new-movies")?.items?.[1] || allItems[0], [rows, allItems]);

  useEffect(() => {
    fetchJson<HomePayload>("/api/movies/home")
      .then(payload => setRows(payload.data?.rows || []))
      .catch(() => setError("We couldn’t tune into the catalog. Try again in a moment."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { localStorage.setItem("adez-my-list", JSON.stringify(saved)); }, [saved]);

  useEffect(() => {
    if (!featured) return;
    fetchJson<DetailPayload>(`/api/movies/details/${featured.type}/${featured.id}`)
      .then(payload => { if (payload.data?.movie || payload.data?.tv) setDetail(payload.data.movie || payload.data.tv); })
      .catch(() => undefined);
  }, [featured]);

  const openDetail = async (item: CatalogItem) => {
    setSelected(item);
    setDetail(undefined);
    setDetailLoading(true);
    try {
      const payload = await fetchJson<DetailPayload>(`/api/movies/details/${item.type}/${item.id}`);
      setDetail(payload.data?.movie || payload.data?.tv);
    } catch {
      setDetail(undefined);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleSaved = (item: CatalogItem) => {
    const id = `${item.type}-${item.id}`;
    setSaved(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  };

  const watchItem = (item: CatalogItem) => {
    window.location.href = `/watch/${item.type}/${item.id}`;
  };

  const tabRows = useMemo(() => {
    if (tab === "movies") return rows.filter(row => row.type === "movie").slice(0, 5);
    if (tab === "series") return rows.filter(row => row.type === "tv").slice(0, 5);
    if (tab === "my-list") return [{ key: "my-list", title: "My saved titles", type: "mixed", items: allItems.filter(item => savedIds.has(`${item.type}-${item.id}`)) }];
    return rows.slice(0, 8);
  }, [allItems, rows, savedIds, tab]);

  const visibleRows = genre ? tabRows.filter(row => row.key.includes(genre)) : tabRows;
  const searchResults = useMemo(() => allItems.filter(item => {
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase());
    const matchesTab = tab === "movies" ? item.type === "movie" : tab === "series" ? item.type === "tv" : true;
    return matchesQuery && matchesTab;
  }).slice(0, 30), [allItems, query, tab]);

  const navigate = (nextTab: Tab) => { setTab(nextTab); setGenre(""); setQuery(""); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("home")} aria-label="ADEZ TV home"><span className="brand-mark"><Play size={12} fill="currentColor" /></span><span>ADEZ</span><small>TV</small></button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {(["home", "movies", "series", "my-list"] as Tab[]).map(item => <button key={item} className={tab === item ? "active" : ""} onClick={() => navigate(item)}>{item === "my-list" ? "My List" : item[0].toUpperCase() + item.slice(1)}</button>)}
        </nav>
        <div className="top-actions"><label className="search-box"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search titles" aria-label="Search titles" /><kbd>⌘ K</kbd></label><button className="icon-btn hide-mobile" aria-label="Notifications"><Bell size={18} /></button><button className="avatar-btn" aria-label="Profile">N</button><button className="icon-btn mobile-only" aria-label="Open menu"><Menu size={20} /></button></div>
      </header>

      {loading ? <div className="loading-state"><Loader2 className="spin" size={22} /><span>Finding your next watch…</span></div> : error ? <div className="error-state"><span>{error}</span><button onClick={() => window.location.reload()}>Retry</button></div> : (
        <>
          {tab === "home" && !query && !genre && featured ? <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(8,10,16,1) 0%, rgba(8,10,16,.9) 30%, rgba(8,10,16,.12) 78%), linear-gradient(0deg, #080a10 0%, transparent 48%), url(${detail?.backdrop || featured.poster})` }}>
            <div className="hero-copy"><span className="eyebrow accent"><span className="live-dot" /> Tonight’s signal</span><h1>{featured.title}</h1><div className="hero-meta"><span>{featured.year}</span><span>•</span><span>{featured.type === "tv" ? "Series" : "Movie"}</span><Rating value={featured.rating} /></div><p>{detail?.overview || "A fresh signal from the catalog, selected for your next late-night watch."}</p><div className="hero-actions"><button className="primary-btn" onClick={() => watchItem(featured)}><Play size={17} fill="currentColor" /> Watch now</button><button className="ghost-btn" onClick={() => openDetail(featured)}><Info size={17} /> More info</button></div></div><div className="hero-credit"><span>Featured on</span><b>ADEZ TV</b><small>UPDATED DAILY</small></div>
          </section> : null}

          <main className="content-wrap">
            <div className="welcome-row"><div><span className="eyebrow">ADEZ TV / DISCOVER</span><h2>{query ? `Results for “${query}”` : tab === "my-list" ? "Your saved titles" : tab === "movies" ? "Movies, selected for you" : tab === "series" ? "Series worth staying in for" : "Find your next obsession"}</h2></div>{!query && <div className="genre-pills"><button className={!genre ? "active" : ""} onClick={() => setGenre("")}>All</button>{genreOptions.map(option => <button key={option.key} className={genre === option.key ? "active" : ""} onClick={() => setGenre(option.key)}>{option.label}</button>)}</div>}</div>
            {query ? <section className="search-grid">{searchResults.length ? searchResults.map(item => <MovieCard key={`${item.type}-${item.id}`} item={item} saved={savedIds.has(`${item.type}-${item.id}`)} onOpen={openDetail} onToggleSaved={toggleSaved} />) : <div className="empty-state"><Search size={30} /><h3>No titles found</h3><p>Try a different title or browse one of the channels above.</p></div>}</section> : visibleRows.length ? visibleRows.map(row => <Rail key={row.key} row={row} savedIds={savedIds} onOpen={openDetail} onToggleSaved={toggleSaved} />) : <div className="empty-state"><Heart size={30} /><h3>Your list is waiting</h3><p>Save a title with the plus button and it will show up here.</p></div>}
          </main>
        </>
      )}

      <nav className="mobile-nav" aria-label="Mobile navigation">{(["home", "movies", "series", "my-list"] as Tab[]).map(item => <button key={item} className={tab === item ? "active" : ""} onClick={() => navigate(item)}>{item === "home" ? <Clapperboard size={19} /> : item === "movies" ? <Film size={19} /> : item === "series" ? <Tv size={19} /> : <Heart size={19} />}<span>{item === "my-list" ? "My List" : item[0].toUpperCase() + item.slice(1)}</span></button>)}</nav>
      {selected ? <DetailSheet item={selected} detail={detail} loading={detailLoading} saved={savedIds.has(`${selected.type}-${selected.id}`)} onClose={() => setSelected(null)} onToggleSaved={toggleSaved} onOpen={openDetail} onWatch={watchItem} /> : null}
    </div>
  );
}
