import { useRef } from "react";
import gsap from "gsap";

export default function Magnetic({ children, className }) {
  const ref = useRef();
  const rectRef = useRef(null);

  const handleEnter = () => {
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
  };

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    if (!rectRef.current) {
      rectRef.current = el.getBoundingClientRect();
    }
    const rect = rectRef.current;
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, { x: x * 0.25, y: y * 0.25, duration: 0.3, ease: "power2.out", overwrite: "auto" });
  };

  const handleLeave = () => {
    rectRef.current = null;
    if (ref.current) {
      gsap.to(ref.current, { x: 0, y: 0, duration: 0.4, ease: "elastic.out(1, 0.4)", overwrite: "auto" });
    }
  };

  return (
    <span
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`inline-block ${className || ""}`}
    >
      {children}
    </span>
  );
}
