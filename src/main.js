const Express = require("express");
const ws = require("ws");
const crypto = require("node:crypto");

const webServer = new Express();
const app = webServer.listen(process.env.PORT ?? 1000);
const wsServer = new ws.Server({noServer: true});

webServer.get("/", (req, res)=>{
    res.sendFile("index.html", {root: "."});
});

app.on("upgrade", (req, socket, head) => {
    wsServer.handleUpgrade(req, socket, head, (ws) => {
        wsServer.emit("connection", ws, req);
    });
});

const activeConnections = new Map();

wsServer.on("connection", (ws, req)=>{
    ws.on("error", console.error);

    ws.on("message", (event) => {
        if(!ws.customID) return;
        try {
            event = JSON.parse(event.toString());
        } catch(e){
            return;
        }

        const con = activeConnections.get(ws.customID);
        if(!con){
            console.log(`${ws.customID} closing connection.`);
            return ws.close();
        }

        console.log(JSON.stringify(event));

        if(event.opCode === "MARCO"){
            console.log(`> { opCode: "MARCO", data: { message: "POLO" } }`);
            ws.send(JSON.stringify({
                opCode: "MARCO",
                data: {
                    message: "POLO"
                }
            }));
        }
    });

    ws.customID = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (parseInt(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> parseInt(c) / 4).toString(16));

    console.log(`New connection: ${ws.customID}`);
    console.log(`> {opCode: "ACK", data: { id: ${ws.customID} }}`);
    ws.send(JSON.stringify({
        opCode: "ACK",
        data: {
            id: ws.customID
        }
    }));
});