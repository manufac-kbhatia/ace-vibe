import z from "zod";
import { baseProcedure } from "../init";
import { inngest } from "@/inngest/client";

export const invokeProcedure = baseProcedure.input(z.object({
    value: z.string(),
})).mutation(async ({input}) => {
    await inngest.send({
        name: "test/invoke",
        data: {
            value: input.value,
        }
    })
})