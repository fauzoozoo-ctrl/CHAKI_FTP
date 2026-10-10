const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const STORAGE = path.join(__dirname, 'storage');
fs.ensureDirSync(STORAGE);

app.use(cors());
app.use(express.json({limit:'50mb'}));
app.use(express.raw({type:'*/*',limit:'500mb'}));

// Stats
app.get('/api/stats',(req,res)=>{
  const files=fs.readdirSync(STORAGE);
  let total=0; files.forEach(f=>{ try{ total+=fs.statSync(path.join(STORAGE,f)).size }catch(e){} });
  res.json({
    status:'LIVE - CHAKI FTP Unlimited',
    project:'prj-db4so1flot8c73csl1fg',
    url:'https://chaki-ftp-server3.onrender.com',
    region:'Singapore - Mumbai Optimized',
    storage:'∞ Unlimited',
    files:files.length,
    totalSize:(total/1024/1024).toFixed(2)+' MB',
    endpoints:{upload:'/api/upload',files:'/api/files',download:'/files/:name',s3:'/s3'}
  });
});

app.get('/api/files',(req,res)=>{
  const files=fs.readdirSync(STORAGE).map(f=>{
    const stat=fs.statSync(path.join(STORAGE,f));
    return {name:f,size:stat.size,sizeMB:(stat.size/1024/1024).toFixed(2),url:`/files/${f}`,uploaded:new Date(stat.mtime).toLocaleString()};
  });
  res.json(files);
});

app.post('/api/upload',express.raw({type:'*/*',limit:'500mb'}),(req,res)=>{
  const name=req.headers['x-file-name']||`file-${Date.now()}.bin`;
  fs.writeFileSync(path.join(STORAGE,name),req.body);
  console.log(`Uploaded: ${name} - ${req.body.length} bytes`);
  res.json({ok:true,file:name,url:`/files/${name}`,size:req.body.length,message:'Stored ∞ - CHAKI FTP'});
});

app.get('/files/:name',(req,res)=>{
  const file=path.join(STORAGE,req.params.name);
  if(fs.existsSync(file)) res.download(file);
  else res.status(404).json({error:'File not found'});
});

app.delete('/api/files/:name',(req,res)=>{
  const file=path.join(STORAGE,req.params.name);
  if(fs.existsSync(file)){ fs.removeSync(file); res.json({ok:true,message:'Deleted'}); }
  else res.status(404).json({error:'Not found'});
});

// S3 Compatible
app.get('/s3',(req,res)=>res.json({s3:'CHAKI FTP S3 Compatible',endpoint:'https://chaki-ftp-server3.onrender.com/s3',buckets:['chaki-ftp']}));
app.put('/s3/:bucket/:key',(req,res)=>{ fs.writeFileSync(path.join(STORAGE,req.params.key),req.body); res.json({ok:true}); });
app.get('/s3/:bucket/:key',(req,res)=>{ const f=path.join(STORAGE,req.params.key); fs.existsSync(f)?res.sendFile(f):res.status(404).json({error:'Not found'}); });

// Dashboard
app.get('/',(req,res)=>{
  const files=fs.readdirSync(STORAGE);
  let total=0; files.forEach(f=>{ try{ total+=fs.statSync(path.join(STORAGE,f)).size }catch(e){} });
  res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHAKI FTP - Unlimited</title><style>body{background:#0B0F1A;color:#fff;font-family:system-ui;padding:20px;max-width:1000px;margin:0 auto}.card{background:#151A2A;padding:20px;border-radius:12px;margin:15px 0;border:1px solid #2A3050}.btn{background:#4F46E5;color:#fff;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;margin:5px}.btn:hover{background:#6366F1}.file{background:#1E2538;padding:12px;border-radius:8px;margin:6px 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap}.badge{background:#10B981;padding:4px 10px;border-radius:20px;font-size:12px}pre{background:#000;padding:12px;border-radius:8px;overflow:auto;font-size:13px}</style></head><body><h1>🚀 CHAKI FTP - Unlimited Storage ∞</h1><div class="card" style="border-color:#4F46E5;background:#1E293B"><h3>✅ LIVE: https://chaki-ftp-server3.onrender.com</h3><p>📍 Region: Singapore (30ms from Mumbai) | Project: prj-db4so1flot8c73csl1fg</p><p>💾 Files: ${files.length} | Total: ${(total/1024/1024).toFixed(2)} MB | Storage: ∞ Unlimited</p><span class="badge">FREE FOREVER</span> <span class="badge">AUTO-DEPLOY</span> <span class="badge">S3 COMPATIBLE</span></div><div class="card"><h3>📤 Upload File - Unlimited Size</h3><input type="file" id="fileInput" style="padding:10px;background:#0B0F1A;border:1px solid #2A3050;border-radius:6px;color:#fff;width:100%;max-width:400px"><br><br><button class="btn" onclick="uploadFile()">⬆️ Upload to ∞ CHAKI FTP</button><button class="btn" style="background:#0EA5E9" onclick="location.reload()">🔄 Refresh</button><p id="status" style="margin-top:15px;font-weight:bold"></p><div id="progress" style="background:#0B0F1A;height:8px;border-radius:4px;margin-top:10px;display:none"><div id="bar" style="background:#4F46E5;height:100%;width:0%;border-radius:4px;transition:width 0.3s"></div></div></div><div class="card"><h3>📁 Files Stored (${files.length}) - ∞ Unlimited</h3><div id="list">${files.length?files.map(f=>{ const s=fs.statSync(path.join(STORAGE,f)); const mb=(s.size/1024/1024).toFixed(2); return `<div class="file"><div><strong>${f}</strong><br><small>${mb} MB - ${new Date(s.mtime).toLocaleString()}</small></div><div><a href="/files/${f}" download><button class="btn" style="background:#10B981;padding:6px 12px">Download</button></a><button class="btn" style="background:#EF4444;padding:6px 12px" onclick="delFile('${f}')">Delete</button></div></div>` }).join(''):'<p>No files yet - Upload your first file!</p>'}</div></div><div class="card"><h3>🔌 API - S3 Compatible Endpoints</h3><pre>GET  https://chaki-ftp-server3.onrender.com/api/stats       - Server stats
GET  https://chaki-ftp-server3.onrender.com/api/files       - List files
POST https://chaki-ftp-server3.onrender.com/api/upload     - Upload (header: x-file-name: myfile.pdf)
GET  https://chaki-ftp-server3.onrender.com/files/:name    - Download file
DELETE https://chaki-ftp-server3.onrender.com/api/files/:name - Delete file

# S3 API
GET  /s3                              - S3 info
PUT  /s3/bucket/key  + body           - S3 upload
GET  /s3/bucket/key                   - S3 download

# Example curl:
curl -X POST https://chaki-ftp-server3.onrender.com/api/upload \\
  -H "x-file-name: test.pdf" \\
  --data-binary @test.pdf</pre></div><script>async function uploadFile(){ const input=document.getElementById('fileInput'); if(!input.files[0]){alert('Select file first');return} const file=input.files[0]; const status=document.getElementById('status'); const prog=document.getElementById('progress'); const bar=document.getElementById('bar'); status.innerText='Uploading '+file.name+' ('+(file.size/1024/1024).toFixed(2)+' MB)...'; prog.style.display='block'; bar.style.width='50%'; try{ const res=await fetch('/api/upload',{method:'POST',body:await file.arrayBuffer(),headers:{'x-file-name':file.name,'Content-Type':'application/octet-stream'}}); const data=await res.json(); bar.style.width='100%'; status.innerText='✅ Uploaded: '+data.file+' - Stored ∞ CHAKI FTP!'; setTimeout(()=>location.reload(),1200); }catch(e){ status.innerText='❌ Upload failed: '+e.message; bar.style.width='0%'; } } async function delFile(name){ if(!confirm('Delete '+name+'?')) return; await fetch('/api/files/'+name,{method:'DELETE'}); location.reload(); }</script></body></html>`);
});

app.listen(PORT,()=>console.log(`✅ CHAKI FTP LIVE on ${PORT} - ∞ Unlimited - https://chaki-ftp-server3.onrender.com`));
