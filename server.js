const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const path=require('path');
const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*"}});
app.use(express.json({limit:'100mb'}));
app.use(express.static(path.join(__dirname,'public')));
global.io=io;

app.use('/api',require('./security.js'));
app.use('/api',require('./database.js'));
app.use('/api',require('./router.js'));
app.use('/api',require('./support.js'));
app.use('/api',require('./settings.js'));

io.on('connection',s=>{console.log('متصل',s.id);});

app.get('/api/ping',(req,res)=>res.json({ok:true,msg:'TARIM OS V1.0 - 6 FILES LIVE',king:'AL'}));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

const PORT=process.env.PORT||10000;
server.listen(PORT,'0.0.0.0',()=>console.log(`🏰 TARIM OS LIVE ${PORT} - 6 FILES`));
