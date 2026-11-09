fetch("https://tmpfiles.org/api/v1/upload", { method: "OPTIONS" }).then(res => console.log(res.headers.get("access-control-allow-origin"))).catch(console.error);
