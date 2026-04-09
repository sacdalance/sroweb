const supportedMinMajor = 20;
const unsupportedMajor = 25;
const [major] = process.versions.node.split(".").map(Number);

if (major < supportedMinMajor || major >= unsupportedMajor) {
  console.error(
    [
      `Unsupported Node.js version: ${process.version}`,
      "srobackend currently supports Node.js 20, 22, and 24.",
      "Node.js 25 crashes during startup because a Google auth dependency still expects buffer.SlowBuffer.",
      "",
      "Switch to Node.js 22 if you want the safest default.",
      "Example with nvm:",
      "  nvm install 22",
      "  nvm use 22",
    ].join("\n")
  );

  process.exit(1);
}
