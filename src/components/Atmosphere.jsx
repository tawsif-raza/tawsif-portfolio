// Page backdrop below the hero: a blurred, dimmed echo of the hero film's
// frame plus two slow glows in the accent and tide colours, so sections
// look like they sit inside the film's light rather than on a flat panel.
// The image is the hero poster pre-blurred/saturated/dimmed offline, so this
// always-animating full-viewport layer never runs a live CSS blur.
const FILM = `${import.meta.env.BASE_URL}hero/hero-afterglow.jpg`;

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
