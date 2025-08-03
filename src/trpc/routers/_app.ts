import { createTRPCRouter } from '../init';
import * as procedures from './procedures';
export const appRouter = createTRPCRouter({
  invoke: procedures.invokeProcedure,
});
// export type definition of API
export type AppRouter = typeof appRouter;