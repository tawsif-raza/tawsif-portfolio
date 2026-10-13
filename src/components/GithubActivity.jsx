import githubActivity from "../data/github-activity.json";

function relativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function GithubActivity() {
  const { available, publicRepos, recentRepos } = githubActivity;

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 md:px-12">
      <div className="glass-card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <div>
              <h3 className="font-display text-base font-medium text-paper">Open Source & Activity</h3>
              <p className="font-mono text-[11px] text-faint">
                {available && typeof publicRepos === "number"
                  ? `${publicRepos} public repositories on GitHub`
                  : "Verified code activity"}
              </p>
            </div>
          </div>

          <a
            href="https://github.com/tawsif-raza"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-sm border border-line px-3 py-1.5 font-mono text-[11px] text-dim transition hover:border-accent hover:text-accent"
          >
            <span>View Profile</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        {/* Recent Repos Grid */}
        {available && recentRepos && recentRepos.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentRepos.map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-md border border-line/50 bg-surface/40 p-3.5 transition-all hover:border-accent-dim hover:bg-surface/70"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] font-medium text-paper transition-colors group-hover:text-accent">
                    {r.name}
                  </span>
                  <span className="text-[11px] text-dim opacity-0 transition-opacity group-hover:opacity-100">
                    ↗
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-faint">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-dim" />
                  <span>Pushed {relativeTime(r.pushedAt)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
