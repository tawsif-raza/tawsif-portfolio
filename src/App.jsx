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
import TechStack from "./sections/TechStack";
import CurrentFocus from "./sections/CurrentFocus";
import ClosingCta from "./sections/ClosingCta";
import IntroSequence from "./components/IntroSequence";
import Nav from "./components/Nav";
import Atmosphere from "./components/Atmosphere";
import CommandPalette from "./components/CommandPalette";
import GithubActivity from "./components/GithubActivity";

// The chat widget loads in its own chunk once the intro is done, so it never slows the first paint.
const AskTawsif = lazy(() => import("./components/AskTawsif/AskTawsif"));

export default function App({ initialIntroDone = false }) {
  const [introDone, setIntroDone] = useState(initialIntroDone);

  return (
    <div className="relative isolate min-h-screen w-full bg-bg">
      <Atmosphere />
      <div className="grain-overlay" />
      <IntroSequence onComplete={() => setIntroDone(true)} />
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
            <EngineeringMethodology />
            <Projects />
            <ArchitectureShowcase />
            <EngineeringImpact />
            <TechStack />
            <GithubActivity />
            <Services />
            <CurrentFocus />
            <Testimonials />
            <Contact />
            <ClosingCta />
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
