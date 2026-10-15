/* Fail-fast complete local regression runner; start the static server first. */
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const commands = [
  [
    "--test",
    "projects/marketing-game/tests/model.cjs",
    "projects/business-dashboard/tests/model.cjs",
    "projects/missed-inquiries/tests/model.cjs",
  ],
  ["projects/tour-rental/tests/pricing.cjs"],
  ["tests/portfolio.cjs"],
  ...[
    "clinic",
    "tour-rental",
    "missed-inquiries",
    "business-dashboard",
    "marketing-game",
  ].map((p) => [`projects/${p}/tests/browser.cjs`]),
  ["projects/marketing-game/tests/artwork.cjs"],
  ["tests/audit.cjs"],
];
for (const args of commands) {
  console.log(`\nRunning node ${args.join(" ")}`);
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("\nPASS complete portfolio regression suite");
