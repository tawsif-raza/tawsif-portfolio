// Sample tasks for the "Run a sample task" demo in the Architecture section.
// Everything here is scripted, made-up sample data: nothing is sent anywhere.
// Each task has one step per stage of its architecture, in the same order as
// the `nodes` list in sections/ArchitectureShowcase.jsx.
//
// A step with `gate` stops and asks the visitor to approve or reject, the way
// the real pipeline waits for a person.
export const DEMO_RUNS = {
  "voice-employee": [
    {
      label: "Caller wants to move an appointment to Friday",
      steps: [
        { lines: ["Request is valid. New session thread opened."] },
        { lines: ["Intent: reschedule an appointment.", "Route: tool branch, not a direct answer."] },
        { lines: ['Draft reply: "I can move you to Friday at 3 pm. Shall I confirm?"'] },
        { lines: ["Checkpoint saved. The conversation can resume from this point."] },
        {
          lines: ["Changing a booking is a high-stakes action, so the graph pauses here."],
          gate: {
            question: "You are the human reviewer. Commit the booking change?",
            approve: "Approved. The booking is changed and the reply is sent.",
            reject: "Rejected. Nothing is changed; the caller is told a person will follow up.",
          },
        },
      ],
    },
    {
      label: "Caller asks for the opening hours",
      steps: [
        { lines: ["Request is valid. New session thread opened."] },
        { lines: ["Intent: a simple question.", "Route: direct answer."] },
        { lines: ['Reply: "We are open 9 am to 6 pm, Monday to Saturday."'] },
        { lines: ["Checkpoint saved. The conversation can resume from this point."] },
        { lines: ["No high-stakes action in this turn, so the gate lets it through."] },
      ],
    },
  ],
  "outbound-engine": [
    {
      label: "Find SaaS founders in Bengaluru",
      steps: [
        { lines: ["Apollo search: SaaS, 11 to 50 staff, Bengaluru.", "8 leads found."] },
        { lines: ["3 were contacted inside the retention window and are dropped.", "5 remain."] },
        { lines: ["5 outreach angles written, one per lead, from each company's pitch."] },
        { lines: ["4 pass.", "1 is over 120 words and is flagged for manual review."] },
        {
          lines: ["4 drafts are ready for Gmail. Nothing goes out without a person."],
          gate: {
            question: "You are the human reviewer. Save these 4 as Gmail drafts?",
            approve: "Approved. 4 drafts created in Gmail, 0 sent. Sending stays a manual step.",
            reject: "Rejected. No drafts created; the copy is kept for a rewrite.",
          },
        },
      ],
    },
    {
      label: "Weekly run: D2C brands hiring for support",
      steps: [
        { lines: ["Scheduled run. Apollo search: D2C brands hiring support roles.", "12 leads found."] },
        { lines: ["5 are already in the CRM and are dropped.", "7 remain."] },
        { lines: ["7 outreach angles written, tied to each brand's support load."] },
        { lines: ["7 pass: under 120 words, no banned words, every variable filled."] },
        { lines: ["7 drafts created in Gmail, 0 sent. A person reviews before anything goes out."] },
      ],
    },
  ],
};
