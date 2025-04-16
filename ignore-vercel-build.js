import { execSync } from "child_process";

const currentAppName = process.env.APP_NAME || process.argv[2];

try {
  // In Vercel CI, we need to use the remote cache and filter for the current app
  const turboCommand = `pnpm turbo run build --dry=json --filter=${currentAppName}...[origin/main]`;
  const turboOutput = execSync(turboCommand).toString();

  const affectedPackages = JSON.parse(turboOutput).packages;
  const shouldBuild = affectedPackages.includes(currentAppName);

  if (shouldBuild) {
    console.log(
      `✅ Building "${currentAppName}" as it is affected by changes.`,
    );
    process.exit(1); // Continue with the build
  } else {
    console.log(
      `🛑 Skipping build for "${currentAppName}" as it is not affected by changes.`,
    );
    process.exit(0); // Skip the build
  }
} catch (error) {
  // If we can't parse the turbo output or something goes wrong,
  // we should build to be safe
  console.log(`⚠️ Error determining affected packages: ${error.message}`);
  console.log(`⚠️ Proceeding with build for "${currentAppName}" to be safe.`);
  process.exit(1);
}
