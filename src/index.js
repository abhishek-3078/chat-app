const path=require('path')
const http=require('http')
const express=require('express')
const socketio=require('socket.io')
const Filter=require('bad-words')
const app=express()
const server=http.createServer(app)
const {generateMessage, generateLocationMessage,generateImageMessage}=require('./utils/messages')
const io=socketio(server)
const port=process.env.PORT||3000
const publicDirectoryPath=path.join(__dirname,'../public')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')
app.use(express.static(publicDirectoryPath))

//server(emit)-->client(receive)-->countUpdated
//client(emit)-->server(receive)-->increment
let count=0
io.on('connection',(socket)=>{
    console.log('new webSocket connection')

     //broadcast for emit except that one
    socket.on('join',({username,room},callback)=>{
        const {error,user}=addUser({id:socket.id,username,room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined`)) 
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })
    //socket.emit io.emit socket.broadcast.emit
    //io.to.emit, socket.broadcast.to.emit
    socket.on('sendMessage',(message,callback)=>{
        const user=getUser(socket.id)
        const filter=new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessage(user.username,message))  
        callback('Delivered')
      })
    //   socket.on("sendImage",data=>{
    //     const user=getUser(socket.id)
    //     console.log(user.username)
    //     io.to(user.room).emit("postImage",generateImageMessage(user.username,data))
    //   }) 
      socket.on("send-chunk",data=>{
        
        const user=getUser(socket.id)  
        io.to(user.room).emit("postChunk",data)
      })
      socket.on("chunk-end",(type)=>{
        
        const user=getUser(socket.id) 
        const time=new Date().getTime()
        io.to(user.room).emit("completedUpload",user.username,time,type)
      })
      socket.on("send-audio-chunk",(data)=>{
       
        const user=getUser(socket.id)  
        io.to(user.room).emit("postAudioChunk",data)
        
      })
      socket.on("audio-chunk-end",(type,callback)=>{
        const user=getUser(socket.id) 
        const time=new Date().getTime()
        io.to(user.room).emit("completedAudioUpload",user.username,time,type)
        
      })
    socket.on('sendLocation',(coords,callback)=>{ 
        const user=getUser(socket.id)
        console.log("sending location")
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://www.google.com/maps/?q=${coords.latitude},${coords.longitude}`))
        callback() 
    }) 

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        } 
    })  
})
server.listen(port,()=>{
    console.log(`Server is live on port ${port}!`)
})
