import { IRowan, Middleware, Handler, AutoHandler, Rowan } from "rowan";
import { Via } from "./via";
import { Message, MessageHeader, Request, Response } from "./message";
import { Status } from "./status";
import Interceptor from "./middleware/interceptor";
import { Logger } from "./log";

export interface Context {
  id: string;
  connection: Via<Context>;

  in?: Message<any>;
  out?: Message<any>;

  req?: Request<any>;
  res?: Response<any>;

  /*checks to see if inbound message is a request */
  isReq(outbound?: boolean): this is RequestContext;

  /*checks to see if inbound message is a response */
  isRes(outbound?: boolean): this is ResponseContext;

  [key: string]: any;
}

export interface ContextConstructor<Ctx extends Context = Context> {
  new(init: { connection: Via<Ctx>; in: Message<any>, log: Logger }): Ctx;
  new(init: { connection: Via<Ctx>; out: Message<any>, log: Logger }): Ctx;
}

export class DefaultContext implements Context {
  id: string;
  connection: Via<Context>;

  in?: Message<any>;
  out?: Message<any>;

  constructor(init: { connection: Via<Context>; in?: Message<any>, out?: Message<any> }) {
    this.connection = init.connection;

    this.out = init.out;
    this.in = init.in;

    if (this.isReq()) {
      this.out = this.defaultResponse(this.in);
    }
  }

  isReq(inbound = true): this is RequestContext {
    return (inbound) ?
      this.in !== undefined && this.in.head.status === undefined :
      this.out !== undefined && this.out.head.status === undefined;
  }

  isRes(inbound = true): this is ResponseContext {
    return (inbound) ?
      this.in !== undefined && this.in.head.status !== undefined :
      this.out !== undefined && this.out.head.status !== undefined;
  }

  private defaultResponse(req: Message<any>): Response {
    if (req) {
      return {
        id: req.id,
        head: { status: 401 }
      };
    }
  }

  send(msg: Message) {
    msg.id = typeof msg.id === "string" ? msg.id : this.in.id;
    this.out = msg;
  }
}

export interface RequestContext extends ResponseContext {
  req: Request;
}

export interface ResponseContext extends Context {
  res: Response;
}