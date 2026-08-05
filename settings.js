// settings.js - TARIM OS V1.0 Beta - إعدادات + محفظة + QR + خلفية
const express=require('express'),fs=require('fs');
const router=express.Router();

let SettingsDB={users_settings:{},wallets:{},backgrounds:{},qr_codes:{},privacy:{}};
try{
  if(fs.existsSync('./settings-database.json')){
    SettingsDB=JSON.parse(fs.readFileSync('./settings-database.json','utf8'));
  }
}catch(e){ console.log('⚙️ إعدادات جديدة'); }

function saveSettings(){try{fs.writeFileSync('./settings-database.json',JSON.stringify(SettingsDB,null,2));}catch(e){}}

// QR
router.post('/settings/qr',(req,res)=>{
  const {user}=req.body; if(!user) return res.json({error:'سجل دخول'});
  const qr={id:'QR_'+Date.now(),user,text:`https://tarimos.org/user/${user}`,created:Date.now()};
  SettingsDB.qr_codes[user]=qr;saveSettings();
  res.json({ok:true,qr,text:qr.text});
});

// محفظة
router.get('/settings/commercial/:user',(req,res)=>{
  if(!SettingsDB.wallets[req.params.user]){
    SettingsDB.wallets[req.params.user]={balance:0,earnings:0,okx:'0x53...c0af6'};
    saveSettings();
  }
  res.json({wallet:SettingsDB.wallets[req.params.user]});
});

router.post('/settings/promote',(req,res)=>res.json({ok:true,msg:'تمت الترقية سيادي ✅'}));

// منشوراتي
router.get('/settings/posts/:user',(req,res)=>{
  try{
    if(!fs.existsSync('./feed-database.json')) return res.json({posts:[]});
    const feed=JSON.parse(fs.readFileSync('./feed-database.json','utf8'));
    res.json({posts:(feed.posts||[]).filter(p=>p.user===req.params.user)});
  }catch(e){res.json({posts:[]});}
});

// حساب
router.get('/settings/account/:user',(req,res)=>{
  res.json({settings:SettingsDB.users_settings[req.params.user]||{name:req.params.user,bio:'إمبراطور حضرمي 👑'}});
});

router.post('/settings/account/update',(req,res)=>{
  const {user,name,bio}=req.body;
  if(!user) return res.json({error:'سجل دخول'});
  if(!SettingsDB.users_settings[user]) SettingsDB.users_settings[user]={};
  if(name) SettingsDB.users_settings[user].name=name;
  if(bio) SettingsDB.users_settings[user].bio=bio;
  SettingsDB.users_settings[user].updated=Date.now();
  saveSettings();
  res.json({ok:true,settings:SettingsDB.users_settings[user]});
});

// خلفية
router.post('/settings/background',(req,res)=>{
  const {user,bgUrl}=req.body; if(!user) return res.json({error:'سجل دخول'});
  SettingsDB.backgrounds[user]={url:bgUrl,time:Date.now()};
  saveSettings();
  if(global.io)global.io.emit('bg_changed',{user,bg:SettingsDB.backgrounds[user]});
  res.json({ok:true,bg:SettingsDB.backgrounds[user]});
});

router.get('/settings/background/:user',(req,res)=>{
  res.json(SettingsDB.backgrounds[req.params.user]||{url:''});
});

// مشاركة
router.post('/settings/share-profile',(req,res)=>{
  const {user}=req.body;
  res.json({ok:true,link:`https://tarimos.org/user/${user}`});
});

router.post('/settings/logout',(req,res)=>res.json({ok:true,msg:'تم الخروج سيادي'}));

router.get('/settings/stats/:user',(req,res)=>{
  try{
    if(!fs.existsSync('./feed-database.json')) return res.json({likes:0,followers:0,posts:0});
    const feed=JSON.parse(fs.readFileSync('./feed-database.json','utf8'));
    const my=(feed.posts||[]).filter(p=>p.user===req.params.user);
    const followsFile=fs.existsSync('./feed-database.json')?JSON.parse(fs.readFileSync('./feed-database.json','utf8')).follows||{}:{};
    const followers=Object.values(followsFile).flat().filter(f=>my.some(m=>m.user===req.params.user)).length;
    res.json({likes:my.reduce((s,p)=>s+(p.likes||0),0),followers:followers,posts:my.length});
  }catch(e){res.json({likes:0,followers:0,posts:0});}
});

module.exports=router;
