// Work history, education and certifications for the Experience section.
// Only real entries go here. The section stays hidden while EXPERIENCE is
// empty, and each sub-list is skipped while it is empty.

// Newest first.
// { role: "AI Engineer", company: "Company name", location: "Bengaluru" (optional),
//   start: "Jan 2024", end: "Present", points: ["One line on what you did.", "..."] }
export const EXPERIENCE = [];

// { degree: "BCA, Data Science", school: "University name", years: "2020 – 2023", note: "" (optional) }
export const EDUCATION = [];

// { name: "Certificate name", issuer: "Issuer", year: "2025", href: "https://..." (optional) }
export const CERTIFICATIONS = [];

// Section labels after About are numbered 03, 04, ... The Experience section
// takes 03 when it is shown, so everything after it moves down by one.
export const sectionNo = (n) => String(n + (EXPERIENCE.length > 0 ? 1 : 0)).padStart(2, "0");
