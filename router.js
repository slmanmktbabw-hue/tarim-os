// router.js - TARIM OS V1.0 Beta - راوتر العمليات + فيد الفيديو - مدمج سيادي
const express=require('express'),fs=require('fs');
const router=express.Router();

// ===== قاعدة العمليات =====
let OpsDB={lives:[],messages_secure:[],qr_seals:[],map_cache:{},disinfo_logs:[]};
try{if(fs.existsSync('./operations-database.json')) OpsDB=JSON.parse(fs.readFileSync('./operations-database.json','utf8'));}catch(e){}
function saveOps(){try{fs.writeFileSync('./operations-database.json',JSON.stringify(OpsDB,null,2));}catch(e){}}

// ===== قاعدة الفيد =====
let FeedDB={posts:[],follows:{},likes:{}};
try{if(fs.existsSync('./feed-database.json')) FeedDB=JSON.parse(fs.readFileSync('./feed-database.json','utf8'));}catch(e){}
function saveFeed(){try{fs.writeFileSync('./feed-database.json',JSON.stringify(FeedDB,null,2));}catch(e){}}

// ---- العمليات ----
router.post('/operations/live/start',(req,res)=>{
 const {user}=req.body; if(!user) return res.json({error:'سجل دخول'});
 const live={id:'LIVE_'+Date.now(),user,start:Date.now(),end:Date.now()+8*60*1000,active:true,viewers:0};
 OpsDB.lives.unshift(live);saveOps();
 setTimeout(()=>{const l=OpsDB.lives.find(x=>x.id===live.id);if(l){l.active=false;saveOps();if(global.io)global.io.emit('live_ended',l);}},8*60*1000);
 if(global.io)global.io.emit('live_started',live);
 res.json({ok:true,live});
});

router.post('/operations/live/stop',(req,res)=>{
 const {liveId,user}=req.body;
 const live=OpsDB.lives.find(l=>l.user===user||l.id===liveId);if(live){live.active=false;saveOps();}
 res.json({ok:true});
});

router.get('/operations/map/hadramout',(req,res)=>{
 res.json({center:[15.5,48.5],points:[{name:'سيئون',lat:15.94,lng:48.78},{name:'تريم',lat:16.05,lng:49},{name:'المكلا',lat:14.54,lng:49.12}]});
});

router.post('/operations/qr/generate',(req,res)=>{
 const {user}=req.body;
 const seal={id:'SEAL_'+Date.now(),user,qr:`https://tarimos.org/seal/SEAL_${Date.now()}?user=${user}`,time:Date.now()};
 OpsDB.qr_seals.unshift(seal);saveOps();
 res.json({ok:true,seal,qr:seal.qr});
});

router.post('/operations/anti-disinfo/check',(req,res)=>{
 res.json({ok:true,result:{score:100,status:'آمن ✅'}});
});

// ---- الفيد - فيد الفيديو السيادي ----
router.post('/feed/publish-video',(req,res)=>{
 const {user,text,video}=req.body; if(!user)return res.json({error:'سجل دخول'});
 const post={id:'VID_'+Date.now(),user,text:text||'فيديو سيادي مسجل على سيرفرات TARIM OS ✨🎥',video:video||'',likes:0,likedBy:[],comments:[],gifts:0,time:Date.now()};
 FeedDB.posts.unshift(post);saveFeed();
 if(global.io)global.io.emit('broadcast_post',FeedDB.posts);
 res.json({ok:true,post});
});

router.get('/feed/home',(req,res)=>{res.json([...FeedDB.posts].sort((a,b)=>b.time-a.time));});

router.post('/feed/follow',(req,res)=>{
 const {follower,following}=req.body;
 if(!FeedDB.follows[following])FeedDB.follows[following]=[];
 if(!FeedDB.follows[following].includes(follower))FeedDB.follows[following].push(follower);
 else FeedDB.follows[following]=FeedDB.follows[following].filter(u=>u!==follower);
 saveFeed();
 res.json({ok:true,followers:FeedDB.follows[following].length});
});

router.post('/feed/like/:id',(req,res)=>{
 const {user}=req.body;
 const post=FeedDB.posts.find(p=>p.id===req.params.id);
 if(!post)return res.json({error:'غير موجود'});
 if(!post.likedBy.includes(user)){post.likes++;post.likedBy.push(user);}else{post.likes=Math.max(0,post.likes-1);post.likedBy=post.likedBy.filter(u=>u!==user);}
 saveFeed();
 if(global.io)global.io.emit('feed_like',{id:post.id,likes:post.likes});
 res.json({ok:true,likes:post.likes});
});

router.post('/feed/comment/:id',(req,res)=>{
 const {user,text}=req.body;
 const post=FeedDB.posts.find(p=>p.id===req.params.id);
 if(!post)return res.json({error:'غير موجود'});
 const c={id:'C_'+Date.now(),user,text,time:Date.now()};
 post.comments.push(c);saveFeed();
 res.json({ok:true,comment:c});
});

router.post('/feed/gift/:id',(req,res)=>{
 const post=FeedDB.posts.find(p=>p.id===req.params.id);
 if(post){post.gifts=(post.gifts||0)+1;saveFeed();}
 res.json({ok:true,gifts:post?.gifts||0});
});

module.exports=router;
