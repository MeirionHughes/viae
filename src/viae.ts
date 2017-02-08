import { Wire, WireServer } from './wire';
import { Via, ViaHandler } from './via';
import { PathRequest, requestPath, requestMethod } from './middleware';
import { Method } from './method';

export class Viae extends Via {
  private _connections = new Array<Wire>();
  get connections() { return this._connections; };

  constructor(protected server: WireServer) {
    super();

    server.on("connection", (wire) => {
      this._connections.push(wire);
      wire.on("close", () => {
        this._connections.splice(this._connections.indexOf(wire), 1);
        //this.clean(wire);
      });
      wire.on("message", (data) => {
        this.processMessage(data, wire);
      });
    });
  }

  broadcast(message) {
    this.send(message, ...this._connections);
  }

  get(path: PathRequest, handler: ViaHandler, ...handlers: ViaHandler[]) {
    return this.method(Method.GET, path, handler, ...handlers);
  }

  put(path: PathRequest, handler: ViaHandler, ...handlers: ViaHandler[]) {
    return this.method(Method.PUT, path, handler, ...handlers);
  }

  post(path: PathRequest, handler: ViaHandler, ...handlers: ViaHandler[]) {
    return this.method(Method.POST, path, handler, ...handlers);
  }

  patch(path: PathRequest, handler: ViaHandler, ...handlers: ViaHandler[]) {
    return this.method(Method.PATCH, path, handler, ...handlers);
  }

  delete(path: PathRequest, handler: ViaHandler, ...handlers: ViaHandler[]) {
    return this.method(Method.DELETE, path, handler, ...handlers);
  }

  subscribe(path: PathRequest, handler: ViaHandler, ...handlers: ViaHandler[]) {
    return this.method(Method.SUBSCRIBE, path, handler, ...handlers);
  }

  unsubscribe(path: PathRequest, handler: ViaHandler, ...handlers: ViaHandler[]) {
    return this.method(Method.UNSUBSCRIBE, path, handler, ...handlers);
  }

  method(method: Method, path: PathRequest, handler: ViaHandler, ...handlers: ViaHandler[]) {
    return this.use(requestMethod(method), requestPath(path), handler, ...handlers);
  }

  path(path: PathRequest, handler: ViaHandler, ...handlers: ViaHandler[]) {
    return this.use(requestPath(path), handler, ...handlers);
  }  
}