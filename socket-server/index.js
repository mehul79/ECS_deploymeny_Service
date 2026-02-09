const { Server } = require("socket.io");
const redis = require("ioredis");

const io = new Server({ cors: "*" });
const subscriber = new redis(process.env.REDIS);

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});

io.listen(8080, () => {
  console.log("Socket server is listening on port 8080");
});

async function initRedisSubscribe() {
  console.log("Subscribed to logs....");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("message", {log: message});
  });
}

initRedisSubscribe();
