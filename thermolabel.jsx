import { useState, useRef, useEffect, useCallback } from "react";

// ─── PALETTES ────────────────────────────────────────────────────────────────
const PALETTES = {
  iron:      [[0,0,0],[28,0,58],[58,0,100],[100,0,120],[140,0,100],[180,20,60],[220,60,20],[255,120,0],[255,180,0],[255,230,50],[255,255,180],[255,255,255]],
  rainbow:   [[0,0,139],[0,0,255],[0,100,255],[0,200,200],[0,255,100],[100,255,0],[200,255,0],[255,200,0],[255,100,0],[255,0,0],[200,0,0],[139,0,0]],
  grayscale: Array.from({length:12},(_,i)=>{const v=Math.round(i*23);return[v,v,v];}),
  hotspot:   [[0,0,50],[0,0,120],[0,60,200],[0,150,255],[0,255,200],[100,255,100],[200,255,0],[255,200,0],[255,100,0],[255,0,0],[200,0,50],[150,0,100]],
  arctic:    [[10,10,80],[20,40,160],[30,100,220],[60,180,240],[120,220,255],[200,240,255],[255,255,255],[255,240,200],[255,200,120],[255,140,40],[220,60,0],[140,0,0]],
};

const DEFAULT_CLASSES = [
  { id:1, name:"Перегрев",      color:"#ff3030", tempMin:45,  tempMax:120 },
  { id:2, name:"Аномалия",      color:"#ff9900", tempMin:35,  tempMax:45  },
  { id:3, name:"Норма",         color:"#00cc66", tempMin:20,  tempMax:35  },
  { id:4, name:"Холодная зона", color:"#4488ff", tempMin:-20, tempMax:20  },
  { id:5, name:"Объект",        color:"#cc44ff", tempMin:-20, tempMax:120 },
];

const TOOLS = { bbox:"bbox", polygon:"polygon", threshold:"threshold" };

// ─── UTILS ────────────────────────────────────────────────────────────────────
function applyPalette(raw, palette) {
  const result = new Uint8ClampedArray(raw.length);
  for (let i=0; i<raw.length; i+=4) {
    const gray=raw[i];
    const fi=(gray/255)*(palette.length-1);
    const idx=Math.floor(fi), t=fi-idx;
    const c0=palette[idx], c1=palette[Math.min(idx+1,palette.length-1)];
    result[i]  =Math.round(c0[0]+(c1[0]-c0[0])*t);
    result[i+1]=Math.round(c0[1]+(c1[1]-c0[1])*t);
    result[i+2]=Math.round(c0[2]+(c1[2]-c0[2])*t);
    result[i+3]=255;
  }
  return result;
}

function rawToTemp(g) { return -20+(g/255)*140; }
function tempToRaw(t) { return Math.max(0,Math.min(255,Math.round(((t+20)/160)*255))); }

function getAreaStats(raw, W, x, y, w, h) {
  let sum=0, max=0, min=255, count=0;
  const x0=Math.max(0,Math.floor(x)), y0=Math.max(0,Math.floor(y));
  const rH=Math.floor(raw.length/4/W);
  const x1=Math.min(W-1,Math.floor(x+w)), y1=Math.min(rH-1,Math.floor(y+h));
  for(let py=y0;py<=y1;py++) for(let px=x0;px<=x1;px++) {
    const v=raw[(py*W+px)*4]; sum+=v; count++;
    if(v>max)max=v; if(v<min)min=v;
  }
  if(!count) return {mean:0,max:0,min:0};
  return {mean:rawToTemp(sum/count),max:rawToTemp(max),min:rawToTemp(min)};
}

function generateThermalDemo(W,H) {
  const data=new Uint8ClampedArray(W*H*4);
  const nr=(s)=>{s=Math.sin(s)*43758.5453;return s-Math.floor(s);};
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) {
    const i=(y*W+x)*4;
    let v=75+Math.sin(x*0.018)*28+Math.cos(y*0.013)*22+Math.sin((x+y)*0.009)*15;
    const spots=[[0.72,0.22,130,0.7],[0.38,0.58,95,0.55],[0.55,0.35,70,0.8]];
    for(const[sx,sy,amp,dec] of spots){const dx=x-W*sx,dy=y-H*sy;v+=Math.max(0,amp-Math.sqrt(dx*dx+dy*dy)*dec);}
    const dx3=x-W*0.12,dy3=y-H*0.78;v-=Math.max(0,55-Math.sqrt(dx3*dx3+dy3*dy3)*0.85);
    const dx4=x-W*0.85,dy4=y-H*0.75;v-=Math.max(0,40-Math.sqrt(dx4*dx4+dy4*dy4)*0.9);
    v+=(nr(x*73+y*37)-0.5)*8;
    v=Math.max(0,Math.min(255,v));
    data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;
  }
  return data;
}

function pointInPolygon(points,x,y) {
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const xi=points[i].x,yi=points[i].y,xj=points[j].x,yj=points[j].y;
    if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}

function polygonBounds(pts) {
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
}

// ─── HISTOGRAM ───────────────────────────────────────────────────────────────
function Histogram({raw}) {
  const ref=useRef(null);
  useEffect(()=>{
    if(!raw||!ref.current)return;
    const c=ref.current,ctx=c.getContext("2d");
    const bins=new Array(64).fill(0);
    for(let i=0;i<raw.length;i+=4)bins[Math.floor(raw[i]/4)]++;
    const maxB=Math.max(...bins);
    ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle="#050608";ctx.fillRect(0,0,c.width,c.height);
    bins.forEach((v,i)=>{
      const t=i/64,fi=t*(PALETTES.iron.length-1),ci=Math.floor(fi),ct=fi-ci;
      const c0=PALETTES.iron[ci],c1=PALETTES.iron[Math.min(ci+1,PALETTES.iron.length-1)];
      ctx.fillStyle=`rgb(${Math.round(c0[0]+(c1[0]-c0[0])*ct)},${Math.round(c0[1]+(c1[1]-c0[1])*ct)},${Math.round(c0[2]+(c1[2]-c0[2])*ct)})`;
      const bh=(v/maxB)*(c.height-2);
      ctx.fillRect(i*(c.width/64),c.height-bh,c.width/64-0.5,bh);
    });
    ctx.fillStyle="#2a3a44";ctx.font="7px monospace";
    ctx.fillText("-20°",2,c.height-1);ctx.fillText("120°",c.width-22,c.height-1);
  },[raw]);
  return <canvas ref={ref} width={180} height={44} style={{width:"100%",borderRadius:3,display:"block"}}/>;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function ThermoLabel() {
  const canvasRef   = useRef(null);
  const overlayRef  = useRef(null);
  const heatmapRef  = useRef(null);
  const fileInputRef= useRef(null);
  const rawDataRef  = useRef(null);

  const [W,setW]=useState(640);
  const [H,setH]=useState(480);
  const [palette,setPalette]     = useState("iron");
  const [tool,setTool]           = useState(TOOLS.bbox);
  const [annotations,setAnnotations] = useState([]);
  const [classes,setClasses]     = useState(DEFAULT_CLASSES);
  const [selClass,setSelClass]   = useState(DEFAULT_CLASSES[0]);
  const [selAnn,setSelAnn]       = useState(null);
  const [hovered,setHovered]     = useState(null);
  const [tab,setTab]             = useState("annotate");
  const [loaded,setLoaded]       = useState(false);
  const [imgName,setImgName]     = useState("thermal_demo.jpg");
  const [showHeat,setShowHeat]   = useState(false);
  const [threshold,setThreshold] = useState(40);
  const [zoom,setZoom]           = useState(1);
  const [undoStack,setUndoStack] = useState([]);
  const [polyPts,setPolyPts]     = useState([]);
  const [mousePos,setMousePos]   = useState(null);
  const [drawStart,setDrawStart] = useState(null);
  const [drawCur,setDrawCur]     = useState(null);
  const [isDrawing,setIsDrawing] = useState(false);
  const [newName,setNewName]     = useState("");
  const [newColor,setNewColor]   = useState("#ff00ff");

  useEffect(()=>{
    rawDataRef.current=generateThermalDemo(W,H);
    setLoaded(true);
  },[]);

  const renderImage=useCallback(()=>{
    const c=canvasRef.current;
    if(!c||!rawDataRef.current)return;
    const ctx=c.getContext("2d");
    const colored=applyPalette(rawDataRef.current,PALETTES[palette]);
    const imgData=new ImageData(W,H);
    imgData.data.set(colored);
    ctx.putImageData(imgData,0,0);
  },[palette,W,H]);

  useEffect(()=>{if(loaded)renderImage();},[loaded,renderImage]);

  // Heatmap
  useEffect(()=>{
    const c=heatmapRef.current;
    if(!c)return;
    const ctx=c.getContext("2d");
    ctx.clearRect(0,0,W,H);
    if(!showHeat||!annotations.length)return;
    const grid=new Float32Array(W*H);
    for(const ann of annotations){
      if(ann.type!=="bbox")continue;
      const cx=ann.x+ann.w/2,cy=ann.y+ann.h/2,r=Math.max(ann.w,ann.h)/2;
      for(let py=Math.max(0,Math.floor(ann.y));py<Math.min(H,Math.ceil(ann.y+ann.h));py++)
        for(let px=Math.max(0,Math.floor(ann.x));px<Math.min(W,Math.ceil(ann.x+ann.w));px++){
          const d=Math.sqrt((px-cx)**2+(py-cy)**2);
          grid[py*W+px]+=Math.max(0,1-d/r)*(ann.tempStats.mean/100);
        }
    }
    const imgData=ctx.createImageData(W,H);
    for(let i=0;i<W*H;i++){
      const v=Math.min(1,grid[i]);
      imgData.data[i*4]=Math.round(v*255);imgData.data[i*4+1]=Math.round((1-v)*80);
      imgData.data[i*4+2]=0;imgData.data[i*4+3]=Math.round(v*150);
    }
    ctx.putImageData(imgData,0,0);
  },[showHeat,annotations,W,H]);

  // Overlay
  const renderOverlay=useCallback(()=>{
    const c=overlayRef.current;
    if(!c)return;
    const ctx=c.getContext("2d");
    ctx.clearRect(0,0,W,H);

    // Threshold highlight
    if(tool===TOOLS.threshold&&rawDataRef.current){
      const tr=tempToRaw(threshold);
      const imgData=ctx.createImageData(W,H);
      for(let py=0;py<H;py++) for(let px=0;px<W;px++){
        const v=rawDataRef.current[(py*W+px)*4];
        if(v>=tr){const i=(py*W+px)*4;imgData.data[i]=255;imgData.data[i+3]=120;}
      }
      ctx.putImageData(imgData,0,0);
    }

    // Annotations
    annotations.forEach((ann,i)=>{
      const isSel=selAnn===i;
      ctx.strokeStyle=ann.cls.color;ctx.lineWidth=isSel?2.5:1.5;

      if(ann.type==="bbox"){
        ctx.fillStyle=ann.cls.color+(isSel?"2a":"15");
        ctx.fillRect(ann.x,ann.y,ann.w,ann.h);
        ctx.strokeRect(ann.x,ann.y,ann.w,ann.h);
        if(isSel)[[ann.x,ann.y],[ann.x+ann.w,ann.y],[ann.x,ann.y+ann.h],[ann.x+ann.w,ann.y+ann.h]].forEach(([hx,hy])=>{
          ctx.fillStyle="#fff";ctx.fillRect(hx-4,hy-4,8,8);
          ctx.strokeStyle=ann.cls.color;ctx.strokeRect(hx-4,hy-4,8,8);
        });
      } else if(ann.type==="polygon"&&ann.points.length>1){
        ctx.beginPath();ctx.moveTo(ann.points[0].x,ann.points[0].y);
        ann.points.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
        ctx.fillStyle=ann.cls.color+(isSel?"2a":"15");ctx.fill();ctx.stroke();
        ann.points.forEach(p=>{ctx.fillStyle=ann.cls.color;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();});
      }

      const lx=ann.type==="bbox"?ann.x:(ann.points?.[0]?.x??0);
      const ly=ann.type==="bbox"?ann.y:(ann.points?.[0]?.y??0);
      ctx.font="bold 10px 'JetBrains Mono',monospace";
      const label=`#${i+1} ${ann.cls.name} ${ann.tempStats.mean.toFixed(1)}°`;
      const tw=ctx.measureText(label).width;
      const lTop=Math.max(16,ly);
      ctx.fillStyle=ann.cls.color+"cc";
      ctx.beginPath();ctx.roundRect(lx,lTop-16,tw+8,16,3);ctx.fill();
      ctx.fillStyle="#000";ctx.fillText(label,lx+4,lTop-4);
    });

    // In-progress bbox
    if(isDrawing&&drawStart&&drawCur){
      const x=Math.min(drawStart.x,drawCur.x),y=Math.min(drawStart.y,drawCur.y);
      const w=Math.abs(drawCur.x-drawStart.x),h=Math.abs(drawCur.y-drawStart.y);
      ctx.strokeStyle=selClass.color;ctx.lineWidth=1.5;ctx.setLineDash([5,3]);
      ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);
      ctx.fillStyle=selClass.color+"22";ctx.fillRect(x,y,w,h);
    }

    // In-progress polygon
    if(tool===TOOLS.polygon&&polyPts.length>0){
      ctx.strokeStyle=selClass.color;ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(polyPts[0].x,polyPts[0].y);
      polyPts.forEach(p=>ctx.lineTo(p.x,p.y));
      if(mousePos)ctx.lineTo(mousePos.x,mousePos.y);
      ctx.stroke();
      polyPts.forEach((p,pi)=>{
        ctx.fillStyle=pi===0?"#ffffff":selClass.color;
        ctx.beginPath();ctx.arc(p.x,p.y,pi===0?6:3,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=selClass.color;ctx.lineWidth=1;ctx.stroke();
      });
    }
  },[annotations,selAnn,isDrawing,drawStart,drawCur,polyPts,mousePos,tool,selClass,threshold,W,H]);

  useEffect(()=>{renderOverlay();},[renderOverlay]);

  const getPos=useCallback((e)=>{
    const c=overlayRef.current;if(!c)return{x:0,y:0};
    const r=c.getBoundingClientRect();
    return{x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height)};
  },[W,H]);

  const addAnnotation=(ann)=>{
    setUndoStack(p=>[...p,annotations]);
    setAnnotations(p=>[...p,ann]);
  };

  const finishPolygon=useCallback(()=>{
    if(polyPts.length<3){setPolyPts([]);return;}
    const bounds=polygonBounds(polyPts);
    const stats=getAreaStats(rawDataRef.current,W,bounds.x,bounds.y,bounds.w,bounds.h);
    addAnnotation({id:Date.now(),type:"polygon",points:[...polyPts],cls:selClass,tempStats:stats,...bounds});
    setPolyPts([]);
  },[polyPts,selClass,W,annotations]);

  const handleMouseDown=(e)=>{
    const pos=getPos(e);
    if(tool===TOOLS.polygon){
      if(polyPts.length>2){const dx=pos.x-polyPts[0].x,dy=pos.y-polyPts[0].y;if(Math.sqrt(dx*dx+dy*dy)<14){finishPolygon();return;}}
      setPolyPts(p=>[...p,pos]);return;
    }
    if(tool===TOOLS.threshold)return;
    for(let i=annotations.length-1;i>=0;i--){
      const a=annotations[i];
      const hit=a.type==="bbox"?(pos.x>=a.x&&pos.x<=a.x+a.w&&pos.y>=a.y&&pos.y<=a.y+a.h):pointInPolygon(a.points||[],pos.x,pos.y);
      if(hit){setSelAnn(selAnn===i?null:i);return;}
    }
    setSelAnn(null);setIsDrawing(true);setDrawStart(pos);setDrawCur(pos);
  };

  const handleMouseMove=(e)=>{
    const pos=getPos(e);
    if(rawDataRef.current){const px=Math.max(0,Math.min(W-1,Math.floor(pos.x))),py=Math.max(0,Math.min(H-1,Math.floor(pos.y)));
      setHovered({...pos,temp:rawToTemp(rawDataRef.current[(py*W+px)*4])});}
    setMousePos(pos);
    if(isDrawing)setDrawCur(pos);
  };

  const handleMouseUp=()=>{
    if(!isDrawing||!drawStart||!drawCur){setIsDrawing(false);return;}
    const x=Math.min(drawStart.x,drawCur.x),y=Math.min(drawStart.y,drawCur.y);
    const w=Math.abs(drawCur.x-drawStart.x),h=Math.abs(drawCur.y-drawStart.y);
    if(w<8||h<8){setIsDrawing(false);setDrawStart(null);setDrawCur(null);return;}
    const stats=getAreaStats(rawDataRef.current,W,x,y,w,h);
    addAnnotation({id:Date.now(),type:"bbox",x,y,w,h,cls:selClass,tempStats:stats});
    setIsDrawing(false);setDrawStart(null);setDrawCur(null);
  };

  const handleFileUpload=(e)=>{
    const file=e.target.files[0];if(!file)return;
    setImgName(file.name);
    const img=new Image();
    img.onload=()=>{
      const nW=img.width,nH=img.height;setW(nW);setH(nH);
      const tmp=document.createElement("canvas");tmp.width=nW;tmp.height=nH;
      const ctx=tmp.getContext("2d");ctx.drawImage(img,0,0);
      const d=ctx.getImageData(0,0,nW,nH).data;
      const raw=new Uint8ClampedArray(nW*nH*4);
      for(let i=0;i<d.length;i+=4){const g=Math.round(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]);raw[i]=raw[i+1]=raw[i+2]=g;raw[i+3]=255;}
      rawDataRef.current=raw;setAnnotations([]);setSelAnn(null);setLoaded(false);setTimeout(()=>setLoaded(true),10);
    };
    img.src=URL.createObjectURL(file);
  };

  const applyThreshold=()=>{
    if(!rawDataRef.current)return;
    const tr=tempToRaw(threshold),visited=new Uint8Array(W*H),newAnns=[];
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){
      const idx=y*W+x;
      if(visited[idx]||rawDataRef.current[idx*4]<tr)continue;
      const queue=[{x,y}];visited[idx]=1;let minX=x,maxX=x,minY=y,maxY=y;
      while(queue.length){
        const{x:cx,y:cy}=queue.shift();
        if(cx<minX)minX=cx;if(cx>maxX)maxX=cx;if(cy<minY)minY=cy;if(cy>maxY)maxY=cy;
        for(const[dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
          const nx=cx+dx,ny=cy+dy;
          if(nx<0||nx>=W||ny<0||ny>=H)continue;
          const ni=ny*W+nx;if(visited[ni]||rawDataRef.current[ni*4]<tr)continue;
          visited[ni]=1;queue.push({x:nx,y:ny});
        }
      }
      if(maxX-minX<5||maxY-minY<5)continue;
      const stats=getAreaStats(rawDataRef.current,W,minX,minY,maxX-minX,maxY-minY);
      newAnns.push({id:Date.now()+newAnns.length,type:"bbox",x:minX,y:minY,w:maxX-minX,h:maxY-minY,cls:selClass,tempStats:stats});
    }
    if(newAnns.length){setUndoStack(p=>[...p,annotations]);setAnnotations(p=>[...p,...newAnns.slice(0,25)]);}
  };

  const exportCOCO=()=>{
    const out={images:[{id:1,file_name:imgName,width:W,height:H}],
      categories:classes.map(c=>({id:c.id,name:c.name,thermal_range:[c.tempMin,c.tempMax]})),
      annotations:annotations.map((a,i)=>({id:i+1,image_id:1,category_id:a.cls.id,
        bbox:[Math.round(a.x),Math.round(a.y),Math.round(a.w),Math.round(a.h)],
        segmentation:a.type==="polygon"?[a.points.flatMap(p=>[Math.round(p.x),Math.round(p.y)])]:[],
        area:Math.round(a.w*a.h),iscrowd:0,
        thermal:{mean:+a.tempStats.mean.toFixed(2),max:+a.tempStats.max.toFixed(2),min:+a.tempStats.min.toFixed(2)},
        annotation_type:a.type}))};
    dl(JSON.stringify(out,null,2),"annotations_coco.json","application/json");
  };

  const exportYOLO=()=>{
    const lines=annotations.map(a=>`${a.cls.id-1} ${((a.x+a.w/2)/W).toFixed(6)} ${((a.y+a.h/2)/H).toFixed(6)} ${(a.w/W).toFixed(6)} ${(a.h/H).toFixed(6)}`);
    dl(lines.join("\n"),"annotations.txt","text/plain");
  };

  const dl=(content,name,type)=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();};

  const saveProject=async()=>{
    try{await window.storage.set("tl:project",JSON.stringify({imgName,annotations,classes}),false);}catch(e){}
  };

  const loadProject=async()=>{
    try{
      const res=await window.storage.get("tl:project",false);
      if(res){const p=JSON.parse(res.value);setAnnotations(p.annotations||[]);setClasses(p.classes||DEFAULT_CLASSES);setImgName(p.imgName||"thermal_demo.jpg");}
    }catch(e){}
  };

  useEffect(()=>{loadProject();},[]);

  const classStats=classes.map(cls=>{
    const ca=annotations.filter(a=>a.cls.id===cls.id);
    const temps=ca.map(a=>a.tempStats.mean);
    return{...cls,count:ca.length,avgTemp:temps.length?temps.reduce((s,v)=>s+v,0)/temps.length:0,maxTemp:temps.length?Math.max(...temps):0};
  });

  // Styles
  const cs={
    bg:"#050608",panel:"#0d1117",border:"#1a2332",text:"#8ab0c8",dim:"#2a4050",accent:"#ff9900",
    lbl:{fontSize:9,color:"#2a4050",letterSpacing:2.5,display:"block",marginBottom:8,textTransform:"uppercase"},
    btn:(on,ac="#ff9900")=>({padding:"5px 9px",border:"1px solid",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:5,transition:"all 0.12s",
      borderColor:on?ac:"#1a2332",background:on?ac+"14":"transparent",color:on?ac:"#4a6880"}),
    card:{background:"#0d1117",border:"1px solid #1a2332",borderRadius:9,padding:16},
  };
  const canvasS={display:"block",maxWidth:"100%",maxHeight:"calc(100vh - 100px)"};

  return (
    <div style={{fontFamily:"'JetBrains Mono','Courier New',monospace",background:cs.bg,minHeight:"100vh",color:cs.text,display:"flex",flexDirection:"column",userSelect:"none"}}>

      {/* HEADER */}
      <div style={{background:cs.panel,borderBottom:`1px solid ${cs.border}`,padding:"9px 16px",display:"flex",alignItems:"center",gap:12,justifyContent:"space-between",flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:6,background:"linear-gradient(135deg,#ff3030,#ff9900)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🌡</div>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:"#cce8ff",letterSpacing:1}}>ThermoLabel</div>
            <div style={{fontSize:8,color:"#1e3040",letterSpacing:2.5}}>THERMAL ANNOTATION v2</div>
          </div>
          <div style={{width:1,height:24,background:cs.border,margin:"0 4px"}}/>
          <span style={{fontSize:9,color:"#2a4050"}}>{imgName}</span>
          <span style={{fontSize:8,color:"#1e3040",background:"#111820",padding:"2px 6px",borderRadius:4,border:`1px solid ${cs.border}`}}>{W}×{H}</span>
        </div>

        <div style={{display:"flex",gap:4}}>
          {[["annotate","Аннотация"],["analytics","Аналитика"],["classes","Классы"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{...cs.btn(tab===t),padding:"4px 12px",letterSpacing:1,textTransform:"uppercase"}}>{l}</button>
          ))}
        </div>

        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          <button onClick={()=>{if(undoStack.length){setAnnotations(undoStack[undoStack.length-1]);setUndoStack(s=>s.slice(0,-1));setSelAnn(null);}}} disabled={!undoStack.length}
            style={{...cs.btn(false),opacity:undoStack.length?1:0.3,fontSize:12,padding:"3px 7px"}} title="Отменить">↩</button>
          <button onClick={saveProject} style={cs.btn(false,"#00cc66")}>💾 Сохранить</button>
          <button onClick={exportYOLO} style={cs.btn(false)}>↓ YOLO</button>
          <button onClick={exportCOCO} style={cs.btn(false)}>↓ COCO</button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFileUpload}/>
          <button onClick={()=>fileInputRef.current.click()} style={cs.btn(false,"#4488ff")}>+ Фото</button>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>

        {/* LEFT */}
        <div style={{width:196,background:cs.panel,borderRight:`1px solid ${cs.border}`,display:"flex",flexDirection:"column",overflowY:"auto"}}>

          <div style={{padding:"13px 13px 11px",borderBottom:`1px solid ${cs.border}`}}>
            <span style={cs.lbl}>Инструмент</span>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {[[TOOLS.bbox,"▭  Bounding Box"],[TOOLS.polygon,"⬡  Полигон"],[TOOLS.threshold,"⚡  Порог"]].map(([t,l])=>(
                <button key={t} onClick={()=>{setTool(t);setPolyPts([]);}} style={{...cs.btn(tool===t),textAlign:"left"}}>{l}</button>
              ))}
            </div>
            {tool===TOOLS.polygon&&polyPts.length>0&&(
              <div style={{marginTop:8,fontSize:9,color:"#3a5570"}}>
                {polyPts.length} точек ·{" "}
                <span style={{color:cs.accent,cursor:"pointer"}} onClick={finishPolygon}>Закрыть</span> ·{" "}
                <span style={{color:"#ff4040",cursor:"pointer"}} onClick={()=>setPolyPts([])}>Сброс</span>
              </div>
            )}
            {tool===TOOLS.threshold&&(
              <div style={{marginTop:9}}>
                <div style={{fontSize:9,color:cs.dim,marginBottom:4}}>Порог: <span style={{color:cs.accent}}>{threshold}°C</span></div>
                <input type="range" min="-20" max="120" value={threshold} onChange={e=>setThreshold(+e.target.value)} style={{width:"100%",accentColor:cs.accent}}/>
                <button onClick={applyThreshold} style={{...cs.btn(false,"#ff3030"),width:"100%",marginTop:6,textAlign:"center"}}>Применить авто</button>
              </div>
            )}
          </div>

          <div style={{padding:"13px 13px 11px",borderBottom:`1px solid ${cs.border}`}}>
            <span style={cs.lbl}>Палитра</span>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {Object.keys(PALETTES).map(p=>(
                <button key={p} onClick={()=>setPalette(p)} style={{...cs.btn(palette===p),display:"flex",alignItems:"center",gap:6,textAlign:"left"}}>
                  <div style={{width:18,height:8,borderRadius:2,flexShrink:0,background:`linear-gradient(to right,${PALETTES[p].slice(0,6).map(c=>`rgb(${c})`).join(",")})`}}/>
                  <span style={{fontSize:9}}>{p.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{padding:"13px 13px 11px",borderBottom:`1px solid ${cs.border}`}}>
            <span style={cs.lbl}>Класс</span>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {classes.map(cls=>(
                <button key={cls.id} onClick={()=>setSelClass(cls)} style={{...cs.btn(selClass.id===cls.id,cls.color),textAlign:"left",fontSize:9}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span><span style={{display:"inline-block",width:7,height:7,borderRadius:1,background:cls.color,marginRight:5}}/>{cls.name}</span>
                    <span style={{fontSize:8,opacity:0.55}}>{cls.tempMin}…{cls.tempMax}°</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{padding:"12px 13px 10px",borderBottom:`1px solid ${cs.border}`}}>
            <span style={cs.lbl}>Курсор</span>
            {hovered?(
              <div style={{fontSize:10,lineHeight:1.8,color:"#3a5570"}}>
                <span style={{color:"#5a8090"}}>X</span> <span style={{color:cs.text}}>{Math.floor(hovered.x)}</span>{"  "}
                <span style={{color:"#5a8090"}}>Y</span> <span style={{color:cs.text}}>{Math.floor(hovered.y)}</span><br/>
                <span style={{color:"#5a8090"}}>T</span> <span style={{color:hovered.temp>45?"#ff3030":hovered.temp>35?cs.accent:cs.text,fontWeight:700}}>{hovered.temp.toFixed(1)}°C</span>
              </div>
            ):<div style={{fontSize:9,color:"#1e2e38"}}>Наведи на изображение</div>}
          </div>

          <div style={{padding:"12px 13px"}}>
            <span style={cs.lbl}>Гистограмма</span>
            <Histogram raw={rawDataRef.current}/>
          </div>
        </div>

        {/* MAIN */}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:cs.bg,overflow:"hidden",position:"relative",minWidth:0}}>

          {tab==="annotate"&&(
            <>
              <div style={{position:"relative",borderRadius:5,overflow:"hidden",border:`1px solid ${cs.border}`,boxShadow:"0 0 80px rgba(255,153,0,0.03)",transform:`scale(${zoom})`,transformOrigin:"center center",transition:"transform 0.18s"}}>
                <canvas ref={canvasRef} width={W} height={H} style={canvasS}/>
                <canvas ref={heatmapRef} width={W} height={H} style={{...canvasS,position:"absolute",top:0,left:0,pointerEvents:"none"}}/>
                <canvas ref={overlayRef} width={W} height={H} style={{...canvasS,position:"absolute",top:0,left:0,cursor:"crosshair"}}
                  onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                  onMouseLeave={()=>{setHovered(null);setMousePos(null);}}
                  onDoubleClick={()=>tool===TOOLS.polygon&&polyPts.length>2&&finishPolygon()}
                />
              </div>
              <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,alignItems:"center",background:"#0d111799",backdropFilter:"blur(8px)",borderRadius:8,padding:"5px 14px",border:`1px solid ${cs.border}`}}>
                <span style={{fontSize:9,color:"#1e3040"}}>{annotations.length} аннотаций</span>
                <div style={{width:1,height:12,background:cs.border}}/>
                <button onClick={()=>setZoom(z=>Math.min(2.5,+(z+0.25).toFixed(2)))} style={{...cs.btn(false),padding:"2px 7px",fontSize:13}}>+</button>
                <span style={{fontSize:9,color:cs.dim,minWidth:34,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
                <button onClick={()=>setZoom(z=>Math.max(0.4,+(z-0.25).toFixed(2)))} style={{...cs.btn(false),padding:"2px 7px",fontSize:13}}>-</button>
                <div style={{width:1,height:12,background:cs.border}}/>
                <label style={{display:"flex",alignItems:"center",gap:5,fontSize:9,color:showHeat?cs.accent:cs.dim,cursor:"pointer"}}>
                  <input type="checkbox" checked={showHeat} onChange={e=>setShowHeat(e.target.checked)} style={{accentColor:cs.accent,width:11,height:11}}/>
                  Тепловая карта
                </label>
              </div>
            </>
          )}

          {tab==="analytics"&&(
            <div style={{width:"100%",maxWidth:860,padding:26,overflowY:"auto",maxHeight:"100%",boxSizing:"border-box"}}>
              <div style={{fontSize:8,color:"#1e3040",letterSpacing:2.5,marginBottom:18}}>АНАЛИТИКА · {annotations.length} АННОТАЦИЙ</div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}>
                {[["Аннотаций",annotations.length,"#cce8ff"],["Классов",classStats.filter(c=>c.count>0).length,"#cce8ff"],
                  ["Max темп",annotations.length?Math.max(...annotations.map(a=>a.tempStats.max)).toFixed(1)+"°":"—","#ff3030"],
                  ["Min темп",annotations.length?Math.min(...annotations.map(a=>a.tempStats.min)).toFixed(1)+"°":"—","#4488ff"]
                ].map(([l,v,c])=>(
                  <div key={l} style={{...cs.card}}>
                    <div style={{fontSize:8,color:cs.dim,letterSpacing:2,marginBottom:8}}>{l}</div>
                    <div style={{fontSize:24,fontWeight:700,color:c}}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div style={{...cs.card}}>
                  <div style={{fontSize:8,color:cs.dim,letterSpacing:2,marginBottom:12}}>РАСПРЕДЕЛЕНИЕ КЛАССОВ</div>
                  {classStats.map(cls=>(
                    <div key={cls.id} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:9}}>
                        <span style={{color:cls.color}}><span style={{display:"inline-block",width:6,height:6,background:cls.color,borderRadius:1,marginRight:5}}/>{cls.name}</span>
                        <span style={{color:"#3a5060"}}>{cls.count} · {annotations.length?Math.round(cls.count/annotations.length*100):0}%</span>
                      </div>
                      <div style={{height:4,background:"#1a2332",borderRadius:2,overflow:"hidden"}}>
                        <div style={{width:`${annotations.length?(cls.count/annotations.length*100):0}%`,height:"100%",background:cls.color,borderRadius:2,transition:"width 0.5s"}}/>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{...cs.card}}>
                  <div style={{fontSize:8,color:cs.dim,letterSpacing:2,marginBottom:12}}>ТЕМПЕРАТУРЫ ПО КЛАССАМ</div>
                  {classStats.filter(c=>c.count>0).length===0&&<div style={{fontSize:9,color:"#1a2a34",textAlign:"center",padding:16}}>Нет аннотаций</div>}
                  {classStats.filter(c=>c.count>0).map(cls=>(
                    <div key={cls.id} style={{marginBottom:8,padding:"8px 10px",background:"#111820",borderRadius:6,borderLeft:`3px solid ${cls.color}`}}>
                      <div style={{color:cls.color,fontSize:9,marginBottom:5}}>{cls.name}</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,fontSize:9}}>
                        <div><span style={{color:cs.dim}}>avg </span><span style={{color:cs.text}}>{cls.avgTemp.toFixed(1)}°</span></div>
                        <div><span style={{color:cs.dim}}>max </span><span style={{color:"#ff3030"}}>{cls.maxTemp.toFixed(1)}°</span></div>
                        <div><span style={{color:cs.dim}}>n </span><span style={{color:"#cce8ff"}}>{cls.count}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{...cs.card}}>
                <div style={{fontSize:8,color:cs.dim,letterSpacing:2,marginBottom:10}}>SCATTER: ПОЗИЦИИ АННОТАЦИЙ</div>
                <div style={{position:"relative",height:160,background:cs.bg,borderRadius:5,border:`1px solid ${cs.border}`,overflow:"hidden"}}>
                  {annotations.map((ann,i)=>{
                    const px=((ann.x+ann.w/2)/W)*100,py=((ann.y+ann.h/2)/H)*100;
                    const size=Math.max(6,Math.min(28,Math.sqrt(ann.w*ann.h)/5));
                    return<div key={ann.id} title={`${ann.cls.name} ${ann.tempStats.mean.toFixed(1)}°C`}
                      onClick={()=>{setSelAnn(i);setTab("annotate");}}
                      style={{position:"absolute",left:`${px}%`,top:`${py}%`,width:size,height:size,borderRadius:"50%",
                        background:ann.cls.color+"88",border:`1px solid ${ann.cls.color}`,
                        transform:"translate(-50%,-50%)",cursor:"pointer",transition:"transform 0.1s"}}
                    />;
                  })}
                  {!annotations.length&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#1a2a34"}}>Добавь аннотации</div>}
                </div>
              </div>
            </div>
          )}

          {tab==="classes"&&(
            <div style={{width:"100%",maxWidth:560,padding:26}}>
              <div style={{fontSize:8,color:cs.dim,letterSpacing:2.5,marginBottom:18}}>УПРАВЛЕНИЕ КЛАССАМИ</div>
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:18}}>
                {classes.map(cls=>(
                  <div key={cls.id} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 12px",...cs.card}}>
                    <div style={{width:13,height:13,borderRadius:3,background:cls.color,flexShrink:0}}/>
                    <span style={{color:cs.text,flex:1,fontSize:10}}>{cls.name}</span>
                    <span style={{color:cs.dim,fontSize:9}}>{cls.tempMin}°…{cls.tempMax}°</span>
                    <span style={{color:"#1e3040",fontSize:9}}>{annotations.filter(a=>a.cls.id===cls.id).length} ann</span>
                    {classes.length>1&&<button onClick={()=>setClasses(cs=>cs.filter(c=>c.id!==cls.id))} style={{...cs.btn(false,"#ff3030"),padding:"2px 7px",fontSize:10}}>✕</button>}
                  </div>
                ))}
              </div>
              <div style={{...cs.card}}>
                <div style={{fontSize:8,color:cs.dim,letterSpacing:2,marginBottom:12}}>ДОБАВИТЬ КЛАСС</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Название класса"
                    style={{flex:1,minWidth:120,padding:"6px 9px",background:"#111820",border:`1px solid ${cs.border}`,color:cs.text,borderRadius:5,fontSize:10,fontFamily:"inherit"}}/>
                  <input type="color" value={newColor} onChange={e=>setNewColor(e.target.value)}
                    style={{width:34,height:30,padding:2,background:"#111820",border:`1px solid ${cs.border}`,borderRadius:5,cursor:"pointer"}}/>
                  <button onClick={()=>{if(!newName.trim())return;const id=Math.max(0,...classes.map(c=>c.id))+1;setClasses(cs=>[...cs,{id,name:newName.trim(),color:newColor,tempMin:-20,tempMax:120}]);setNewName("");}}
                    style={{...cs.btn(false,"#00cc66"),padding:"6px 14px"}}>+ Добавить</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={{width:210,background:cs.panel,borderLeft:`1px solid ${cs.border}`,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"13px 13px 9px",fontSize:8,color:cs.dim,letterSpacing:2.5}}>АННОТАЦИИ · {annotations.length}</div>
          <div style={{flex:1,overflowY:"auto",padding:"0 9px 9px"}}>
            {annotations.length===0&&(
              <div style={{fontSize:9,color:"#1a2a34",textAlign:"center",padding:"24px 0",lineHeight:2.2}}>
                {tool===TOOLS.bbox&&"Нарисуй bbox на снимке"}{tool===TOOLS.polygon&&"Кликай точки полигона"}{tool===TOOLS.threshold&&"Задай порог → Применить"}
              </div>
            )}
            {[...annotations].reverse().map((ann,ri)=>{
              const i=annotations.length-1-ri;
              return(
                <div key={ann.id} onClick={()=>setSelAnn(selAnn===i?null:i)} style={{marginBottom:5,padding:"8px 9px",background:selAnn===i?"#111820":cs.bg,border:"1px solid",borderColor:selAnn===i?ann.cls.color:cs.border,borderRadius:6,cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:ann.cls.color,fontSize:9}}>{ann.type==="polygon"?"⬡":"▭"} #{i+1} {ann.cls.name}</span>
                    <button onClick={e=>{e.stopPropagation();setAnnotations(as=>as.filter((_,ai)=>ai!==i));if(selAnn===i)setSelAnn(null);}}
                      style={{background:"none",border:"none",color:"#1e3040",cursor:"pointer",fontSize:11,padding:0}}>✕</button>
                  </div>
                  <div style={{fontSize:8,color:"#2a4050",lineHeight:1.9}}>
                    <span style={{color:cs.accent}}>{ann.tempStats.mean.toFixed(1)}°</span><span style={{color:"#1e3040"}}> avg  </span>
                    <span style={{color:"#ff3030"}}>{ann.tempStats.max.toFixed(1)}°</span><span style={{color:"#1e3040"}}> max</span>
                    <div style={{color:"#1e3040"}}>{Math.round(ann.w)}×{Math.round(ann.h)}px</div>
                  </div>
                </div>
              );
            })}
          </div>
          {annotations.length>0&&(
            <div style={{padding:9,borderTop:`1px solid ${cs.border}`}}>
              <button onClick={()=>{setUndoStack(p=>[...p,annotations]);setAnnotations([]);setSelAnn(null);}}
                style={{...cs.btn(false,"#ff3030"),width:"100%",textAlign:"center",fontSize:9}}>✕ Очистить всё</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
