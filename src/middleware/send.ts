import { Middleware } from "rowan";
import { Context } from "../context";
import { MessageSerialiser } from "../message-encoder";

/**
 * Sends the outgoing message and terminates
 */
export default class Send<Ctx extends Context = Context> implements Middleware<Context> {
  constructor(private _encoder: MessageSerialiser) { }
  process(ctx: Context, next: (ctx?: Context) => Promise<void>): Promise<void> {
    let out = ctx.out;
    if (out) {
      let raw = this._encoder.encode(out);
      ctx.connection.wire.send(raw.buffer as ArrayBuffer);
    }
    return Promise.resolve();
  }
}