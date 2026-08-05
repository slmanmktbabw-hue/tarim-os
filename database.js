const express=require('express'),fs=require('fs'),crypto=require('crypto');
const router=express.Router();
let FeedDB={posts:[],follows:{},likes:{}};
try{FeedDB=JSON.parse(fs.readFileSync('./feed-database.json','utf8'));}catch(e){}
function saveFeed(){try{fs.writeFileSync('./feed-database.json',JSON.stringify(FeedDB,null,2));}catch(e){}}
router.post('/feed/publish-video',(req,res)=>{
 const {user,text,video}=req.body;
 if(!user)return res.json({error:'سجل دخول'});
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
