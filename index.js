const http = require('http')
const fs = require('fs')
const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const port = 3001;


const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server);

const db = new sqlite3.Database('database.db');



app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'lobby.html'));
  });

app.get('/code/:codeBlock', (req, res) => {
res.sendFile(path.join(__dirname, 'public', 'codePage.html'));
});


// Store the order of user connections
let userConnections = [];
let userRole = '';
const map = new Map();
// Handle socket connections
io.on('connection', (socket) => {
    // Assign role based on the order of connection
    if (!map.has(socket.id)){
        if (!userConnections.includes('mentor')){
          userRole = 'mentor';  
        }
        else{
          userRole = 'student';
        }
        map.set(socket.id, userRole);
        console.log("map ", map);
    }
    else{
        userRole = map.get(socket.id);
    }
    
    userConnections.push(userRole);
    
  
    // Emit the user role to the client
    socket.emit('userRole', userRole);

    socket.on('disconnect', () => {
      console.log('exit', map.get(socket.id));
      userConnections = userConnections.filter(role => role !== map.get(socket.id));
      console.log(userConnections)
    });
  
    socket.on('join', (room) => {
        socket.join(room);
      });
  
    socket.on('codeChange', (data) => {
      io.to(data.room).emit('updateCode', data.code);
    });

    socket.on('codeSubmitted', (room) => {
        // Broadcast the codeSubmitted event to all clients in the room
        io.to(room).emit('codeSubmitted');
      });

    socket.on('mentorResponse', (data) => {
    // Broadcast the codeSubmitted event to all clients in the room
    if (data.approve){
        io.to(data.room).emit('approveCode');
    }
    else{
        io.to(data.room).emit('denyCode');
    }
    });
  });


// Example endpoint to retrieve code blocks from the database
app.get('/api/code-blocks', (req, res) => {
    db.all('SELECT * FROM code_blocks', (err, rows) => {
      if (err) {
        console.error('Error retrieving code blocks:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json(rows);
      }
    });
  });
  
  // Example endpoint to add a new code block to the database
  app.post('/api/code-blocks', (req, res) => {
    const { title, code } = req.body;
  
    if (!code) {
      return res.status(400).json({ error: 'Title and code are required' });
    }
  
    db.run('INSERT INTO code_blocks (title, code) VALUES (?, ?)', [title, code], (err) => {
      if (err) {
        console.error('Error adding code block:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json({ success: true, message: 'Code block added successfully' });
      }
    });
  });


  app.get('/api/code-blocks/:title', (req, res) => {
    const title = req.params.title;
  
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
  
    db.get('SELECT * FROM code_blocks WHERE title = ?', [title], (err, row) => {
      if (err) {
        console.error('Error retrieving code block:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        if (row) {
          res.json(row);
        } else {
          res.status(404).json({ error: 'Code block not found' });
        }
      }
    });    
  });


  


  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });