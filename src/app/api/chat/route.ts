import { z } from "zod";
import { getSystemPrompt } from "@/lib/prompt";
import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import Sandbox from "@e2b/code-interpreter";
import { getSandBox } from "./utils";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const sandboxId = (await Sandbox.create("acevibe-nextjs-template")).sandboxId;
  const result = streamText({
    model: openai("gpt-4.1"),
    system: getSystemPrompt(),
    messages: convertToModelMessages(messages),
    tools: {
      createOrUpdateFile: tool({
        name: "createOrUpdateFile",
        description: "Create or update files in the sandbox",
        inputSchema: z.object({
          files: z.array(
            z.object({
              path: z.string(),
              content: z.string(),
            })
          ),
        }),
        execute: async ({ files }) => {
          console.log(files);
          try {
            const sandbox = await getSandBox(sandboxId);
            for (const file of files) {
              await sandbox.files.write(file.path, file.content);
            }
            return `Files created or updated: ${files
              .map((f) => f.path)
              .join(", ")}`;
          } catch (e) {
            return "Error: " + e;
          }
        },
      }),
      readFiles: tool({
        name: "readFiles",
        description: "Read files from the sandbox",
        inputSchema: z.object({
          files: z.array(z.string()),
        }),
        execute: async ({ files }) => {
          const sandbox = await getSandBox(sandboxId);
          const contents = [];
          for (const file of files) {
            const content = await sandbox.files.read(file);
            contents.push({ path: file, content });
          }
          return JSON.stringify(contents);
        },
      }),
      terminal: tool({
        name: "terminal",
        description: "Use the terminal to run commands",
        inputSchema: z.object({
          command: z.string(),
        }),
        execute: async ({ command }) => {
          const buffers = { stdout: "", stderr: "" };

          try {
            const sandbox = await getSandBox(sandboxId);
            const result = await sandbox.commands.run(command, {
              onStdout: (data: string) => {
                buffers.stdout += data;
              },
              onStderr: (data: string) => {
                buffers.stderr += data;
              },
            });
            return result.stdout;
          } catch (e) {
            console.error(
              `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`
            );
            return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
          }
        },
      }),
    },
  });

  const sandbox = await getSandBox(sandboxId);
  const host = sandbox.getHost(3000);
  const sandboxUrl = `https://${host}`;

  console.log(sandboxUrl);

  return result.toUIMessageStreamResponse();
}


