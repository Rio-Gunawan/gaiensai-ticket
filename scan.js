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

const ScannedQRData = getScannedQRData();

$(function () {
    $('#result').hide();

    let facingMode = 'user';

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
        { facingMode: facingMode },
        config,
        qrCodeSuccessCallback
    ).then(() => {
    }).catch(err => {
        alert("カメラのアクセスに失敗しました: " + err);
    });

    $('#camera_switch').on('click', function () {
        html5QrCode.stop().then(() => {
            if (facingMode === 'user') {
                facingMode = 'environment';
            } else {
                facingMode = 'user';
            }

            html5QrCode.start(
                { facingMode: facingMode },
                config,
                qrCodeSuccessCallback
            ).then(() => {
            }).catch(err => {
                alert("カメラのアクセスに失敗しました: " + err);
            });
        }).catch(err => {
            alert("カメラの停止に失敗しました: " + err);
        });
    });
});


function showResult(codeType, codeData) {
    html5QrCode.pause().catch(_err => {
        // スキャンの一時停止失敗時は無視
    });

    const now = new Date();
    const dateTimeStr = now.toLocaleString();

    const performanceData = decode(codeData);

    const classToCheck = Number($('#classSelect').val());
    const timesToCheck = Number($('#timesSelect').val());

    localStorage.setItem('numberOfScans', (Number(localStorage.getItem('numberOfScans') || '0') + 1).toString());

    if (IsAuthentic(performanceData)) {
        if (classToCheck === 21) {
            if (ScannedQRData.includes(codeData)) {
                $('#result').removeClass('invalid').addClass('reentry');
                $("#result h2").text('読み取り成功(再入場)');
                $('#about-performance').text(performanceData.performance + ' 第' + performanceData.times + '公演');
                $('#for-whom').text(performanceData.grade + '年' + performanceData.classNum + '組' + performanceData.Number + '番 ご' + performanceData.relation + '様 (再入場)');
                $('#timestamp').text('読み取り日時: ' + dateTimeStr);
                $('.guide-message').text('ようこそ!外苑祭へ。係員の案内に従って、ご入場ください。');

                localStorage.setItem(localStorage.getItem('numberOfScans').toString(), dateTimeStr + '-' + codeData + '-reentry');
            } else {
                $('#result').removeClass('invalid reentry');
                $("#result h2").text('読み取り成功');
                $('#about-performance').text(performanceData.performance + ' 第' + performanceData.times + '公演');
                $('#for-whom').text(performanceData.grade + '年' + performanceData.classNum + '組' + performanceData.Number + '番 ご' + performanceData.relation + '様');
                $('#timestamp').text('読み取り日時: ' + dateTimeStr);
                $('.guide-message').text('ようこそ!外苑祭へ。係員の案内に従って、ご入場ください。');

                localStorage.setItem('numberOfVisitors', (Number(localStorage.getItem('numberOfVisitors') || '0') + 1).toString());
                localStorage.setItem(localStorage.getItem('numberOfScans').toString(), dateTimeStr + '-' + codeData + '-valid');
            }

            ScannedQRData.push(codeData);
            localStorage.setItem('numberOfValidScans', (Number(localStorage.getItem('numberOfValidScans') || '0') + 1).toString());
        } else {
            if (performanceData.performanceId === classToCheck && performanceData.times === timesToCheck) {
                if (ScannedQRData.includes(codeData)) {
                    $('#result').removeClass('invalid').addClass('reentry');
                    $("#result h2").text('読み取り成功(再入場)');
                    $('#about-performance').text(performanceData.performance + ' 第' + performanceData.times + '公演');
                    $('#for-whom').text(performanceData.grade + '年' + performanceData.classNum + '組' + performanceData.Number + '番 ご' + performanceData.relation + '様 (再入場)');
                    $('#timestamp').text('読み取り日時: ' + dateTimeStr);
                    $('.guide-message').text('ようこそ!外苑祭へ。係員の案内に従って、ご入場ください。');

                    localStorage.setItem(localStorage.getItem('numberOfScans').toString(), dateTimeStr + '-' + codeData + '-reentry');
                } else {
                    $('#result').removeClass('invalid reentry');
                    $("#result h2").text('読み取り成功');
                    $('#about-performance').text(performanceData.performance + ' 第' + performanceData.times + '公演');
                    $('#for-whom').text(performanceData.grade + '年' + performanceData.classNum + '組' + performanceData.Number + '番 ご' + performanceData.relation + '様');
                    $('#timestamp').text('読み取り日時: ' + dateTimeStr);
                    $('.guide-message').text('ようこそ!外苑祭へ。係員の案内に従って、ご入場ください。');
                    localStorage.setItem('numberOfVisitors', (Number(localStorage.getItem('numberOfVisitors') || '0') + 1).toString());

                    localStorage.setItem(localStorage.getItem('numberOfScans').toString(), dateTimeStr + '-' + codeData + '-valid');
                }

                ScannedQRData.push(codeData);
                localStorage.setItem('numberOfValidScans', (Number(localStorage.getItem('numberOfValidScans') || '0') + 1).toString());
            } else {
                $('#result').addClass('invalid').removeClass('reentry');
                $("#result h2").text('読み取り失敗');
                $('#about-performance').text(performanceData.performance + ' 第' + performanceData.times + '公演');
                $('#for-whom').text('このQRコードは別のクラスまたは公演回のものです。');
                $('#timestamp').text('読み取り日時: ' + dateTimeStr);
                $('.guide-message').text('正しいクラスか、または正しいQRコードであるかご確認ください。');

                localStorage.setItem(localStorage.getItem('numberOfScans').toString(), dateTimeStr + '-' + codeData + '-invalid');
            }
        }
    } else {
        $('#result').addClass('invalid').removeClass('reentry');
        $("#result h2").text('読み取り失敗');
        $('#about-performance').text('無効なQRコード');
        $('#for-whom').text('---');
        $('#timestamp').text('読み取り日時: ' + dateTimeStr);
        $('.guide-message').text('このQRコードは無効です。係員にお問い合わせください。');

        localStorage.setItem(localStorage.getItem('numberOfScans').toString(), dateTimeStr + '-' + codeData + '-invalid');
    }
    $('#result').fadeIn(100);
    // 読み取り音を再生（オプション）
    playBeepSound();
    setTimeout(() => {
        $('#result').fadeOut(500);
        html5QrCode.resume().catch(_err => {
            // スキャンの再開失敗時は無視
        });
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
    gainNode.gain.value = 0.5; // 音量

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
        times: result % 10,
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
    } if (!(1 <= decodedData.times && decodedData.times <= 8)) {
        return false;
    }
    return true;
}

function getScannedQRData() {
    const qrDataList = [];
    const numberOfScans = Number(localStorage.getItem('numberOfScans') || '0');

    for (let i = 1; i <= numberOfScans; i++) {
        const item = localStorage.getItem(i.toString()).split('-')[1];
        if (item) {
            qrDataList.push(item);
        }
    }
    return qrDataList;
}