const randomCharacter = ['R', 'p', 'D', 'C', 'z', 'H', 'S', 'd', 'J', 'Z',
        's', 'I', 'X', '6', 'G', 'x', 'n', '0', 'a', '3', 'O', '7', 'k', 'E',
        'U', 'w', '2', 'K', 'v', 'T', 'l', 'r', '9', 'q', 'b', '8', 'W', 't',
        'B', 'M', 'c', 'F', 'o', 'Y', 'g', 'h', 'u', 'A', '1', 'y', 'P', 'Q',
        'V', 'N', 'e', 'j', 'm', 'L', '4', '5', 'f', 'i'];

$(function () {
    $("#outputs").hide();
    $("#copy-succeed").hide();
});
$('#generate').on('click', function() {
    const grade = Number($('#grade').val());
    const classNum = Number($('#class').val());
    const number = Number($('#number').val());

    const relation = $('#relation').val();
    const performance = $('#performance').val();
    const time = $('#time').val();

    if (!grade || !classNum || !number || !relation || !performance || !time) {
        alert('すべてのフィールドを入力してください。');
        return;
    }

    const idNum = grade * 1000 + classNum * 100 + number;
    const ticketData = idNum * 10000 + Number(relation) * 1000 + Number(performance) * 10 + Number(time);

    let QRData = randomCharacter[(grade * classNum * number) % 62] + encrypt(ticketData);
    QRData = QRData + makeCheckDigit(QRData);

    window.location.href = './show.html?id=' + QRData;
});

function encrypt(data) {
    let result = '';
    while (data >= 62) {
        const remainder = data % 62;
        result = randomCharacter[remainder] + result;
        data = Math.floor(data / 62);
    }
    result = randomCharacter[data] + result;
    return result;
}

function makeCheckDigit(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        const index = randomCharacter.indexOf(data[i]);
        sum += index * (i + 1);
    }
    const checkDigitIndex = sum % 62;
    return randomCharacter[checkDigitIndex];
}