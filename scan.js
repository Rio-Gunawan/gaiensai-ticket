const randomCharacter = ['R', 'p', 'D', 'C', 'z', 'H', 'S', 'd', 'J', 'Z',
    's', 'I', 'X', '6', 'G', 'x', 'n', '0', 'a', '3', 'O', '7', 'k', 'E',
    'U', 'w', '2', 'K', 'v', 'T', 'l', 'r', '9', 'q', 'b', '8', 'W', 't',
    'B', 'M', 'c', 'F', 'o', 'Y', 'g', 'h', 'u', 'A', '1', 'y', 'P', 'Q',
    'V', 'N', 'e', 'j', 'm', 'L', '4', '5', 'f', 'i'];

const html5QrCode = new Html5Qrcode("reader");

// GETパラメータからクラスを読み取る関数
function getClassFromUrlParameter() {
    const params = new URLSearchParams(window.location.search);
    const classParam = params.get('class');

    if (classParam !== null) {
        const classValue = parseInt(classParam);
        if (!isNaN(classValue) && ((classValue >= 0 && classValue <= 20) || classValue === 21)) {
            return classValue;
        }
    }
    // パラメータが設定されていない場合または無効な場合は校内入場を返す
    return 21;
}

$(function () {
    $('#result').hide();

    // GETパラメータからクラスを設定
    const classValue = getClassFromUrlParameter();
    $('#classSelect').val(classValue);

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        const codeType = decodedResult.result.format.formatName;
        showResult(codeType, decodedText);
    };

    const config = {
        fps: 4,    // １秒間に何回スキャンするか
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
    }).catch(err => {
        alert("カメラのアクセスに失敗しました: " + err);
    });
});


function showResult(codeType, codeData) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    const performanceData = decode(codeData);

    const classToCheck = Number($('#classSelect').val());
    const timeToCheck = Number($('#timeSelect').val());

    if (IsAuthentic(performanceData)) {
        if (classToCheck === 21) {
            $('#result').removeClass('invalid');
            $("#result h2").text('読み取り成功');
            $('#about-performance').text(performanceData.performance + ' 第' + performanceData.time + '公演');
            $('#for-whom').text(performanceData.grade + '年' + performanceData.classNum + '組' + performanceData.Number + '番 ご' + performanceData.relation + '様');
            $('#timestamp').text('読み取り時刻: ' + timeStr);
            $('.guide-message').text('ようこそ!外苑祭へ。係員の案内に従って、ご入場ください。');
        } else {
            if (performanceData.performanceId === classToCheck && performanceData.time === timeToCheck) {
                $('#result').removeClass('invalid');
                $("#result h2").text('読み取り成功');
                $('#about-performance').text(performanceData.performance + ' 第' + performanceData.time + '公演');
                $('#for-whom').text(performanceData.grade + '年' + performanceData.classNum + '組' + performanceData.Number + '番 ご' + performanceData.relation + '様');
                $('#timestamp').text('読み取り時刻: ' + timeStr);
                $('.guide-message').text('ようこそ!係員の案内に従って、ご入場ください。');
            } else {
                $('#result').addClass('invalid');
                $("#result h2").text('読み取り失敗');
                $('#about-performance').text(performanceData.performance + ' 第' + performanceData.time + '公演');
                $('#for-whom').text('このQRコードは別のクラスまたは公演回のものです。');
                $('#timestamp').text('読み取り時刻: ' + timeStr);
                $('.guide-message').text('正しいクラスか、または正しいQRコードであるかご確認ください。');
            }
        }
    } else {
        $('#result').addClass('invalid');
        $("#result h2").text('読み取り失敗');
        $('#about-performance').text('無効なQRコード');
        $('#for-whom').text('---');
        $('#timestamp').text('読み取り時刻: ' + timeStr);
        $('.guide-message').text('このQRコードは無効です。係員にお問い合わせください。');
    }
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
        time: result % 10,
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
    } if (!(1 <= decodedData.time && decodedData.time <= 8)) {
        return false;
    }
    return true;
}