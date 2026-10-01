const scene = document.querySelector("#xr-scene");
const status = document.querySelector("#feed-status");
const AFRAME = window.AFRAME;
let canvas, context, texture, mesh, room = "";

function fillGradient(stops) {
  const g = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  context.fillStyle = g;
  context.fillRect(0, 0, canvas.width, canvas.height);
}
function swirls() {
  fillGradient([[0,"#22004e"],[.28,"#0e7f9d"],[.56,"#f6aa18"],[.78,"#ea3c82"],[1,"#12126b"]]);
  const colors=["#ffd447","#f4a0c1","#68d5ed","#8df0db","#ff6d20","#8c4b9e"];
  for(let i=0;i<82;i++){ const x=Math.random()*canvas.width,y=Math.random()*canvas.height,r=60+Math.random()*310;
    context.strokeStyle=colors[i%colors.length];context.globalAlpha=.82;context.lineWidth=18+Math.random()*42;
    context.beginPath();context.arc(x,y,r,0,Math.PI*1.75);context.stroke();
  }
  context.globalAlpha=1; context.fillStyle="#fff5a5";
  for(let i=0;i<110;i++){const x=Math.random()*canvas.width,y=Math.random()*canvas.height,s=2+Math.random()*7;
    context.beginPath();for(let p=0;p<10;p++){const a=p*Math.PI/5-Math.PI/2,rad=p%2?s*.42:s,px=x+Math.cos(a)*rad,py=y+Math.sin(a)*rad;p?context.lineTo(px,py):context.moveTo(px,py)}context.fill();
  }
}
function glitch() {
  fillGradient([[0,"#01020d"],[.45,"#07153b"],[1,"#02030a"]]);
  for(let y=0;y<canvas.height;y+=4){context.fillStyle="rgba(28,88,255,"+(.12+Math.random()*.36)+")";context.fillRect(0,y,canvas.width,1);}
  for(let i=0;i<110;i++){const y=Math.random()*canvas.height,w=80+Math.random()*800;context.fillStyle=i%8===0?"#f32bd7":i%3===0?"#24dcff":"#275fff";context.globalAlpha=.55;context.fillRect(Math.random()*(canvas.width-w),y,w,2+Math.random()*11);}
  context.globalAlpha=1;
}
function greenData() {
  fillGradient([[0,"#010b05"],[.38,"#0a6625"],[.66,"#20a746"],[1,"#021208"]]);
  context.strokeStyle="rgba(164,255,170,.22)";context.lineWidth=2;
  for(let i=0;i<48;i++){const x=(i*79)%canvas.width,y=(i*131)%canvas.height,s=45+(i%7)*24;context.strokeRect(x,y,s,s);}
  context.fillStyle="rgba(7,18,9,.62)";context.font="36px monospace";
  for(let y=70;y<canvas.height;y+=50){let row="";for(let i=0;i<52;i++)row+=Math.random()>.5?"1":"0";context.fillText(row,20,y);}
}
function calm() {
  fillGradient([[0,"#f8fbfc"],[.38,"#dcebf0"],[.7,"#fff7ee"],[1,"#d8e5ed"]]);
  context.globalAlpha=.72;context.strokeStyle="#ffffff";context.lineWidth=72;
  for(let i=0;i<5;i++){context.beginPath();context.arc(canvas.width*.8,canvas.height*.2+i*150,360+i*60,Math.PI*.6,Math.PI*1.4);context.stroke();}
  context.globalAlpha=1;
}
function draw(next) {
  room=next;context.clearRect(0,0,canvas.width,canvas.height);
  if(room==="meme") swirls(); else if(room==="phone") greenData(); else if(room==="rest") calm(); else if(room==="overload"){swirls();context.globalAlpha=.28;glitch();context.globalAlpha=1;} else glitch();
  texture.needsUpdate=true;
}
function detect(){const v=(status?.textContent||"").toUpperCase();return v.includes("MEME")?"meme":v.includes("HANDY")||v.includes("PUSH")?"phone":v.includes("OVERLOAD")?"overload":v.includes("PAUSE")?"rest":"news";}
function start(){if(mesh||!AFRAME?.THREE||!scene?.object3D)return;const THREE=AFRAME.THREE;canvas=document.createElement("canvas");canvas.width=1500;canvas.height=750;context=canvas.getContext("2d");texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const geo=new THREE.SphereGeometry(29,80,40);geo.scale(-1,1,1);mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false,toneMapped:false}));mesh.renderOrder=-900;scene.object3D.add(mesh);draw(detect());setInterval(()=>{const n=detect();if(n!==room)draw(n);if(mesh)mesh.rotation.y+=n==="meme"?.0005:n==="overload"?.0011:.00015;},250);}
if(scene?.hasLoaded)start();else scene?.addEventListener("loaded",start,{once:true});setTimeout(start,800);
