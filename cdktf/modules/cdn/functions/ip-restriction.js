
// CloudFront Functions用の純粋なJavaScriptコード例
// allowedIPsはデプロイ時に置換してください
function handler(event) {
    var request = event.request;
    var clientIP = event.viewer.ip;
    // 許可されたIPアドレス/CIDR範囲
    var allowedIPs = ["127.0.0.1"];
    // IP制限チェック関数
    function isIpAllowed(ip, allowedRanges) {
        // allowedRangesが空なら全て許可
        if (!allowedRanges || allowedRanges.length === 0) {
            return true;
        }
        for (var i = 0; i < allowedRanges.length; i++) {
            var range = allowedRanges[i];
            if (range.includes('/')) {
                if (isIpInCidr(ip, range)) {
                    return true;
                }
            } else {
                if (ip === range) {
                    return true;
                }
            }
        }
        return false;
    }
    function isIpInCidr(ip, cidr) {
        var parts = cidr.split('/');
        var network = parts[0];
        var maskBits = parseInt(parts[1]);
        var ipInt = ipToInt(ip);
        var networkInt = ipToInt(network);
        var mask = (0xFFFFFFFF << (32 - maskBits)) >>> 0;
        return (ipInt & mask) === (networkInt & mask);
    }
    function ipToInt(ip) {
        var parts = ip.split('.');
        return (parseInt(parts[0]) << 24) + 
               (parseInt(parts[1]) << 16) + 
               (parseInt(parts[2]) << 8) + 
               parseInt(parts[3]);
    }
    if (!isIpAllowed(clientIP, allowedIPs)) {
        return {
            statusCode: 403,
            statusDescription: 'Forbidden',
            headers: {
                'content-type': { value: 'text/html' }
            },
            body: generateAccessDeniedPage(clientIP)
        };
    }
    // パスが"/"または"/xxx/"のようにスラッシュで終わる場合はindex.htmlを返すようにuriを書き換え
    if (request.uri.endsWith("/")) {
        var newUri = request.uri + "index.html";
        if (newUri === "//index.html") {
            newUri = "/index.html";
        }
        request.uri = newUri;
        return request;
    }
    return request;
}
function generateAccessDeniedPage(clientIP) {
    return '<html>' +
           '<head><title>Access Denied</title>' +
           '<style>body{font-family:Arial,sans-serif;text-align:center;margin-top:50px;}</style></head>' +
           '<body>' +
           '<h1> Access Denied</h1>' +
           '<p>Your IP address <strong>' + clientIP + '</strong> is not allowed to access this resource.</p>' +
           '<p>If you believe this is an error, please contact the administrator.</p>' +
           '<hr><small>CloudFront IP Restriction</small>' +
           '</body></html>';
}
