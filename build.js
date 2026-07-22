import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const rootDir = process.cwd();

console.log("📦 Installing frontend dependencies...");
execSync("npm install", { cwd: path.join(rootDir, "frontend"), stdio: "inherit" });

console.log("🏗️ Building frontend...");
execSync("npm run build", { cwd: path.join(rootDir, "frontend"), stdio: "inherit" });

console.log("🧹 Cleaning old public directory...");
const publicDir = path.join(rootDir, "public");
if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
}

console.log("🚚 Copying build assets to public...");
fs.cpSync(path.join(rootDir, "frontend", "dist"), publicDir, { recursive: true });

console.log("✅ Build complete!");
