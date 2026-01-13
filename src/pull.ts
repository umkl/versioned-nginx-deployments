import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

export interface SimpleDeployConfig {
  sshHost: string;
  localDistPath: string; // local dist folder to pull into
  remoteBasePath: string; // e.g. /var/www
  projectName: string;
}

function getRemoteReleasesDir(config: SimpleDeployConfig) {
  return `${config.remoteBasePath}/${config.projectName}/releases`;
}

function getRemoteCurrentSymlink(config: SimpleDeployConfig) {
  return `${config.remoteBasePath}/${config.projectName}/current`;
}

async function getLatestRemoteReleaseDir(
  config: SimpleDeployConfig
): Promise<string> {
  return new Promise((resolve, reject) => {
    const releasesDir = getRemoteReleasesDir(config);
    // List releases, sort, pick the latest
    const ssh = spawn(
      "ssh",
      [config.sshHost, `ls -1 ${releasesDir} | sort | tail -n 1`],
      { stdio: ["ignore", "pipe", "inherit"] }
    );

    let output = "";
    ssh.stdout.on("data", (data) => {
      output += data.toString();
    });

    ssh.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error("Failed to list remote releases"));
      }
      const latest = output.trim();
      if (!latest) {
        return reject(new Error("No releases found on remote"));
      }
      resolve(`${releasesDir}/${latest}`);
    });

    ssh.on("error", (err) => reject(err));
  });
}

export async function pullLatestRelease(
  config: SimpleDeployConfig
): Promise<void> {
  // Ensure localDistPath exists and is empty
  if (fs.existsSync(config.localDistPath)) {
    fs.rmSync(config.localDistPath, { recursive: true, force: true });
  }
  fs.mkdirSync(config.localDistPath, { recursive: true });

  const latestReleaseDir = await getLatestRemoteReleaseDir(config);

  return new Promise((resolve, reject) => {
    // Copy all contents from remote latest release dir to localDistPath
    const scp = spawn(
      "scp",
      [
        "-r",
        `${config.sshHost}:'${latestReleaseDir}/*'`,
        path.resolve(config.localDistPath) + "/",
      ],
      { shell: true, stdio: "inherit" }
    );

    scp.on("close", (code) => {
      if (code === 0) {
        console.log(
          `✅ Pulled latest release from ${latestReleaseDir} to ${config.localDistPath}`
        );
        resolve();
      } else {
        reject(new Error(`SCP failed with code ${code}`));
      }
    });

    scp.on("error", (err) => reject(err));
  });
}

async function main() {
  const deployConfig: SimpleDeployConfig = {
    sshHost: process.env.BLOG_HOST as string,
    localDistPath: "./dist",
    remoteBasePath: "/var/www",
    projectName: "blog",
  };

  try {
    await pullLatestRelease(deployConfig);
    console.log("Pull completed successfully");
  } catch (error) {
    console.error("Pull failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
