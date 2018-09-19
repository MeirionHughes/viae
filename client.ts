import Via from './src/via';
import * as WebSocket from 'ws';
import { Wire } from './src';

let wire = new WebSocket("ws://localhost:8080");
let via = new Via(wire as any);

via.on("open", async () => {
  console.log("opened");

  try {
    let response = await via.request({
      head: {
        method: "GET",
        path: "/echo"
      }      
    });

    console.log(response);

    if (response.data[Symbol.asyncIterator]) {
      for await (let item of response.data) {
        console.log(item);
      }
    }
  } catch (err) {
    console.log(err);
  }

  /* closing wire */
  wire.close();
});

via.on("error", (err) => {
  console.log(err);
});