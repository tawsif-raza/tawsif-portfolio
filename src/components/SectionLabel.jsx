export default function SectionLabel({ number, title }) {
  return (
    <div className="section-label mb-8">
      <span>
        {number} — {title}
      </span>
    </div>
  );
}
