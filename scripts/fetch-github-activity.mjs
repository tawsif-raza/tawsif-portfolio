// Runs as a `prebuild` step so the site ships with real, verifiable GitHub
// activity baked into the static bundle -- zero client-side API calls, zero
// rate-limit exposure for actual visitors, refreshed on every deploy.
//
// Never fabricates data. If the fetch fails (rate limit, network, etc.),
// this leaves any existing data file untouched (last known good) rather
// than crashing the build or writing fake numbers -- confirmed necessary:
// this sandbox's own shared egress IP hit GitHub's unauthenticated 60/hr
// limit while building this, so the failure path is not hypothetical.
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "..", "src", "data", "github-activity.json");
const USERNAME = "tawsif-raza";

async function main() {
  try {
    const [profileRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${USERNAME}`, {
        headers: { Accept: "application/vnd.github+json" },
      }),
      fetch(`https://api.github.com/users/${USERNAME}/repos?sort=pushed&per_page=5`, {
        headers: { Accept: "application/vnd.github+json" },
      }),
    ]);

    if (!profileRes.ok || !reposRes.ok) {
      throw new Error(`GitHub API returned ${profileRes.status}/${reposRes.status}`);
    }

    const profile = await profileRes.json();
    const repos = await reposRes.json();

    const data = {
      available: true,
      fetchedAt: new Date().toISOString(),
      publicRepos: profile.public_repos ?? null,
      recentRepos: repos
        .filter((r) => !r.fork)
        .slice(0, 3)
        .map((r) => ({
          name: r.name,
          pushedAt: r.pushed_at,
          url: r.html_url,
        })),
    };

    writeFileSync(OUT_PATH, JSON.stringify(data, null, 2));
    console.log(`[github-activity] wrote fresh data (${data.recentRepos.length} repos)`);
  } catch (err) {
    if (existsSync(OUT_PATH)) {
      console.warn(`[github-activity] fetch failed (${err.message}) -- keeping existing data file`);
    } else {
      console.warn(`[github-activity] fetch failed (${err.message}) -- no prior data, writing "unavailable" placeholder`);
      writeFileSync(
        OUT_PATH,
        JSON.stringify({ available: false, fetchedAt: null, publicRepos: null, recentRepos: [] }, null, 2)
      );
    }
  }
}

main();
