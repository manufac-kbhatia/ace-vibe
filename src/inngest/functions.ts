import Sandbox from "@e2b/code-interpreter";
import { inngest } from "./client";
import { getSandBox } from "./utils";
import { openai, createAgent} from "@inngest/agent-kit";

export const invoke = inngest.createFunction(
  { id: "invoke" },
  { event: "test/invoke" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
        const sandbox = await Sandbox.create("acevibe-nextjs-template");
        return sandbox.sandboxId;
    })

    const summarizer = createAgent({
        name: "summarizer",
        system: "You are an expert summarizer. You summarize in 2 words",
        model: openai({model: "gpt-4o"}),
    });

    const {output} = await summarizer.run(`Summarize the following text: ${event.data.value}`);
    console.log(output);


    const sandboxUrl = await step.run("get-sandbox-url", async () => {
        const sandbox = await getSandBox(sandboxId);
        const host =  sandbox.getHost(3000); 
        return `https://${host}`;
    })
 
    return { output, sandboxUrl };
  },
);