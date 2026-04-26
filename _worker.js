export default {
  async fetch(request) {

    const url = new URL(request.url);

    const uuid = url.searchParams.get("uuid") || "YOUR-UUID";
    const path = url.searchParams.get("path") || "/grpc";
    const ech = url.searchParams.get("ech");
    const workerDomain = url.hostname;

    const IP_SOURCE = "https://raw.githubusercontent.com/cmliu/CFcdnVmess2sub/main/ip.txt";
    const NEW_IP_SOURCE = "https://raw.githubusercontent.com/cmliu/WorkerVless2sub/main/newip.txt";

    const [ipText, newIpText] = await Promise.all([
      fetch(IP_SOURCE).then(r => r.text()),
      fetch(NEW_IP_SOURCE).then(r => r.text())
    ]);

    const ipList = parseIPList(ipText);
    const newIpList = parseNewIPList(newIpText);

    const links1 = generateLinksFromSource(ipList, uuid, workerDomain, false, path, ech);
    const links2 = generateLinksFromNewIPs(newIpList, uuid, workerDomain, path, ech);

    const allLinks = [...links1, ...links2].join("\n");
    const base64 = btoa(allLinks);

    return new Response(base64, {
      headers: { "content-type": "text/plain;charset=utf-8" }
    });
  }
};






// ========== 解析 IP ==========
function parseIPList(text) {
  return text.split("\n").map(line => {
    const parts = line.split(",");
    return {
      ip: parts[0],
      port: parts[1],
      isp: parts[2],
      colo: parts[3]
    };
  }).filter(i => i.ip);
}

function parseNewIPList(text) {
  return text.split("\n").map(line => {
    const parts = line.split(",");
    return {
      name: parts[0],
      ip: parts[1],
      port: parts[2]
    };
  }).filter(i => i.ip);
}





// ========== 核心：生成 gRPC ==========
function buildGrpcParams(workerDomain, serviceName, ech) {

  const params = new URLSearchParams({
    encryption: "none",
    security: "tls",
    type: "grpc",
    serviceName: serviceName.replace("/", ""),
    authority: workerDomain,
    sni: workerDomain,
    fp: "chrome"
  });

  if (ech) {
    params.set("alpn", "h2");
    params.set("ech", ech);
  }

  return params.toString();
}





// ========== 原IP库 ==========
function generateLinksFromSource(list, user, workerDomain, disableNonTLS = false, customPath = '/', echConfig = null) {

  const CF_HTTPS_PORTS = [443, 2053, 2083, 2087, 2096, 8443];
  const links = [];

  list.forEach(item => {

    let nodeNameBase = item.isp ? item.isp.replace(/\s/g, '_') : (item.name || item.domain || item.ip);
    if (item.colo) nodeNameBase += "-" + item.colo;

    const safeIP = item.ip.includes(':') ? `[${item.ip}]` : item.ip;
    const ports = item.port ? [item.port] : CF_HTTPS_PORTS;

    ports.forEach(port => {

      const nodeName = `${nodeNameBase}-${port}-gRPC`;
      const params = buildGrpcParams(workerDomain, customPath, echConfig);

      links.push(
        `vless://${user}@${safeIP}:${port}?${params}#${encodeURIComponent(nodeName)}`
      );
    });
  });

  return links;
}





// ========== newip ==========
function generateLinksFromNewIPs(list, user, workerDomain, customPath = '/', echConfig = null) {

  const links = [];

  list.forEach(item => {

    const nodeName = `${item.name}-gRPC`;
    const params = buildGrpcParams(workerDomain, customPath, echConfig);

    links.push(
      `vless://${user}@${item.ip}:${item.port}?${params}#${encodeURIComponent(nodeName)}`
    );
  });

  return links;
}
