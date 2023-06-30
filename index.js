const cors = require('cors');
const app = require('express')();


const http = require('http').Server(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const port = process.env.PORT || 3000;
app.use(cors());
app.options('*', cors());

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

let gameCodes = []

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {

  socket.on('create game', () => {
    const gameCode = makeid(4);

    gameCodes.push(gameCode);
    socket.join(gameCode);
    io.to(gameCode).emit('new game', gameCode);
  });

  // join game
  socket.on('join game', function (msg) {
    const gameCode = msg.toString().toUpperCase();
    if (gameCodes.includes(gameCode)) {
      socket.join(gameCode);
      io.to(gameCode).emit('chat message', 'A new player has joined');

      socket.on('chat message', (msg) => {
        io.to(gameCode).emit('chat message', msg);
      });

      socket.on('leave room', function () {
        socket.leave(gameCode);
      })

      socket.on('new image', function (msg) {
        io.to(gameCode).emit('image update', msg);
      });
    }
  });

  // start game (in game chat)

  // leave game
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
