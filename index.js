const cors = require('cors');
const { randomUUID } = require('crypto');
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

  socket.on('create game', (msg) => {

    const gameCode = makeid(4);

    const gameData = {
      users: [
        {
          name: msg,
          id: randomUUID(),
        }
      ],
      gameCode,
    };

    gameCodes.push(gameData);
    socket.join(gameData.gameCode);
    io.to(gameData.gameCode).emit('new game state', gameData);

    socket.on('chat message', (msg) => {
      io.to(gameCode).emit('chat message', msg);
    });

    socket.on('new image', (msg) => {
      // update game state with canvas
      gameCodes = gameCodes.map((data) => {
        if (data.gameCode === gameCode) {
          data.users = data.users.map((user) => {
            if (user.id === msg.id) {
              user.canvas = msg.canvas;
            }
            return user;
          }
          );
        }
        return data;
      });

      io.to(gameCode).emit('image update', msg);
    });
  });

  // join game
  socket.on('join game', function (msg) {
    const gameCode = msg.gameCode.toString().toUpperCase();
    if (gameCodes.map(data => data.gameCode).includes(gameCode)) {
      console.log(gameCode);
      socket.join(gameCode);

      gameCodes = gameCodes.map((data) => {
        if (data.gameCode === gameCode) {
          data.users.push({
            name: msg.name,
            id: randomUUID(),
          });
        }
        return data;
      });

      io.to(gameCode).emit('new game state', gameCodes.find(data => data.gameCode === gameCode));

      socket.on('chat message', (msg) => {
        io.to(gameCode).emit('chat message', msg);
      });

      socket.on('leave room', (msg) => {
        socket.leave(gameCode);

        gameCodes = gameCodes.map((data) => {
          if (data.gameCode === gameCode) {
            data.users = data.users.filter(user => user.id !== msg.id);
          }
          return data;
        });
  
        io.to(gameCode).emit('new game state', gameCodes.find(data => data.gameCode === gameCode));
      });

      socket.on('new image', (msg) => {

        // update game state with canvas
        gameCodes = gameCodes.map((data) => {
          if (data.gameCode === gameCode) {
            data.users.map((user) => {
              if (user.id === msg.id) {
                user.canvas = msg.canvas;
              }
              return user;
            }
            );
          }
          return data;
        });

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
