import { count, rate } from '../format.js';
import type { Metric } from '../types.js';
import { line, publishedInWindow, verifiedInWindow } from './shared.js';

export const verifiedReleases: Metric = {
  id: 'verified-releases',
  title: 'Verified releases',
  definition: 'Published, non-draft, non-prerelease releases in the window whose notes hold a "## Verified" heading followed by a link to a portfolio Actions run that concluded success and was created after the release was published, confirmed by one REST call per release. Green CI is not a deploy.',
  gaming: 'Paste a heading with any link. Cut trivial releases to inflate the count.',
  crossCheck: 'Unverified releases are listed by name with the reason, in gray, never hidden.',
  compute(data) {
    const all = data.repos.flatMap((repo) => publishedInWindow(repo, data).map((release) => ({ repo, release })));
    return {
      headline: rate(all.filter((e) => e.release.verification.ok).length, all.length),
      rows: data.repos.map((repo) => line(`${repo.name}: ${count(verifiedInWindow(repo, data).length, publishedInWindow(repo, data).length)}`)),
      crossCheck: all.flatMap((e) =>
        e.release.verification.ok ? [] : [line(`${e.repo.name} ${e.release.name}: ${e.release.verification.reason}`, e.release.url, true)],
      ),
    };
  },
};
