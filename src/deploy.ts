import { spawn } from "child_process";

export interface SimpleDeployConfig {
  sshHost: string;
  localDistPath: string; // local dist folder to deploy
  remoteBasePath: string; // e.g. /var/www
  projectName: string;
}

function getDateTimeString() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    "_" +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

export async function deployDistViaScp(
  config: SimpleDeployConfig
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dateTime = getDateTimeString();
    const remoteReleaseDir = `${config.remoteBasePath}/${config.projectName}/releases/${dateTime}`;
    const remoteCurrentSymlink = `${config.remoteBasePath}/${config.projectName}/current`;

    console.log(
      `Deploying ${config.localDistPath} to ${config.sshHost}:${remoteReleaseDir}...`
    );

    // 1. Create remote release directory
    const sshMkdir = spawn(
      "ssh",
      [config.sshHost, `mkdir -p '${remoteReleaseDir}'`],
      { stdio: "inherit" }
    );

    sshMkdir.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Failed to create remote directory`));
      }

      // 2. Copy dist files to remote release directory
      // Copy the CONTENTS of the dist folder, not the folder itself
      const distPath = config.localDistPath.replace(/\/$/, "");
      const scpProcess = spawn(
        "scp",
        ["-r", `${distPath}/*`, `${config.sshHost}:'${remoteReleaseDir}/'`],
        { shell: true, stdio: "inherit" }
      );

      scpProcess.on("close", (scpCode) => {
        if (scpCode !== 0) {
          return reject(new Error(`SCP failed with code ${scpCode}`));
        }

        // 3. Update the current symlink
        const sshSymlink = spawn(
          "ssh",
          [
            config.sshHost,
            `ln -sfn '${remoteReleaseDir}/index.html' '${remoteCurrentSymlink}/index.html'`,
          ],
          { stdio: "inherit" }
        );

        sshSymlink.on("close", (symlinkCode) => {
          if (symlinkCode === 0) {
            console.log(
              `✅ Deployment complete. Current symlink updated to ${remoteReleaseDir}`
            );
            resolve();
          } else {
            reject(new Error(`Failed to update current symlink`));
          }
        });

        sshSymlink.on("error", (error) => {
          reject(error);
        });
      });

      scpProcess.on("error", (error) => {
        reject(error);
      });
    });

    sshMkdir.on("error", (error) => {
      reject(error);
    });
  });
}

async function main() {
  const deployConfig: SimpleDeployConfig = {
    sshHost: process.env.BLOG_HOST,
    localDistPath: "./dist",
    remoteBasePath: "/var/www",
    projectName: "blog",
  };

  try {
    await deployDistViaScp(deployConfig);
    console.log("Deployment completed successfully");
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
