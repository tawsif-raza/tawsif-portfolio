// Page backdrop below the hero: a blurred, dimmed echo of the hero film's
// frame plus two slow glows in the accent and tide colours, so sections
// look like they sit inside the film's light rather than on a flat panel.
const FILM = `${import.meta.env.BASE_URL}hero/hero-poster-sm.jpg`;

export default function Atmosphere() {
  return (
    <div className="afterglow" aria-hidden="true">
      <div className="afterglow__film" style={{ backgroundImage: `url(${FILM})` }} />
      <div className="afterglow__glow afterglow__glow--lime" />
      <div className="afterglow__glow afterglow__glow--tide" />
      <div className="afterglow__veil" />
    </div>
  );
}
