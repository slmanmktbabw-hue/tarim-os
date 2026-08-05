const express=require('express'),fs=require('fs'),crypto=require('crypto');
const router=express.Router();
let InboxDB={inbox:{},sent:{},all:[]};
try{InboxDB=JSON.parse(fs.readFileSync('./inbox-database.json','utf8'));}catch(e){}
function saveInbox(){try{fs.writeFileSync('./inbox-database.json',JSON.stringify(InboxDB,null,2));}catch(e){}}
router.post('/inbox/send',(req,res)=>{
 const {from,to,text}=req.body;
 if(!from||!to||!text)return res.json({error:'اكمل'});
 const msg={id:'MSG_'+Date.now(),from,to,text,time:Date.now(),read:false};
 if(!InboxDB.inbox[to])InboxDB.inbox[to]=[];InboxDB.inbox[to].unshift(msg);
 if(!InboxDB.sent[from])InboxDB.sent[from]=[];InboxDB.sent[from].unshift(msg);
 InboxDB.all.unshift(msg);saveInbox();
 if(global.io)global.io.emit('inbox_new',msg);
 res.json({ok:true,message:msg,msg:'النظام آمن ومتصل ✅'});
});
router.get('/inbox/:user',(req,res)=>{
 const inbox=InboxDB.inbox[req.params.user]||[];
 if(!inbox.length)return res.json({empty:true,msg:'لا توجد رسائل جديدة حالياً. النظام آمن ومتصل.',messages:[]});
 res.json({empty:false,messages:inbox});
});
router.get('/inbox/chats/:user',(req,res)=>{
 const user=req.params.user;
 const all=[...(InboxDB.inbox[user]||[]),...(InboxDB.sent[user]||[])];
 const chats={};
 all.forEach(m=>{const other=m.from===user?m.to:m.from;if(!chats[other])chats[other]={user:other,last:m,count:0,unread:0};if(m.time>chats[other].last.time)chats[other].last=m;chats[other].count++;if(!m.read&&m.to===user)chats[other].unread++;});
 res.json(Object.values(chats));
});
module.exports=router;
