const randomCharacter = ['R', 'p', 'D', 'C', 'z', 'H', 'S', 'd', 'J', 'Z',
    's', 'I', 'X', '6', 'G', 'x', 'n', '0', 'a', '3', 'O', '7', 'k', 'E',
    'U', 'w', '2', 'K', 'v', 'T', 'l', 'r', '9', 'q', 'b', '8', 'W', 't',
    'B', 'M', 'c', 'F', 'o', 'Y', 'g', 'h', 'u', 'A', '1', 'y', 'P', 'Q',
    'V', 'N', 'e', 'j', 'm', 'L', '4', '5', 'f', 'i'];

$(function () {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const QRData = params.get('id');

    $("#copy-succeed").hide();

    if (!QRData) {
        alert('QRコードデータが見つかりません。正しいURLでアクセスしてください。');
        return;
    }

    $('#qrcode').empty();
    const _qrcode = new QRCode('qrcode', {
        text: QRData,
        width: 256,
        height: 256,
        correctLevel: QRCode.CorrectLevel.Q
    });
    $("#qrcode-data").text(QRData);

    const performanceData = decode(QRData);
    if (!IsAuthentic(performanceData)) {
        alert('不正なQRコードデータです。URLを確認してください。');
        $('#about-performance').text('不正なQRコード');
        $('#url').text('https://rio-gunawan.github.io/gaiensai-ticket/show.html?id=' + QRData).attr('href', './show.html?id=' + QRData);
        return;
    }
    $('#about-performance').text(performanceData.performance + ' ' + performanceData.time);
    $('#for-whom').text(performanceData.grade + '年' + performanceData.classNum + '組' + performanceData.Number + '番 ご' + performanceData.relation + '様');
    $('#url').text('https://rio-gunawan.github.io/gaiensai-ticket/show.html?id=' + QRData).attr('href', './show.html?id=' + QRData);
});

$('#copy-url').on('click', function () {
    const url = $('#url').text();
    
    // Clipboard API が利用可能かチェック
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
            $("#copy-succeed").show();
            setTimeout(function () {
                $("#copy-succeed").fadeOut(500);
            }, 2000);
        }, function (err) {
            alert('URLのコピーに失敗しました: ' + err);
        });
    } else {
        // フォールバック: 従来の方法でコピー
        copyToClipboardFallback(url);
    }
});

function decode(data) {
    let result = 0;
    const payload = data.slice(1, -1); // 先頭と末尾のチェックディジットを除去
    for (let i = 0; i < payload.length; i++) {
        const char = payload[i];
        const index = randomCharacter.indexOf(char);
        result = result * 62 + index;
    }

    const id = Math.floor(result / 10000);
    const performanceRawData = Math.floor((result % 1000) / 10);

    const performanceData = {
        id: id,
        grade: Math.floor(id / 1000),
        classNum: Math.floor((id % 1000) / 100),
        Number: (id % 100),
        relation: Math.floor((result % 10000) / 1000),
        performance: (Math.floor(performanceRawData / 7) + 1) + '-' + (performanceRawData % 7 + 1),
        performanceId: performanceRawData,
        time: '第' + (result % 10) + '公演',
        raw: data,
        relationRaw: Math.floor((result % 10000) / 1000)
    };
    switch (performanceData.relation) {
        case 0:
            performanceData.relation = '本人';
            break;
        case 1:
            performanceData.relation = '家族';
            break;
        case 2:
            performanceData.relation = '友人（青高生）';
            break;
        case 3:
            performanceData.relation = '友人（外部）';
            break;
        case 4:
            performanceData.relation = 'その他';
            break;
        default:
            break;
    }
    return performanceData;
}

function calculateCheckDigit(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        const index = randomCharacter.indexOf(data[i]);
        sum += index * (i + 1);
    }
    const checkDigitIndex = sum % 62;
    return randomCharacter[checkDigitIndex];
}

function IsAuthentic(decodedData) {
    const originalData = decodedData.raw.slice(0, -1);
    const providedCheckDigit = decodedData.raw.slice(-1);
    const expectedCheckDigit = calculateCheckDigit(originalData);
    if (providedCheckDigit !== expectedCheckDigit) {
        return false;
    }

    if (!(1 <= decodedData.grade && decodedData.grade <= 3)) {
        return false;
    } if (!(1 <= decodedData.classNum && decodedData.classNum <= 7)) {
        return false;
    } if (!(1 <= decodedData.Number && decodedData.Number <= 42)) {
        return false;
    } if (!(0 <= decodedData.relationRaw && decodedData.relationRaw <= 4)) {
        return false;
    } if (!(0 <= decodedData.performanceId && decodedData.performanceId <= 20)) {
        return false;
    } if (!(1 <= parseInt(decodedData.time.replace('第', '').replace('公演', '')) && parseInt(decodedData.time.replace('第', '').replace('公演', '')) <= 8)) {
        return false;
    }
    return true;
}

// Clipboard API のフォールバック処理
function copyToClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        $("#copy-succeed").show();
        setTimeout(function () {
            $("#copy-succeed").fadeOut(500);
        }, 2000);
    } catch (err) {
        alert('URLのコピーに失敗しました: ' + err);
    } finally {
        document.body.removeChild(textarea);
    }
}