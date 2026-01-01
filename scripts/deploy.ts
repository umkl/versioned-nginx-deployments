import { spawn } from "child_process";
import * as path from "path";

interface SimpleDeployConfig {
  sshHost: string; // Use the SSH config host name (like 'r15')
  localFilePath: string;
  remoteFilePath: string;
}

export async function deployFileViaScp(
  config: SimpleDeployConfig
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(
      `Deploying ${config.localFilePath} to ${config.sshHost}:${config.remoteFilePath}...`
    );

    // Use scp command which will respect your SSH config
    const scpProcess = spawn(
      "scp",
      [config.localFilePath, `${config.sshHost}:${config.remoteFilePath}`],
      {
        stdio: ["inherit", "pipe", "pipe"],
      }
    );

    let stdout = "";
    let stderr = "";

    scpProcess.stdout?.on("data", (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    scpProcess.stderr?.on("data", (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    scpProcess.on("close", (code) => {
      if (code === 0) {
        console.log(
          `✅ File deployed successfully to ${config.sshHost}:${config.remoteFilePath}`
        );
        resolve();
      } else {
        console.error("❌ SCP error:", stderr);
        reject(new Error(`SCP failed with code ${code}: ${stderr}`));
      }
    });

    scpProcess.on("error", (error) => {
      console.error("❌ SCP process error:", error);
      reject(error);
    });
  });
}

// Example usage
async function main() {
  const deployConfig: SimpleDeployConfig = {
    sshHost: "r15", // This matches your SSH config
    localFilePath: "./index.html",
    remoteFilePath: "/var/www/blog/index.html",
  };

  try {
    await deployFileViaScp(deployConfig);
    console.log("Deployment completed successfully");
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
