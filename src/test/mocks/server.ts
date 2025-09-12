import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Setup MSW server for Node.js (testing)
export const server = setupServer(...handlers);
