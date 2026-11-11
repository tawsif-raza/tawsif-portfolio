// The projects shown in the Work section. The hero and the Proof section
// read their counts from here too, so the numbers can't drift apart.
//
// A card links to `link`, or to each entry of an optional
// `links: [{ label, href }]`. An optional `demo` (address of a video) adds a
// "Watch demo" link. With none of these, it offers a walkthrough instead.
const BASE = import.meta.env.BASE_URL;

export const PROJECTS = [
  {
    title: "AI Outbound Engine",
    category: "Automation pipeline",
    status: "live",
    problem: "Manually prospecting and personalizing outreach doesn't scale.",
    approach:
      "Apollo search + enrichment feeds a dedupe layer, then Groq generates personalized outreach copy, drafted into Gmail for human review before sending.",
    outcome: "Running pipeline, offered as a paid build + retainer service.",
    stack: ["n8n", "Apollo", "Groq", "Gmail API"],
    link: null,
    image: `${BASE}project-outbound.jpg`,
  },
  {
    title: "The Highland Estate",
    category: "Frontend showcase",
    status: "live",
    problem: "Needed a polished frontend/UI-UX showcase beyond backend work.",
    approach:
      "Luxury resort site with a full-bleed video hero, 3D-tilt room cards, and scroll-triggered animation across the amenities section.",
    outcome: "Fully deployed, polished, working end-to-end.",
    stack: ["Next.js", "React", "Tailwind CSS", "Vercel"],
    link: "https://highland-estate.vercel.app/",
    image: `${BASE}project-highland.jpg`,
  },
  {
    title: "Qwen 2.5 AI Assistant",
    category: "AI/ML",
    status: "progress",
    problem: "Can a small fine-tuned model act as a reliable AI assistant for one job?",
    approach:
      "Qwen 2.5 (0.5B) fine-tuned with QLoRA on a curated 1,366-example dataset, served through LangGraph + FastAPI, containerized for AWS deployment.",
    outcome: "Data pipeline + training config complete; model training next.",
    stack: ["Qwen 2.5", "QLoRA", "LangGraph", "FastAPI", "PostgreSQL", "Docker"],
    link: "https://github.com/tawsif-raza/ai-voice-employee",
    image: `${BASE}project-voice.jpg`,
  },
  {
    title: "Vox AI",
    category: "Projects & generated videos",
    status: "live",
    problem: "Wanted a content venture with a distinct, consistent visual identity.",
    approach:
      "Gemini/Veo-generated 3D storytelling shorts with a recurring character, managed in one dashboard and automated toward auto-publishing via n8n + Claude MCP.",
    outcome: "Active on YouTube & Instagram; auto-publish automation underway.",
    stack: ["Gemini", "Veo", "n8n", "MCP"],
    link: "https://github.com/tawsif-raza/ai-auto-post",
    image: `${BASE}project-video.jpg`,
  },
  {
    title: "AI Video Studio",
    category: "Multi-agent system",
    status: "progress",
    problem: "Turning one story idea into a full, consistent video takes a team of specialists.",
    approach:
      "A LangGraph production graph: a Story Planner fans out with Send() to Scene, Character and Environment planners, a Prompt Generator subgraph writes the shots, and interrupt() with a Postgres checkpointer holds for human approval.",
    outcome: "5-node pipeline runs end-to-end; now polishing the final edit (audio ducking, subtitles, Ken Burns).",
    stack: ["LangGraph", "Gemini", "Groq", "PostgreSQL", "Python"],
    link: "https://github.com/tawsif-raza/ai-video-studio",
    image: `${BASE}project-studio.jpg`,
  },
  {
    title: "AI Video Editing Agent",
    category: "Agentic automation",
    status: "progress",
    problem: "Cutting raw footage by hand is slow, and AI edits need a human check before they ship.",
    approach:
      "faster-whisper transcribes locally, Claude proposes an edit plan as JSON, a human approves it, FFmpeg renders, and a QA gate checks black frames, silence and loudness (-14 LUFS). An n8n job queue tracks every clip.",
    outcome: "Full pipeline runs end-to-end and resumes after timeouts; testing on longer real clips next.",
    stack: ["Python", "faster-whisper", "Claude", "FFmpeg", "n8n"],
    link: null,
    image: `${BASE}project-editor.jpg`,
  },
  {
    title: "Daily Learning Digest",
    category: "Automation workflow",
    status: "live",
    problem: "New ML papers and lab announcements are spread across too many sites to follow by hand.",
    approach:
      "A scheduled n8n workflow pulls new arXiv papers and OpenAI, Hugging Face and DeepMind blog feeds, Gemini writes a short summary of each, and Gmail delivers one digest a day.",
    outcome: "Live and running daily, delivered as a single email.",
    stack: ["n8n", "Gemini", "arXiv API", "RSS", "Gmail API"],
    link: null,
    image: `${BASE}project-digest.jpg`,
  },
];

export const countByStatus = (status) => PROJECTS.filter((p) => p.status === status).length;
