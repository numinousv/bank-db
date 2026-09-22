// VG feature-flag demo: deployment vs release.
//
// This component is always included in the Docker image (deployed), but it
// only renders (released) when the build-time flag is enabled:
//
//   NEXT_PUBLIC_FEATURE_NEW_DASHBOARD=false -> hidden (deployed, not released)
//   NEXT_PUBLIC_FEATURE_NEW_DASHBOARD=true  -> visible (released)
//
// NOTE: NEXT_PUBLIC_* vars are baked into the JS bundle at `next build`
// time, so flipping the flag requires a rebuild + redeploy.
const SHOW_NEW_DASHBOARD =
  process.env.NEXT_PUBLIC_FEATURE_NEW_DASHBOARD === "true";

export default function FeatureBanner() {
  if (!SHOW_NEW_DASHBOARD) return null;

  return (
    <section className="feature-banner" data-testid="new-dashboard-banner">
      <h2>Savings overview</h2>
      <p>New dashboard panel &mdash; released via feature flag.</p>
    </section>
  );
}
