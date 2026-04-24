import { Hono } from "hono";

declare global {
  interface Env {
    [key: string]: any;
  }
}

const app = new Hono<{ Bindings: Env }>();

export default app;

