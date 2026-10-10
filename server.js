const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const STORAGE = path.join(__dirname, 'storage');
fs.ensureDirSync(STORAGE);

app.use(cors());
app.use(express.json());

app.get('/', (req,res)=>{
  res.send(`<h1>✅ My Server is LIVE on Render!</h1>
  <p>Storage: Unlimited</p>
  <p>Upload: <input type="file" id="f"><button onclick="u()">Upload</button></p>
  <script>
  async function u(){
    const file=document.getElementById('f').files[0];
    await fetch('/upload',{method:'POST',body:await file.arrayBuffer(),headers:{'x-file-name':file.name}});
    alert('Uploaded!');
  }
  </script>`);
});

app.post('/upload', express.raw({type:'*/*',limit:'100mb'}), (req,res)=>{
  fs.writeFileSync(path.join(STORAGE, req.headers['x-file-name']||'file.bin'), req.body);
  res.json({ok:true});
});

app.get('/api/stats', (req,res)=>res.json({status:'LIVE',files:fs.readdirSync(STORAGE).length}));

app.listen(PORT, ()=>console.log('LIVE on '+PORT));