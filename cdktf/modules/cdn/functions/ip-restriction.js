// CloudFront Functions用の純粋なJavaScriptコード例（修正版）

function handler(event) {
    var request = event.request;
    var clientIP = event.viewer.ip;
    
    // 許可されたIPアドレス/CIDR範囲 (デプロイ時に実際のIPに置換してください)
    var allowedIPs = ["127.0.0.1"]; 
    
    // IP制限チェック
    if (!isIpAllowed(clientIP, allowedIPs)) {
        return {
            statusCode: 403,
            statusDescription: 'Forbidden',
            headers: {
                'content-type': { value: 'text/html; charset=utf-8' }
            },
            body: generateAccessDeniedPage(clientIP)
        };
    }
    
    var uri = request.uri;
    
    // パスが"/"で終わる場合はindex.htmlを返すようにuriを書き換え
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    } 
    // パスにファイル拡張子がなく、ルートパスでもない場合（＝ディレクトリアクセスと判断）
    else if (!uri.substring(uri.lastIndexOf('/') + 1).includes('.') && uri !== '/') {
        // 末尾にスラッシュを追加してリダイレクト
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                'location': { value: uri + '/' }
            }
        };
    }
    
    // それ以外（ファイル拡張子がある、またはルートパスへのアクセス）の場合はそのままリクエストを続行
    return request;
}

// ---------------------------------
// ヘルパー関数（変更なし）
// ---------------------------------
function isIpAllowed(ip, allowedRanges) {
    if (!allowedRanges || allowedRanges.length === 0) return true;
    for (var i = 0; i < allowedRanges.length; i++) {
        var range = allowedRanges[i];
        if (range.includes('/')) {
            if (isIpInCidr(ip, range)) return true;
        } else {
            if (ip === range) return true;
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
    return (parseInt(parts[0], 10) << 24) + 
           (parseInt(parts[1], 10) << 16) + 
           (parseInt(parts[2], 10) << 8) + 
           parseInt(parts[3], 10);
}
function generateAccessDeniedPage(clientIP) {
    return '<!DOCTYPE html><html>' +
           '<head><meta charset="UTF-8"><title>Access Denied</title>' +
           '<style>body{font-family:Arial,sans-serif;text-align:center;margin-top:50px;}</style></head>' +
           '<body>' +
           '<h1>Access Denied</h1>' +
           '<p>Your IP address <strong>' + clientIP + '</strong> is not allowed to access this resource.</p>' +
           '<p>If you believe this is an error, please contact the administrator.</p>' +
           '<hr><small>CloudFront IP Restriction</small>' +
           '</body></html>';
}