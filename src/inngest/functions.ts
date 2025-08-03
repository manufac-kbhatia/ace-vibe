import { inngest } from "./client";

export const invoke = inngest.createFunction(
  { id: "invoke" },
  { event: "test/invoke" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `${event.data.value}!` };
  },
);