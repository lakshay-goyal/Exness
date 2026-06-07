import { BackendApplication } from "./app/backend-application.js";

const server = await new BackendApplication().configure();
server.start();
