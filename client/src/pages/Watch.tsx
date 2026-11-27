import { ArrowLeft, Film, Loader2, Play, RefreshCw, Tv } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";

type TitleType = "movie" | "tv";

type Title = {
  id: number;
  title: string;
  year?: number | null;
  rating?: number | null;
  poster?: string | null;
  backdrop?: string | null;
  type: TitleType;
  overview?: string | null;
  runtime?: number | null;
};

type DetailPayload = { data?: { movie?: Title; tv?: Title } };
type Stream = { url?: string; format?: string; quality?: string; resolution?: string; size?: number; duration?: number };
type StreamPayload = { data?: { streams?: Stream[]; status?: boolean; hint?: string }; error?: string };

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status})`);
  return payload as T;
}

function streamLabel(stream: Stream, index: number) {
  return stream.quality || stream.resolution || stream.format || `Source ${index + 1}`;
}

export default function Watch() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [, navigate] = useLocation();
  const titleType = type === "tv" ? "tv" : "movie";
  const validId = /^\d+$/.test(id || "");
  const [title, setTitle] = useState<Title>();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<Stream>();
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [loadingTitle, setLoadingTitle] = useState(true);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  useEffect(() => {
    if (!validId) return;
    setLoadingTitle(true);
    fetchJson<DetailPayload>(`/api/movies/details/${titleType}/${id}`)
      .then(payload => setTitle(payload.data?.movie || payload.data?.tv))
      .catch(() => setTitle(undefined))
      .finally(() => setLoadingTitle(false));
  }, [id, titleType, validId]);

  const loadStreams = useCallback(async () => {
    if (!validId) return;
    setLoadingStreams(true);
    setError("");
    setHint("");
    setStreams([]);
    setSelectedStream(undefined);
    const params = new URLSearchParams();
    if (titleType === "tv") {
      params.set("season", String(season));
      params.set("episode", String(episode));
    }
    try {
      const payload = await fetchJson<StreamPayload>(`/api/movies/stream/${titleType}/${id}?${params}`);
      const available = payload.data?.streams?.filter(stream => typeof stream.url === "string" && stream.url.length > 0) || [];
      setHint(payload.data?.hint || "");
      if (!available.length) {
        setError(titleType === "tv" ? `No stream found for season ${season}, episode ${episode}.` : "No streaming source is available for this title.");
        return;
      }
      setStreams(available);
      setSelectedStream(available.find(stream => stream.format?.toLowerCase() === "mp4") || available[0]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The stream could not be loaded.");
    } finally {
      setLoadingStreams(false);
    }
  }, [episode, id, season, titleType, validId]);

  useEffect(() => { void loadStreams(); }, [loadStreams]);

  const videoType = useMemo(() => {
    const format = selectedStream?.format?.toLowerCase() || "";
    return format.includes("m3u8") || selectedStream?.url?.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4";
  }, [selectedStream]);

  if (!validId) {
    return <div className="watch-page"><div className="watch-empty"><Film size={30} /><h1>Title not found</h1><Link href="/" className="primary-btn">Back to ADEZ TV</Link></div></div>;
  }

  return (
    <div className="watch-page">
      <header className="watch-topbar">
        <Link href="/" className="watch-back"><ArrowLeft size={17} /> Back to browse</Link>
        <span className="watch-wordmark">ADEZ <small>TV</small></span>
      </header>
      <main className="watch-main">
        <div className="watch-heading">
          <div>
            <span className="eyebrow accent"><Play size={11} fill="currentColor" /> Now playing</span>
            <h1>{loadingTitle ? "Loading title…" : title?.title || "ADEZ TV stream"}</h1>
            <p>{title?.year || ""}{title?.year ? " · " : ""}{titleType === "tv" ? "Series" : "Movie"}{title?.runtime ? ` · ${title.runtime} min` : ""}</p>
          </div>
          {titleType === "tv" ? <Tv size={25} className="watch-heading-icon" /> : <Film size={25} className="watch-heading-icon" />}
        </div>

        <section className="player-frame" aria-label={`${title?.title || "Title"} video player`}>
          {loadingStreams ? <div className="player-message"><Loader2 className="spin" size={28} /><span>Connecting to the stream…</span></div> : selectedStream ? <video key={selectedStream.url} className="video-player" controls autoPlay playsInline poster={title?.backdrop || title?.poster || undefined}><source src={selectedStream.url} type={videoType} />Your browser does not support HTML5 video playback.</video> : <div className="player-message"><Film size={30} /><span>{error || "No stream loaded."}</span>{hint ? <small>{hint}</small> : null}<button className="secondary-btn" onClick={() => void loadStreams()}><RefreshCw size={15} /> Try again</button></div>}
        </section>

        <div className="watch-controls">
          {titleType === "tv" ? <div className="episode-controls"><label>Season <input min={1} type="number" value={season} onChange={event => setSeason(Math.max(1, Number(event.target.value) || 1))} /></label><label>Episode <input min={1} type="number" value={episode} onChange={event => setEpisode(Math.max(1, Number(event.target.value) || 1))} /></label><button className="primary-btn" onClick={() => void loadStreams()} disabled={loadingStreams}><RefreshCw size={15} /> Load episode</button></div> : null}
          {streams.length > 1 ? <div className="source-picker"><span className="eyebrow">Available sources</span>{streams.map((stream, index) => <button key={`${stream.url}-${index}`} className={stream.url === selectedStream?.url ? "active" : ""} onClick={() => setSelectedStream(stream)}>{streamLabel(stream, index)}</button>)}</div> : null}
        </div>

        {error && selectedStream ? <p className="watch-note">{error}</p> : null}
        {title?.overview ? <p className="watch-overview">{title.overview}</p> : null}
        <button className="watch-close" onClick={() => navigate("/")}><ArrowLeft size={15} /> Choose another title</button>
      </main>
    </div>
  );
}
