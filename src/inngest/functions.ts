import Sandbox from "@e2b/code-interpreter";
import { inngest } from "./client";
import { getSandBox } from "./utils";
import { generateText, streamText, tool } from "ai";
import { getSystemPrompt } from "@/lib/prompt";
import { z } from "zod";
import { openai } from '@ai-sdk/openai';

export const invoke = inngest.createFunction(
  { id: "invoke" },
  { event: "test/invoke" },
  async () => {
    // const sandboxId = await step.run("get-sandbox-id", async () => {
    //   const sandbox = await Sandbox.create("acevibe-nextjs-template");
    //   return sandbox.sandboxId;
    // });
    console.log("hitted");
    const sandboxId = (await Sandbox.create("acevibe-nextjs-template"))
      .sandboxId;

    const result = await generateText({
      model: openai("gpt-4.1"),
      system: getSystemPrompt(),
      prompt: "Create me landing page in nextjs for a calculator app",
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

    // example: use textStream as an async iterable
    console.log(result);

    const sandbox = await getSandBox(sandboxId);
    const host = sandbox.getHost(3000);
    const sandboxUrl = `https://${host}`;

    return { sandboxUrl };
  }
);
