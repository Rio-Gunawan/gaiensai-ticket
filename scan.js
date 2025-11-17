const randomCharacter = ['R', 'p', 'D', 'C', 'z', 'H', 'S', 'd', 'J', 'Z',
    's', 'I', 'X', '6', 'G', 'x', 'n', '0', 'a', '3', 'O', '7', 'k', 'E',
    'U', 'w', '2', 'K', 'v', 'T', 'l', 'r', '9', 'q', 'b', '8', 'W', 't',
    'B', 'M', 'c', 'F', 'o', 'Y', 'g', 'h', 'u', 'A', '1', 'y', 'P', 'Q',
    'V', 'N', 'e', 'j', 'm', 'L', '4', '5', 'f', 'i'];

// Cookieを設定する関数
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

// Cookieを取得する関数
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') { c = c.substring(1, c.length); }
        if (c.indexOf(nameEQ) === 0) { return c.substring(nameEQ.length, c.length); }
    }
    return null;
}

const html5QrCode = new Html5Qrcode("reader");

// 音声ファイルリスト
const soundFiles = [
    'caution.mp3',
    'celebration.mp3',
    'notification.mp3',
    'お進みください1.mp3',
    'お進みください2.mp3',
    'お進みください3.mp3',
    '再入場です1.mp3',
    '再入場です2.mp3',
    '再入場です3.mp3',
    '無効なQR1.mp3',
    '無効なQR2.mp3',
    '無効なQR3.mp3',
    '異なるQR1.mp3',
    '異なるQR2.mp3',
    '異なるQR3.mp3',
];

// 音声キャッシュオブジェクト（最初は空）
const soundCache = {};

// Web Audio API 用のコンテキストとメディアソースキャッシュ（増幅に使用）
let audioContext = null;
const mediaNodes = {}; // filename -> { source, gainNode }

function ensureAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function setupMediaNodesFor(filename) {
    if (!soundCache[filename]) { return null; }
    if (mediaNodes[filename] !== undefined) { return mediaNodes[filename]; }

    try {
        const ctx = ensureAudioContext();
        const source = ctx.createMediaElementSource(soundCache[filename]);
        const gainNode = ctx.createGain();
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        mediaNodes[filename] = { source, gainNode };
        return mediaNodes[filename];
    } catch (e) {
        // ブラウザや環境によっては createMediaElementSource が制限されることがある
        alert('音声の設定に失敗しました。', filename, e);
        mediaNodes[filename] = null;
        return null;
    }
}

/**
 * sounds フォルダ内の全ての音声ファイルを fetch して、キャッシュに保存する
 * @returns {Promise<Object>} キャッシュされた音声オブジェクト
 */
async function loadAllSounds() {
    const soundsFolder = './sounds/';

    for (const file of soundFiles) {
        try {
            const response = await fetch(soundsFolder + file);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
            }
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            soundCache[file] = new Audio(audioUrl);
        } catch (_error) {
            // エラーログ出力は開発時のみ有効にする必要があります
        }
    }

    return soundCache;
}

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
    if (getCookie('classSelect')) {
        return getCookie('classSelect');
    }
    // パラメータが設定されていない場合または無効な場合は校内入場を返す
    return 21;
}

const ScannedQRData = getScannedQRData();

$(async function () {
    $('#result').hide();
    $('#input-directory-dialog').hide();
    $('.film').removeClass('show');
    $('.attribute').hide();
    $('#settings').hide();

    // --- 設定をCookieから読み込む ---
    const settingsMap = {
        'timesSelect': getCookie('timesSelect'),
        'sound-switch': getCookie('sound-switch'),
        'soundSelect': getCookie('soundSelect'),
        'attributeSelect': getCookie('attributeSelect'),
        'attributeCheck': getCookie('attributeCheck')
    };

    if (settingsMap['timesSelect']) { $('#timesSelect').val(settingsMap['timesSelect']); }
    if (settingsMap['sound-switch']) { $('#sound-switch').prop('checked', settingsMap['sound-switch'] === 'true'); }
    if (settingsMap['soundSelect']) { $('#soundSelect').val(settingsMap['soundSelect']); }
    if (settingsMap['attributeSelect']) { $('#attributeSelect').val(settingsMap['attributeSelect']); }
    if (settingsMap['attributeCheck']) { $('#attributeCheck').prop('checked', settingsMap['attributeCheck'] === 'true'); }


    // --- 設定が変更されたらCookieに保存する ---
    const cookieExpireDays = 365;
    $('#classSelect').on('change', function () { setCookie('classSelect', $(this).val(), cookieExpireDays); });
    $('#timesSelect').on('change', function () { setCookie('timesSelect', $(this).val(), cookieExpireDays); });
    $('#sound-switch').on('change', function () { setCookie('sound-switch', $(this).prop('checked'), cookieExpireDays); });
    $('#soundSelect').on('change', function () { setCookie('soundSelect', $(this).val(), cookieExpireDays); });
    $('#attributeSelect').on('change', function () { setCookie('attributeSelect', $(this).val(), cookieExpireDays); });
    $('#attributeCheck').on('change', function () { setCookie('attributeCheck', $(this).prop('checked'), cookieExpireDays); });


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

    // 音声ファイルを全てロードしておく
    await loadAllSounds();

    // Safari判定
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    function startCamera() {
        html5QrCode.start(
            { facingMode: facingMode },
            config,
            qrCodeSuccessCallback
        ).catch(err => {
            alert("カメラのアクセスに失敗しました: " + err);
        });
    }

    if (isSafari) {
        // Safariの場合: オーバーレイを表示し、ボタンクリックを待つ
        $('#start-scan-overlay').css('display', 'flex');

        $('#start-scan-button').on('click', function () {
            // オーディオコンテキストのロックを解除
            const ctx = ensureAudioContext();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            // 無音を再生して、再生システムを完全に起動させる
            const silentSound = soundCache['celebration.mp3'];
            if (silentSound) {
                silentSound.volume = 0;
                silentSound.play().then(() => { silentSound.pause(); silentSound.volume = 1; }).catch(() => {});
            }
            startCamera();
            $('#start-scan-overlay').fadeOut(300);
        });
    } else {
        // Safari以外の場合: 直接カメラを起動
        startCamera();
    }

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

    // 直接入力ダイアログを開く
    $('#input_directory').on('click', function () {
        $('#input-directory-dialog').fadeIn(200);
        $('.film').addClass('show');
    });

    // 直接入力ダイアログを閉じる
    $('#close-input-directory-window').on('click', function () {
        $('#input-directory-dialog').fadeOut(200);
        $('.film').removeClass('show');
    });

    $('#input-directory-summit').on('click', function () {
        const inputDirectory = $('#qrInput').val();
        $('#input-directory-dialog').hide();
        $('.film').removeClass('show');
        $('#qrInput').val('');
        showResult('', inputDirectory);
    });

    // 設定ダイアログを開く
    $('#scan_settings').on('click', function () {
        $('#settings').fadeIn(200);
        $('.film').addClass('show');
    });

    // 設定ダイアログを閉じる
    $('#close-settings-window').on('click', function () {
        $('#settings').fadeOut(200);
        $('.film').removeClass('show');
    });

    // 属性表示設定の連動
    $('#attributeSelect').on('change', function () {
        // selectの値が'3'（オフ）の時、チェックボックスをdisabledにする
        const isDisabled = $(this).val() === '3';
        $('#attributeCheck').prop('disabled', isDisabled);
        setCookie('attributeSelect', $(this).val(), 365); // Cookieにも保存
    }).trigger('change'); // 初期表示時にも実行
});


function showResult(codeType, codeData) {
    html5QrCode.pause();

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

                playSoundForCategory('再入場です');

                if (performanceData.relation === '家族' && ($('#attributeSelect').val() === '1' || $('#attributeSelect').val() === '2') && $('#attributeCheck').prop('checked')) {
                    $('.attribute').fadeIn(100);
                    $('.attribute').addClass('g' + performanceData.grade);
                    $('.attribute-grade span').text(performanceData.grade);
                }

                localStorage.setItem(localStorage.getItem('numberOfScans').toString(), dateTimeStr + '-' + codeData + '-' + classToCheck + '-' + timesToCheck + '-reentry');
            } else {
                $('#result').removeClass('invalid reentry');
                $('.film').addClass('success');
                $("#result h2").text('読み取り成功');
                $('#about-performance').text(performanceData.performance + ' 第' + performanceData.times + '公演');
                $('#for-whom').text(performanceData.grade + '年' + performanceData.classNum + '組' + performanceData.Number + '番 ご' + performanceData.relation + '様');
                $('#timestamp').text('読み取り日時: ' + dateTimeStr);
                $('.guide-message').text('ようこそ!外苑祭へ。係員の案内に従って、ご入場ください。');

                playSoundForCategory('お進みください');

                if (performanceData.relation === '家族' && ($('#attributeSelect').val() === '1' || $('#attributeSelect').val() === '2')) {
                    $('.attribute').fadeIn(100);
                    $('.attribute').addClass('g' + performanceData.grade);
                    $('.attribute-grade span').text(performanceData.grade);
                }

                localStorage.setItem('numberOfVisitors', (Number(localStorage.getItem('numberOfVisitors') || '0') + 1).toString());
                localStorage.setItem(localStorage.getItem('numberOfScans').toString(), dateTimeStr + '-' + codeData + '-' + classToCheck + '-' + timesToCheck + '-valid');
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

                    playSoundForCategory('再入場です');

                    if (performanceData.relation === '家族' && $('#attributeSelect').val() === '1' && $('#attributeCheck').prop('checked')) {
                        $('.attribute').fadeIn(100);
                        $('.attribute').addClass('g' + performanceData.grade);
                        $('.attribute-grade span').text(performanceData.grade);
                    }

                    localStorage.setItem(localStorage.getItem('numberOfScans').toString(), dateTimeStr + '-' + codeData + '-' + classToCheck + '-' + timesToCheck + '-reentry');
                } else {
                    $('#result').removeClass('invalid reentry');
                    $('.film').addClass('success');
                    $("#result h2").text('読み取り成功');
                    $('#about-performance').text(performanceData.performance + ' 第' + performanceData.times + '公演');
                    $('#for-whom').text(performanceData.grade + '年' + performanceData.classNum + '組' + performanceData.Number + '番 ご' + performanceData.relation + '様');
                    $('#timestamp').text('読み取り日時: ' + dateTimeStr);
                    $('.guide-message').text('ようこそ!外苑祭へ。係員の案内に従って、ご入場ください。');
                    localStorage.setItem('numberOfVisitors', (Number(localStorage.getItem('numberOfVisitors') || '0') + 1).toString());

                    playSoundForCategory('お進みください');

                    if (performanceData.relation === '家族' && $('#attributeSelect').val() === '1') {
                        $('.attribute').fadeIn(100);
                        $('.attribute').addClass('g' + performanceData.grade);
                        $('.attribute-grade span').text(performanceData.grade);
                    }

                    localStorage.setItem(localStorage.getItem('numberOfScans').toString(), dateTimeStr + '-' + codeData + '-' + classToCheck + '-' + timesToCheck + '-valid');
                }

                ScannedQRData.push(codeData);
                localStorage.setItem('numberOfValidScans', (Number(localStorage.getItem('numberOfValidScans') || '0') + 1).toString());
            } else {
                $('#result').addClass('invalid').removeClass('reentry');
                $('.film').addClass('error');
                $("#result h2").text('読み取り失敗');
                $('#about-performance').text(performanceData.performance + ' 第' + performanceData.times + '公演');
                $('#for-whom').text('このQRコードは別のクラスまたは公演回のものです。');
                $('#timestamp').text('読み取り日時: ' + dateTimeStr);
                $('.guide-message').text('正しいクラス、正しいQRコードであるかご確認ください。');

                playSoundForCategory('異なるQR');

                localStorage.setItem(localStorage.getItem('numberOfScans').toString(), dateTimeStr + '-' + codeData + '-' + classToCheck + '-' + timesToCheck + '-invalid');
            }
        }
    } else {
        $('#result').addClass('invalid').removeClass('reentry');
        $('.film').addClass('error');
        $("#result h2").text('読み取り失敗');
        $('#about-performance').text('無効なQRコード');
        $('#for-whom').text('---');
        $('#timestamp').text('読み取り日時: ' + dateTimeStr);
        $('.guide-message').text('このQRコードは無効です。係員にお問い合わせください。');

        playSoundForCategory('無効なQR');

        localStorage.setItem(localStorage.getItem('numberOfScans').toString(), dateTimeStr + '-' + codeData + '-' + classToCheck + '-' + timesToCheck + '-invalid');
    }
    $('#result').fadeIn(100);
    setTimeout(() => {
        $('#result').fadeOut(500);
        $('.film').removeClass('success error');
        $('.attribute').hide().removeClass('g1 g2 g3');
        html5QrCode.resume();
    }, 3000);

}

/**
 * 指定された音声ファイルを再生する
 * @param {string} filename - 再生する音声ファイル名（拡張子含む）
 */
function playSound(filename, volumeMultiplier = 1) {
    const audio = soundCache[filename];
    if (!audio) {
        return;
    }

    audio.currentTime = 0; // 音声を最初から再生
    // HTMLAudioElement.volume は 0.0 - 1.0 の範囲なので、1 を超える増幅には Web Audio API を使う
    if (volumeMultiplier > 1) {
        const nodes = setupMediaNodesFor(filename);
        try {
            const ctx = ensureAudioContext();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch(() => { });
            }

            if (nodes && nodes.gainNode) {
                audio.volume = 1; // 要素自体は最大にしておく
                nodes.gainNode.gain.value = volumeMultiplier;
                audio.play().catch(() => { });
                return;
            }
        } catch (_e) {
            // Web Audio のセットアップに失敗したらフォールバックする
        }
    }

    // フォールバック: HTMLAudioElement.volume を 0-1 にクランプして再生
    audio.volume = Math.max(0, Math.min(volumeMultiplier, 1));
    audio.play().catch(() => { });
}

/**
 * 選択された音声番号に基づいて、該当する音声を再生する
 * 最初に効果音を再生してから、カテゴリ別の音声を再生する
 * @param {string} category - 再生する音声のカテゴリ (例: 「お進みください」, 「再入場です」, 「異なるQR」, 「無効なQR」)
 */
function playSoundForCategory(category) {
    if (!$('#sound-switch').prop('checked')) {
        return;
    }
    const soundNumber = $('#soundSelect').val();

    // categoryに応じて効果音を決定
    let effectSound = '';
    if (category === 'お進みください') {
        effectSound = 'celebration.mp3';
    } else if (category === '再入場です') {
        effectSound = 'notification.mp3';
    } else if (category === '無効なQR' || category === '異なるQR') {
        effectSound = 'caution.mp3';
    }

    if (soundNumber === 'sound-effect-only') {
        const effectAudio = soundCache[effectSound];
        effectAudio.currentTime = 0;
        effectAudio.onended = () => { };
        effectAudio.play();
        return;
    }

    // 効果音を再生してから、カテゴリ別の音声を再生
    if (effectSound && soundCache[effectSound]) {
        const effectAudio = soundCache[effectSound];
        effectAudio.currentTime = 0;

        // 効果音の終了を待ってからカテゴリ別音声を再生
        effectAudio.onended = () => {
            if (category) {
                const soundFileName = category + soundNumber + '.mp3';
                playSound(soundFileName, 2);
            }
        };

        effectAudio.play().catch(_err => {
            // 再生に失敗した場合でもカテゴリ別音声を再生
            if (category) {
                const soundFileName = category + soundNumber + '.mp3';
                playSound(soundFileName, 2);
            }
        });
    } else {
        // 効果音がない場合はカテゴリ別音声を直接再生
        if (category) {
            const soundFileName = category + soundNumber + '.mp3';
            playSound(soundFileName, 2);
        }
    }
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