const randomCharacter = ['R', 'p', 'D', 'C', 'z', 'H', 'S', 'd', 'J', 'Z',
    's', 'I', 'X', '6', 'G', 'x', 'n', '0', 'a', '3', 'O', '7', 'k', 'E',
    'U', 'w', '2', 'K', 'v', 'T', 'l', 'r', '9', 'q', 'b', '8', 'W', 't',
    'B', 'M', 'c', 'F', 'o', 'Y', 'g', 'h', 'u', 'A', '1', 'y', 'P', 'Q',
    'V', 'N', 'e', 'j', 'm', 'L', '4', '5', 'f', 'i'];

$(function () {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const QRData = params.get('id');

    if (!QRData) {
        alert('QRコードデータが見つかりません。正しいURLでアクセスしてください。');
        return;
    }

    $("#copy-succeed").hide();

    $('#qrcode').empty();
    const _qrcode = new QRCode('qrcode', {
        text: QRData,
        width: 256,
        height: 256,
        correctLevel: QRCode.CorrectLevel.H
    });
    $("#qrcode-data").text(QRData);

    const performanceData = decode(QRData);
    $('#about-performance').text((Math.floor(performanceData.performance / 7) + 1) + '-' + (performanceData.performance % 7 +1) + ' 第' + performanceData.time + '公演');
    $('#for-whom').text(Math.floor(performanceData.id / 1000) + '年' + Math.floor((performanceData.id % 1000) / 100) + '組' + (performanceData.id % 100) + '番 ご' + performanceData.relation + '様');
    $('#url').text('https://rio-gunawan.github.io/gaiensai-ticket/show.html?id=' + QRData).attr('href', './show.html?id=' + QRData);
});

$('#copy-url').on('click', function () {
    const url = $('#url').text();
    navigator.clipboard.writeText(url).then(function () {
        $("#copy-succeed").show();
        setTimeout(function () {
            $("#copy-succeed").fadeOut(500);
        }, 2000);
    }, function (err) {
        alert('URLのコピーに失敗しました: ', err);
    });
});

function decode(data) {
    let result = 0;
    data = data.slice(1, -1); // チェックディジットを除去
    for (let i = 0; i < data.length; i++) {
        const char = data[i];
        const index = randomCharacter.indexOf(char);
        result = result * 62 + index;
    }

    const performanceData = {
        id: Math.floor(result / 10000),
        relation: Math.floor((result % 10000) / 1000),
        performance: Math.floor((result % 1000) / 10),
        time: result % 10
    };
    switch (performanceData.relation) {
        case 0:
            performanceData.relation = '本人';
            break;
        case 1:
            performanceData.relation = '保護者';
            break;
        case 2:
            performanceData.relation = '友人';
            break;
        case 3:
            performanceData.relation = 'その他';
            break;
        default:
            break;
    }
    return performanceData;
}