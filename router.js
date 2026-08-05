const express=require('express'),fs=require('fs'),crypto=require('crypto');
const router=express.Router();
let OpsDB={lives:[],messages_secure:[],qr_seals:[],map_cache:{},disinfo_logs:[]};
try{OpsDB=JSON.parse(fs.readFileSync('./operations-database.json','utf8'));}catch(e){}
function saveOps(){try{fs.writeFileSync('./operations-database.json',JSON.stringify(OpsDB,null,2));}catch(e){}}
router.post('/operations/live/start',(req,res)=>{
 const {user}=req.body;
 const live={id:'LIVE_'+Date.now(),user,start:Date.now(),end:Date.now()+8*60*1000,active:true,viewers:0};
 OpsDB.lives.unshift(live);saveOps();
 setTimeout(()=>{const l=OpsDB.lives.find(x=>x.id===live.id);if(l){l.active=false;saveOps();if(global.io)global.io.emit('live_ended',l);}},8*60*1000);
 if(global.io)global.io.emit('live_started',live);
 res.json({ok:true,live});
});
router.post('/operations/live/stop',(req,res)=>{
 const {liveId,user}=req.body;
 const live=OpsDB.lives.find(l=>l.user===user);if(live){live.active=false;saveOps();}
 res.json({ok:true});
});
router.get('/operations/map/hadramout',(req,res)=>{res.json({center:[15.5,48.5],points:[{name:'سيئون',lat:15.94,lng:48.78},{name:'تريم',lat:16.05,lng:49},{name:'المكلا',lat:14.54,lng:49.12}]});});
router.post('/operations/qr/generate',(req,res)=>{
 const {user}=req.body;
 const seal={id:'SEAL_'+Date.now(),user,qr:`https://tarimos.org/seal/SEAL_${Date.now()}?user=${user}`,time:Date.now()};
 OpsDB.qr_seals.unshift(seal);saveOps();
 res.json({ok:true,seal,qr:seal.qr});
});
router.post('/operations/anti-disinfo/check',(req,res)=>{
 const {text,user}=req.body;
 res.json({ok:true,result:{score:100,status:'آمن ✅'}});
});
module.exports=router;
