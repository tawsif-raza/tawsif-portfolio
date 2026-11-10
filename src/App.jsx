import { lazy, Suspense, useState } from "react";
import Hero from "./sections/Hero";
import AboutSpace from "./sections/AboutSpace";
import SkillsFloat from "./sections/SkillsFloat";
import Starfield from "./components/Starfield";
import Projects from "./sections/Projects";
import Services from "./sections/Services";
import Testimonials from "./sections/Testimonials";
import Contact from "./sections/Contact";
import Footer from "./sections/Footer";
import EngineeringMethodology from "./sections/EngineeringMethodology";
import ArchitectureShowcase from "./sections/ArchitectureShowcase";
import EngineeringImpact from "./sections/EngineeringImpact";
import IntroSequence from "./components/IntroSequence";
import Nav from "./components/Nav";
import Atmosphere from "./components/Atmosphere";
import CommandPalette from "./components/CommandPalette";
import GithubActivity from "./components/GithubActivity";

// The chat widget loads in its own chunk once the intro is done, so it never slows the first paint.
const AskTawsif = lazy(() => import("./components/AskTawsif/AskTawsif"));

// The intro plays once per browser session; refreshes go straight to the site.
function hasSeenIntro() {
  try {
    return sessionStorage.getItem("trk-intro-seen") === "1";
  } catch {
    return false;
  }
}

export default function App({ initialIntroDone = false }) {
  const [skipIntro] = useState(() => initialIntroDone || hasSeenIntro());
  const [introDone, setIntroDone] = useState(skipIntro);

  return (
    <div className="relative isolate min-h-screen w-full bg-bg">
      <Atmosphere />
      <div className="grain-overlay" />
      {!skipIntro && (
        <IntroSequence
          onReveal={() => setIntroDone(true)}
          onComplete={() => setIntroDone(true)}
        />
      )}
      {introDone && (
        <>
          <Nav />
          <CommandPalette />
          <main className="relative z-10">
            <Hero />
            {/* Space zone: stars drift behind the tech stack and the About story */}
            <div className="space-zone relative">
              <div className="space-zone__stars" aria-hidden="true">
                <Starfield className="sticky top-0 block h-screen w-full" />
              </div>
              <SkillsFloat />
              <AboutSpace />
            </div>
            <Projects />
            <Services />
            <EngineeringMethodology />
            <ArchitectureShowcase />
            <EngineeringImpact />
            <GithubActivity />
            <Testimonials />
            <Contact />
          </main>
          <Footer />
          <Suspense fallback={null}>
            <AskTawsif />
          </Suspense>
        </>
      )}
    </div>
  );
}
