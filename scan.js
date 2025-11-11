const randomCharacter = ['R', 'p', 'D', 'C', 'z', 'H', 'S', 'd', 'J', 'Z',
    's', 'I', 'X', '6', 'G', 'x', 'n', '0', 'a', '3', 'O', '7', 'k', 'E',
    'U', 'w', '2', 'K', 'v', 'T', 'l', 'r', '9', 'q', 'b', '8', 'W', 't',
    'B', 'M', 'c', 'F', 'o', 'Y', 'g', 'h', 'u', 'A', '1', 'y', 'P', 'Q',
    'V', 'N', 'e', 'j', 'm', 'L', '4', '5', 'f', 'i'];

$(function () {
    $('#result').hide();
    const html5QrCode = new Html5Qrcode("reader");
    let scanning = false;

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        const codeType = decodedResult.result.format.formatName;
        addResultItem(codeType, decodedText);
    };

    const config = {
        fps: 1,    // １秒間に何回スキャンするか
        qrbox: { width: 500, height: 500 },
        formatsToSupport: [
            // 1次元コード
            Html5QrcodeSupportedFormats.QR_CODE,
        ]
    };

    html5QrCode.start(
        { facingMode: "user" },
        config,
        qrCodeSuccessCallback
    ).then(() => {
        scanning = true;

    }).catch(err => {
        alert("カメラのアクセスに失敗しました: " + err);
    });
});


function addResultItem(codeType, codeData) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    const performanceData = decode(codeData);
    $('#about-performance').text(performanceData.performance + ' ' + performanceData.time);
    $('#for-whom').text(performanceData.grade + '年' + performanceData.classNum + '組' + performanceData.Number + '番 ご' + performanceData.relation + '様');
    $('#result').fadeIn(100);
    // 読み取り音を再生（オプション）
    playBeepSound();
    setTimeout(() => {
        $('#result').fadeOut(500);
    }, 3000);

}

// ビープ音を鳴らす関数
function playBeepSound() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = 1000; // 周波数
    gainNode.gain.value = 0.1; // 音量

    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
}

// ページアンロード時にスキャンを停止
window.addEventListener('beforeunload', () => {
    if (html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
        html5QrCode.stop().then(() => {
        }).catch(err => {
            alert("ページ離脱時の停止エラー:", err);
        });
    }
});

function decode(data) {
    let result = 0;
    data = data.slice(1, -1); // チェックディジットを除去
    for (let i = 0; i < data.length; i++) {
        const char = data[i];
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
        time: '第' + (result % 10) + '公演'
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