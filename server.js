const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')


const app = express();
const server = http.createServer(app);
const io = socketIO(server)


//set static folder
app.use(express.static(path.join(__dirname, 'public')));

//run when client connects
io.on('connection', (socket) => {

    socket.on('joinRoom', ({username, room}) => {
        console.log(socket.id, username, room)
        const user = userJoin(socket.id, username,room)
        socket.join(user.room)

        console.log('New user connected');
        socket.emit("message", formatMessage('Admin', 'Welcome to the chat app'));

        //broadcast when a user connects
        socket.broadcast
            .to(user.room)
            .emit(
                "message", formatMessage('Admin', `${user.username} has joined`)
                );

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
        })

    

    

    //listen for chat message
    socket.on('chatMessage', (data) => {
        console.log(data);
        const user = getCurrentUser(socket.id);

        //send message to all clients
        io.to(user.room).emit('message', formatMessage(user.username, data));
    })

    //run when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        console.log('User disconnected');
        if(user){
            socket.broadcast.to(user.room).emit(
                "message", formatMessage('Admin', `${user.username} has left`));
            //send users and room info
           io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
        }

           
        
    });

  
})

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
})