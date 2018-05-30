import { Rowan, Middleware, IRowan, After, If, Catch, Processor, HasError } from "rowan";
import { EventEmitter } from "events";

import { Wire } from "./wire";

import { Message, Response, Request, deframeMessage, isRequest } from './message';
import { Context, ContextConstructor, DefaultContext, ErredContext, } from "./context";
import BodyDecoder from "./middleware/body-decoder";
import BodyEncoder from "./middleware/body-encoder";
import Interceptor from "./middleware/interceptor";
import Send from "./middleware/send";
import { bytesToHex } from "./util";
import { v4 as uuid } from 'uuid';
import { UpgradeOutgoingIterable, UpgradeIncomingIterable } from "./middleware/iterable";

/**
 * Via
 * Wraps a wire connection and processes inbound and outbound messages
 */
export default class Via<Ctx extends Context = Context> extends Rowan<Ctx> {
  private _ev = new EventEmitter();
  private _interceptor = new Interceptor();
  private Ctx: ContextConstructor;

  /* outgoing message pipeline */
  readonly out: Rowan<Context> = new Rowan<Context>();


  constructor(public readonly wire: Wire, opts?: { Ctx?: ContextConstructor, uuid?: () => string }) {
    super();

    this.Ctx = (opts ? opts.Ctx : undefined) || DefaultContext;

    this
      .use((ctx, next) => {
        if (ctx.in.head.status) {
          console.log(`${ctx.in.id} ${ctx.in.head.status}`);
        } else {
          console.log(`${ctx.in.id} ${ctx.in.head.method} ${ctx.in.head.path}`);
        }
        return next();
      })
      .use(new After([
        this.out
          .use(new After([
            new If((ctx) => ctx.out != undefined, [
              new UpgradeOutgoingIterable(),
              new BodyEncoder(),
              new Send()])]))]))
      .use(new Catch(async (ctx: Ctx & HasError) => { this._ev.emit("error", ctx); }))
      .use(new BodyDecoder())
      .use(new UpgradeIncomingIterable())
      .use(this._interceptor = new Interceptor());

    /** Hook onto the wire events*/
    wire.on("message", (data: ArrayBuffer) => {
      const msg = deframeMessage(data);
      const ctx = new this.Ctx({ connection: this, in: msg });

      this.process(ctx as Ctx).catch(e => this._ev.emit("error", e));
    });
    wire.on("open", () => {
      this._ev.emit("open");
    });
    wire.on("close", () => {
      this._interceptor.dispose();
      this._ev.emit("close");
    });
    wire.on("error", (err) => {
      this._ev.emit("error");
    });
  }

  /**
   * Add a message to the outgoing pipe
   **/
  async send(msg: Partial<Message<any>>, opts?: ViaSendOptions) {
    if (!msg.id) msg.id = uuid();
    if (opts && opts.encoding) {
      msg.head = msg.head || {};
      msg.head.encoding = opts.encoding;
    }
    await this.out.process(new this.Ctx({ connection: this, out: msg as Message<any> }));
  }

  /**
   * Send a request message and await for the response 
   * @param msg 
   * @param opts 
   */
  async request(msg: Partial<Message<any>>, opts?: ViaSendOptions) {
    if (!msg.id) msg.id = uuid();

    if (!isRequest(msg)) {
      throw Error("Message is not a Request");
    }

    let reject, resolve, promise = new Promise<Message>((r, x) => { resolve = r; reject = x; });
    let clock;

    let dispose = this._interceptor.intercept({
      id: msg.id,
      handlers: [async (ctx, next) => {
        resolve(ctx.in);
      }]
    });

    clock = setTimeout(() => { reject("Request Timeout"); }, (opts ? opts.timeout : undefined) || 10000);

    try {
      await this.send(msg, opts);
      return await promise;
    }
    catch (err) {
      throw err;
    }
    finally {
      clearTimeout(clock);
      dispose();
    }
  }

  /**
   * intercept an id-specific message 
   * @param id 
   * @param handlers 
   */
  intercept(id: string, handlers: Processor<Ctx>[]) {
    return this._interceptor.intercept({ id: id, handlers: handlers });
  }

  on(event: "close", cb: () => void)
  on(event: "open", cb: () => void)
  on(event: "error", cb: (ctx: Ctx & HasError) => void)
  on(event: string, cb: (...args: any[]) => void) {
    this._ev.on(event, cb);
  }
}

export type ViaSendOptions = {
  encoding?: "none" | "msgpack" | "json",
  timeout?: number
};