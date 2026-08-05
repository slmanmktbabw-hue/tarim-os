const express=require('express'),fs=require('fs');
const router=express.Router();
let SettingsDB={users_settings:{},wallets:{},backgrounds:{},qr_codes:{},privacy:{}};
try{SettingsDB=JSON.parse(fs.readFileSync('./settings-database.json','utf8'));}catch(e){}
function saveSettings(){try{fs.writeFileSync('./settings-database.json',JSON.stringify(SettingsDB,null,2));}catch(e){}}
router.post('/settings/qr',(req,res)=>{const {user}=req.body;const qr={id:'QR_'+Date.now(),user,text:`https://tarimos.org/user/${user}`,created:Date.now()};SettingsDB.qr_codes[user]=qr;saveSettings();res.json({ok:true,qr,text:qr.text});});
router.get('/settings/commercial/:user',(req,res)=>{res.json({wallet:SettingsDB.wallets[req.params.user]||{balance:0,earnings:0}});});
router.post('/settings/promote',(req,res)=>res.json({ok:true}));
router.get('/settings/posts/:user',(req,res)=>{try{const feed=JSON.parse(fs.readFileSync('./feed-database.json','utf8'));res.json({posts:feed.posts.filter(p=>p.user===req.params.user)});}catch(e){res.json({posts:[]});}});
router.get('/settings/account/:user',(req,res)=>{res.json({settings:SettingsDB.users_settings[req.params.user]||{}});});
router.post('/settings/account/update',(req,res)=>{const {user,name,bio}=req.body;if(!SettingsDB.users_settings[user])SettingsDB.users_settings[user]={};SettingsDB.users_settings[user].name=name;SettingsDB.users_settings[user].bio=bio;saveSettings();res.json({ok:true});});
router.post('/settings/background',(req,res)=>{const {user,bgUrl}=req.body;SettingsDB.backgrounds[user]={url:bgUrl,time:Date.now()};saveSettings();if(global.io)global.io.emit('bg_changed',{user,bg:SettingsDB.backgrounds[user]});res.json({ok:true,bg:SettingsDB.backgrounds[user]});});
router.get('/settings/background/:user',(req,res)=>res.json(SettingsDB.backgrounds[req.params.user]||{}));
router.post('/settings/share-profile',(req,res)=>{res.json({ok:true,link:`https://tarimos.org/user/${req.body.user}`});});
router.post('/settings/logout',(req,res)=>res.json({ok:true}));
router.get('/settings/stats/:user',(req,res)=>{try{const feed=JSON.parse(fs.readFileSync('./feed-database.json','utf8'));const my=feed.posts.filter(p=>p.user===req.params.user);res.json({likes:my.reduce((s,p)=>s+p.likes,0),followers:0,posts:my.length});}catch(e){res.json({likes:0,followers:0,posts:0});}});
module.exports=router;
