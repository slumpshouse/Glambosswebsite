const { execSync } = require("node:child_process");
const { existsSync, readFileSync, statSync } = require("node:fs");

const MAX_FILE_BYTES = 2 * 1024 * 1024;

const ignoredPathFragments = [
  "node_modules/",
  ".next/",
  "dist/",
  "build/",
  "coverage/",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
];

const checks = [
  {
    name: "OpenAI API key",
    pattern: /sk-(proj-)?[A-Za-z0-9_-]{20,}/g,
  },
  {
    name: "Postgres connection string",
    pattern: /postgres(?:ql)?:\/\/[^\s'"`]+/gi,
  },
  {
    name: "Neon DB token-like string",
    pattern: /npg_[A-Za-z0-9]+/g,
  },
  {
    name: "Private key block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    name: "AWS access key",
    pattern: /AKIA[0-9A-Z]{16}/g,
  },
];

function shouldIgnoreFile(filePath) {
  return ignoredPathFragments.some((fragment) => filePath.includes(fragment));
}

function getStagedFiles() {
  const output = execSync("git diff --cached --name-only --diff-filter=ACMRTUXB", {
    stdio: ["ignore", "pipe", "ignore"],
    encoding: "utf8",
  }).trim();

  if (!output) return [];
  return output.split(/\r?\n/).filter(Boolean);
}

function detectSecrets(content) {
  const findings = [];

  for (const check of checks) {
    const matches = content.match(check.pattern);
    if (matches && matches.length > 0) {
      findings.push({
        name: check.name,
        sample: matches[0],
      });
    }
  }

  return findings;
}

function main() {
  let stagedFiles = [];

  try {
    stagedFiles = getStagedFiles();
  } catch {
    process.exit(0);
  }

  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  const violations = [];

  for (const filePath of stagedFiles) {
    if (shouldIgnoreFile(filePath)) continue;
    if (!existsSync(filePath)) continue;

    const fileStats = statSync(filePath);
    if (!fileStats.isFile() || fileStats.size > MAX_FILE_BYTES) continue;

    const content = readFileSync(filePath, "utf8");
    const findings = detectSecrets(content);

    if (findings.length > 0) {
      violations.push({ filePath, findings });
    }
  }

  if (violations.length === 0) {
    process.exit(0);
  }

  console.error("\nSecret scan failed: potential credentials detected in staged files.\n");

  for (const violation of violations) {
    console.error(`- ${violation.filePath}`);
    for (const finding of violation.findings) {
      const redacted = finding.sample.length > 12
        ? `${finding.sample.slice(0, 4)}...${finding.sample.slice(-4)}`
        : finding.sample;
      console.error(`  • ${finding.name}: ${redacted}`);
    }
  }

  console.error("\nRemove secrets from staged changes, rotate exposed keys, then commit again.\n");
  process.exit(1);
}

main();
