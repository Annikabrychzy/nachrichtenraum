const scene = document.querySelector("#xr-scene");
const feedStatus = document.querySelector("#feed-status");
const AFRAME = window.AFRAME;
let canvas, context, texture, mesh, activeRoom = "";

function gradient(colors) {
  const g = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  colors.forEach(([stop, color]) => g.addColorStop(stop, color));
  context.fillStyle = g;
  context.fillRect(0, 0, canvas.width, canvas.height);
}
function politics() {
  gradient([[0,"#01020b"],[.4,"#071533"],[.74,"#0b2354"],[1,"#02040d"]]);
  for (let y=0;y<canvas.height;y+=4) { context.fillStyle="rgba(55,93,255,"+(.15+Math.random()*.28)+")"; context.fillRect(0,y,canvas.width,1); }
  for (let i=0;i<130;i++) { const w=60+Math.random()*650; context.globalAlpha=.64; context.fillStyle=i%9===0?"#ff2bc0":i%3===0?"#1bd9ff":"#355cff"; context.fillRect(Math.random()*(canvas.width-w),Math.random()*canvas.height,w,2+Math.random()*10); }
  context.globalAlpha=1;
}
function meme() {
  gradient([[0,"#17004a"],[.22,"#0787a8"],[.49,"#f4a115"],[.73,"#e53483"],[1,"#111a68"]]);
  const colors=["#ffcc36","#f6a4c4","#5cdbef","#9bf3d5","#ff6d22","#7943a0"];
  for (let i=0;i<80;i++) { const x=Math.random()*canvas.width,y=Math.random()*canvas.height,r=50+Math.random()*260; context.strokeStyle=colors[i%colors.length]; context.globalAlpha=.78; context.lineWidth=17+Math.random()*34; context.beginPath(); context.arc(x,y,r,0,Math.PI*1.7); context.stroke(); }
  context.globalAlpha=1; context.fillStyle="#fff3a0";
  for (let i=0;i<115;i++) { const x=Math.random()*canvas.width,y=Math.random()*canvas.height,s=2+Math.random()*7; context.beginPath(); for(let p=0;p<10;p++){const a=p*Math.PI/5-Math.PI/2,r=p%2?s*.4:s,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;p?context.lineTo(px,py):context.moveTo(px,py);} context.fill(); }
}
function phone() {
  gradient([[0,"#010b05"],[.36,"#0a6625"],[.67,"#20a746"],[1,"#021207"]]);
  context.strokeStyle="rgba(176,255,180,.25)"; context.lineWidth=2;
  for(let i=0;i<54;i++){const x=(i*83)%canvas.width,y=(i*137)%canvas.height,s=45+(i%7)*27;context.strokeRect(x,y,s,s);}
  context.fillStyle="rgba(2,15,6,.62)";context.font="34px monospace";
  for(let y=55;y<canvas.height;y+=49){let row="";for(let i=0;i<55;i++)row+=Math.random()>.5?"1":"0";context.fillText(row,10,y);}
}
function overload() { meme(); context.globalAlpha=.32; for(let y=0;y<canvas.height;y+=6){context.fillStyle="rgba(25,200,255,.5)";context.fillRect(0,y,canvas.width,1);}context.globalAlpha=1; }
function rest() {
  gradient([[0,"#fbfcfd"],[.38,"#dcebf0"],[.7,"#fff8ef"],[1,"#d7e5ed"]]);
  context.globalAlpha=.76;context.strokeStyle="#ffffff";context.lineWidth=74;
  for(let i=0;i<5;i++){context.beginPath();context.arc(canvas.width*.82,canvas.height*.1+i*160,360+i*58,Math.PI*.62,Math.PI*1.37);context.stroke();}context.globalAlpha=1;
}
function roomFromStatus(){const s=(feedStatus?.textContent||"").toUpperCase();return s.includes("MEME")?"meme":s.includes("HANDY")||s.includes("PUSH")?"phone":s.includes("OVERLOAD")?"overload":s.includes("PAUSE")?"rest":"news";}
function paint(room){activeRoom=room;context.clearRect(0,0,canvas.width,canvas.height);if(room==="meme")meme();else if(room==="phone")phone();else if(room==="overload")overload();else if(room==="rest")rest();else politics();texture.needsUpdate=true;}
function start(){if(mesh||!AFRAME?.THREE||!scene?.object3D)return;const THREE=AFRAME.THREE;canvas=document.createElement("canvas");canvas.width=1600;canvas.height=800;context=canvas.getContext("2d");texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const geometry=new THREE.SphereGeometry(30,96,48);geometry.scale(-1,1,1);mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false,toneMapped:false}));mesh.renderOrder=-1000;scene.object3D.add(mesh);paint(roomFromStatus());setInterval(()=>{const next=roomFromStatus();if(next!==activeRoom)paint(next);mesh.rotation.y+=next==="meme"?.00055:next==="overload"?.00105:.00015;},250);}
if(scene?.hasLoaded)start();else scene?.addEventListener("loaded",start,{once:true});setTimeout(start,1000);
