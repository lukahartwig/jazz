import { execSync } from "child_process";

const currentAppName = process.env.APP_NAME;

// Run turbo to get affected packages
const turboOutput = execSync("pnpm turbo run build --dry=json").toString();
const affectedPackages = JSON.parse(turboOutput).packages;

// Check if the current app is in the affected packages
const shouldBuild = affectedPackages.includes(currentAppName);

if (shouldBuild) {
  console.log(`✅ Building ${currentAppName} as it is affected by changes.`);
  process.exit(1); // Continue with the build
} else {
  console.log(
    `🛑 Skipping build for ${currentAppName} as it is not affected by changes.`,
  );
  process.exit(0); // Skip the build
}
