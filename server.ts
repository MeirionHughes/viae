import { Viae, Status } from './src';
import { Server as WebSocketServer } from 'ws';
import { App } from './src/app';
import { Controller, Get, Data, Param, All, Next, Ctx, Raw, Head, Put } from './src/decorators';
import { Subject, from, isObservable, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

let server = new WebSocketServer({ port: 8080, host: "0.0.0.0" });
let viae = new Viae(server);

let op = 0;

setInterval(() => {
  console.log(`${op} tps`);
  op = 0;
}, 1000);

viae.before((ctx, next) => {
  op += 1;
  return next();
});

@Controller('api')
class ChatRoomController {
  private _generalChannel = new Subject<string>();

  @Get("dummy")
  general(@Data() data: Observable<number>) {
    if (isObservable(data)) {
      return data;
    }
  }
}

viae.before(async (ctx, next) => {
  let start = Date.now();

  await next();

  let duration = Date.now() - start;
  if (ctx && ctx.in && ctx.out) {
    ctx.connection.log.info(`${ctx.in.head.method} ${ctx.in.head.path} - ${ctx.out.head.status} ${duration.toFixed()}ms`);
  }
});


viae.use(new App({
  controllers: [new ChatRoomController()]
}));