import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as z from "zod/v4";

const execFileAsync = promisify(execFile);

const ADB_PATH =
  "C:\\Users\\ujjaw\\Desktop\\platform-tools-latest-windows\\platform-tools\\adb.exe";

const ADB_TARGET = "10.63.54.47:5555";

const appPackages: Record<string, string> = {
  camera: "com.oplus.camera",
  chrome: "com.android.chrome",
  whatsapp: "com.whatsapp",
  youtube: "com.google.android.youtube",
  settings: "com.android.settings",
  contacts: "com.android.contacts",
  phone: "com.android.dialer",
  messages: "com.google.android.apps.messaging",
};

export const phoneOpenAppSchema = z.object({
  app: z.string(),
});

export async function phoneOpenApp({
  app,
}: z.infer<typeof phoneOpenAppSchema>) {
  try {
    const appName = app.toLowerCase().trim();

    const packageName = appPackages[appName];

    if (!packageName) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              `Unknown app: ${app}\n\n` +
              `Supported apps:\n` +
              Object.keys(appPackages).join(", "),
          },
        ],
        isError: true,
      };
    }

    const { stdout, stderr } = await execFileAsync(
      ADB_PATH,
      [
        "-s",
        ADB_TARGET,
        "shell",
        "monkey",
        "-p",
        packageName,
        "1",
      ],
      {
        windowsHide: true,
      }
    );

    return {
      content: [
        {
          type: "text" as const,
          text:
            `Opened ${appName}\n` +
            `Package: ${packageName}\n` +
            `${stdout || stderr}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Failed to open ${app}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}