import { Middleware } from "rowan";
import { Context } from "../context";
import { enframeMessage } from '../message';

/**
 * Sends the outgoing message and terminates
 */
export default class Send<Ctx extends Context = Context> implements Middleware<Context> {
  process(ctx: Context, next: (ctx?: Context) => Promise<void>): Promise<void> {
    let out = ctx.out;
    if (out) {
      console.log("SENDING: ", out);
      let raw = enframeMessage(out);
      ctx.connection.wire.send(raw);
    }   
    return Promise.resolve();
  }
}