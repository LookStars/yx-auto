export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === "/sub") {
      return new Response(generateSub(url), {
        headers: { "content-type": "text/plain;charset=utf-8" }
      })
    }

    return new Response(getHTML(), {
      headers: { "content-type": "text/html;charset=utf-8" }
    })
  }
}

function generateSub(url) {
  const host = url.searchParams.get("host")
  const uuid = url.searchParams.get("uuid")
  const ipMode = url.searchParams.get("ip") || "cf"
  const ech = url.searchParams.get("ech") === "true"

  if (!host || !uuid) return "missing host or uuid"

  const port = 443
  const serviceName = "grpc"
  const tls = "tls"

  const base = `${host}:${port}`

  const vless =
`vless://${uuid}@${base}?encryption=none&security=${tls}&type=grpc&serviceName=${serviceName}&sni=${host}&fp=chrome${ech ? "&ech=true" : ""}#gRPC-${host}`

  return vless
}

function getHTML() {
return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>YX Panel</title>
<style>
body{background:#0f172a;color:#e2e8f0;font-family:Arial}
.card{max-width:900px;margin:40px auto;padding:30px;background:#1e293b;border-radius:16px}
input,select{width:100%;padding:10px;margin:6px 0;border-radius:8px;border:none}
button{width:100%;padding:12px;margin-top:10px;border:none;border-radius:10px;background:#3b82f6;color:#fff;font-size:16px}
pre{background:#020617;padding:15px;border-radius:10px;overflow:auto}
h1{margin-top:0}
</style>
</head>

<body>
<div class="card">
<h1>YX 高级面板 · gRPC版</h1>

<label>域名 (必填)</label>
<input id="host" placeholder="example.com">

<label>UUID</label>
<input id="uuid" value="uuid">

<label>IP源</label>
<select id="ip">
<option value="cf">Cloudflare</option>
<option value="auto">Auto</option>
</select>

<label><input type="checkbox" id="ech"> 启用 ECH</label>

<button onclick="gen()">生成订阅</button>

<h3>订阅链接</h3>
<pre id="sub"></pre>

</div>

<script>
function gen(){
  const host=document.getElementById("host").value
  const uuid=document.getElementById("uuid").value
  const ip=document.getElementById("ip").value
  const ech=document.getElementById("ech").checked

  const link = location.origin +
    "/sub?host="+host+
    "&uuid="+uuid+
    "&ip="+ip+
    "&ech="+ech

  document.getElementById("sub").textContent = link
}
</script>
</body>
</html>
`
}
