const express = require("express");
const httpProxy = require("http-proxy");
const dotenv  = require("dotenv")

const app = express();
const proxy = httpProxy.createProxyServer();

const BASE_PATH = process.env.BASE_PATH

app.use((req, res) => {
  const hostName = req.hostname;
  console.log("Received request for host:", hostName);
  const subDomain = hostName.split(".")[0];
  
  const resolveTo = `${BASE_PATH}/${subDomain}`;
  return proxy.web(req, res, { target: resolveTo, changeOrigin:true }); 
});

proxy.on("proxyReq", (proxyReq, req, res) => {
  const url = req.url;
  if (url == '/') {
    proxyReq.path += 'index.html';
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`S3 Reverse Proxy is running on port ${PORT}`);
});