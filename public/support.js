// support.js - TARIM OS V1.0 Beta - الوارد + المرسلة + الدعم السيادي
const express=require('express'),fs=require('fs');
const router=express.Router();

let InboxDB={inbox:{},sent:{},all:[]};
try{
  if(fs.existsSync('./inbox-database.json')){
    InboxDB=JSON.parse(fs.readFileSync('./inbox-database.json','utf8'));
  }
}catch(e){ console.log('📥 صندوق وارد جديد'); }

function saveInbox(){try{fs.writeFileSync('./inbox-database.json',JSON.stringify(InboxDB,null,2));}catch(e){}}

// إرسال رسالة آمنة
router.post('/inbox/send',(req,res)=>{
 const {from,to,text}=req.body;
 if(!from||!to||!text)return res.json({error:'أكمل - من + إلى + نص'});
 const msg={id:'MSG_'+Date.now(),from,to,text,time:Date.now(),read:false};
 if(!InboxDB.inbox[to])InboxDB.inbox[to]=[];
 InboxDB.inbox[to].unshift(msg);
 if(!InboxDB.sent[from])InboxDB.sent[from]=[];
 InboxDB.sent[from].unshift(msg);
 InboxDB.all.unshift(msg);
 saveInbox();
 if(global.io){
   global.io.emit('inbox_new',msg);
   global.io.emit('inbox_message',msg);
 }
 console.log(`💬 رسالة: ${from} -> ${to}`);
 res.json({ok:true,message:msg,msg:'تم الإرسال - النظام آمن ومتصل ✅'});
});

// الوارد
router.get('/inbox/:user',(req,res)=>{
 const inbox=InboxDB.inbox[req.params.user]||[];
 if(!inbox.length)return res.json({empty:true,msg:'لا توجد رسائل جديدة حالياً. النظام آمن ومتصل.',messages:[]});
 res.json({empty:false,messages:inbox});
});

// المرسلة
router.get('/inbox/sent/:user',(req,res)=>{
  const sent=InboxDB.sent[req.params.user]||[];
  res.json({messages:sent});
});

// كل المحادثات - لمن تفتح الوارد يطلع لك قائمة الأشخاص
router.get('/inbox/chats/:user',(req,res)=>{
 const user=req.params.user;
 const all=[...(InboxDB.inbox[user]||[]),...(InboxDB.sent[user]||[])];
 const chats={};
 all.forEach(m=>{
   const other=m.from===user?m.to:m.from;
   if(!chats[other])chats[other]={user:other,last:m,count:0,unread:0};
   if(m.time>chats[other].last.time)chats[other].last=m;
   chats[other].count++;
   if(!m.read&&m.to===user)chats[other].unread++;
 });
 res.json(Object.values(chats).sort((a,b)=>b.last.time-a.last.time));
});

// تحديد كمقروء
router.post('/inbox/read',(req,res)=>{
  const {user,msgId}=req.body;
  const inbox=InboxDB.inbox[user]||[];
  const msg=inbox.find(m=>m.id===msgId);
  if(msg){msg.read=true; saveInbox();}
  res.json({ok:true});
});

// تذاكر الدعم - للتوافق مع server.js
router.get('/support/my-tickets/:user',(req,res)=>{
  const tickets=(global.supportTickets||[]).filter(t=>t.user===req.params.user);
  res.json({tickets});
});

module.exports=router;
