import { exec } from "node:child_process";
import { promisify } from "node:util";
const execAsync = promisify(exec);

export const PackageManagers = ["npm", "yarn", "pnpm"] as const;
export type PackageManager = (typeof PackageManagers)[number];

export class PackageManagerHandler {
  constructor(public readonly packageManager: PackageManager) {}

  public async create(...args: string[]) {
    const [firstArg, secondArg, ...restArgs] = args;
    await execAsync(
      `${this.packageManager} create${
        this.packageManager === "npm" ? " -y" : ""
      } ${firstArg} ${secondArg}${
        restArgs.length > 0 && this.packageManager === "npm" ? " --" : ""
      } ${restArgs.join(" ")}`.trim(),
    );
  }

  public async install(cwd?: string | URL | undefined) {
    await execAsync(`${this.packageManager} install`, {
      cwd,
    });
  }

  public async add(cwd?: string | URL | undefined, ...args: string[]) {
    await execAsync(`${this.packageManager} add ${args.join(" ")}`, {
      cwd,
    });
  }

  public async runPrettier(cwd?: string | URL | undefined) {
    await execAsync(`npx prettier --write .`, {
      cwd,
    });
  }
}
