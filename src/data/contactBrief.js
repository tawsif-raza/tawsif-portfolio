// The quick-pick questions above the contact form. A visitor first says why
// they are here (a build, or a role), then taps answers; the answers are
// written into the message box for them and sent along as separate fields.
//
// To change a question or an answer, edit the lists below. `name` is the
// field name the answer arrives under in the Formspree email.
export const CONTACT_MODES = [
  {
    id: "client",
    tab: "I need something built",
    messageLabel: "Tell me about your project",
    groups: [
      {
        name: "need",
        title: "What do you need?",
        line: "I need",
        options: ["An automation workflow", "An AI agent or assistant", "A custom or fine-tuned model", "A full build", "Not sure yet"],
      },
      {
        name: "timeline",
        title: "When do you need it?",
        line: "Timeline",
        options: ["As soon as possible", "Within a month", "1 to 3 months", "Flexible"],
      },
      {
        name: "budget",
        title: "Budget",
        line: "Budget",
        options: ["Under $1,000", "$1,000 to $5,000", "Over $5,000", "Not sure yet"],
      },
    ],
  },
  {
    id: "hiring",
    tab: "I'm hiring for a role",
    messageLabel: "Tell me about the role",
    groups: [
      {
        name: "role_type",
        title: "Type of role",
        line: "Role type",
        options: ["Full-time", "Contract", "Freelance"],
      },
      {
        name: "work_mode",
        title: "Where is it based?",
        line: "Work mode",
        options: ["Remote", "Hybrid", "On-site"],
      },
    ],
  },
];

// The lines written into the message box for the answers picked so far.
// Ends with a blank line so the visitor's own words start below it.
export function composeBrief(mode, picks) {
  const lines = mode.groups.filter((g) => picks[g.name]).map((g) => `${g.line}: ${picks[g.name]}.`);
  return lines.length ? `${lines.join("\n")}\n\n` : "";
}
