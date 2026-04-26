export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(html, {
        headers: { "content-type": "text/html;charset=utf-8" }
      });
    }

    if (url.pathname === "/sub") {
      return handleSub(url);
    }

    return new Response("Not Found", { status: 404 });
  }
};



// ================= UI（恢复原版风格） =================

const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>YX Auto</title>
<style>
body{font-family:Arial;background:#0b0f17;color:#fff;text-align:center}
.box{background:#121826;padding:25px;margin:40px auto;width:520px;border-radius:16px}
input{width:90%;padding:10px;margin:8px;border-radius:8px;border:none}
button{padding:12px 30px;border:none;border-radius:10px;background:#4da3ff;color:#fff;font-size:16px}
a{color:#4da3ff}
</style>
</head>

<body>
<div class="box">
<h2>YX Auto 订阅生成</h2>

UUID
<input id="uuid" placeholder="输入UUID">

gRPC路径
<input id="path" value="/grpc">

ECH（可留空）
<input id="ech">

<br><br>
<button onclick="gen()">生成订阅</button>

<p id="out"></p>
</div>

<script>
function gen(){
  const uuid = document.getElementById("uuid").value
  const path = document.getElementById("path").value
  const ech = document.getElementById("ech").value

  let url = location.origin + "/sub?uuid="+uuid+"&path="+path
  if(ech) url += "&ech="+ech

  document.getElementById("out").innerHTML='<a href="'+url+'" target="_blank">'+url+'</a>'
}
</script>
</body>
</html>
`;



// ================= 订阅生成（gRPC版） =================

async function handleSub(url){

  const uuid = url.searchParams.get("uuid");
  const path = url.searchParams.get("path") || "/grpc";
  const ech = url.searchParams.get("ech");
  const workerDomain = url.hostname;

  if(!uuid) return new Response("UUID missing");

  const serviceName = path.replace("/","");
  const ports=[443,2053,2083,2087,2096,8443];

  // GitHub优选IP（失败自动fallback）
  let ipList=[];
  try{
    const txt = await fetch("https://raw.githubusercontent.com/cmliu/CFcdnVmess2sub/main/ip.txt").then(r=>r.text());
    ipList = txt.split("\\n").map(l=>l.split(",")[0]).filter(Boolean);
  }catch{}

  if(ipList.length===0){
    ipList=["104.16.1.1","172.67.1.1","162.159.1.1","188.114.97.1"];
  }

  function buildParams(){
    let p=`encryption=none&security=tls&type=grpc&serviceName=${serviceName}&authority=${workerDomain}&sni=${workerDomain}&fp=chrome`;
    if(ech) p+="&alpn=h2&ech="+ech;
    return p;
  }

  let links=[];
  ipList.forEach(ip=>{
    ports.forEach(port=>{
      links.push(`vless://${uuid}@${ip}:${port}?${buildParams()}#CF-${ip}-${port}`);
    });
  });

  return new Response(btoa(links.join("\\n")));
}
