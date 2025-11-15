const randomCharacter = ['R', 'p', 'D', 'C', 'z', 'H', 'S', 'd', 'J', 'Z',
    's', 'I', 'X', '6', 'G', 'x', 'n', '0', 'a', '3', 'O', '7', 'k', 'E',
    'U', 'w', '2', 'K', 'v', 'T', 'l', 'r', '9', 'q', 'b', '8', 'W', 't',
    'B', 'M', 'c', 'F', 'o', 'Y', 'g', 'h', 'u', 'A', '1', 'y', 'P', 'Q',
    'V', 'N', 'e', 'j', 'm', 'L', '4', '5', 'f', 'i'];

const scannedData = getQRCodeData();

$(function () {
    $('#total-visitors').text(localStorage.getItem('numberOfVisitors') || 0);
    $('#total-scans').text(localStorage.getItem('numberOfScans') || 0);
    $('#reentry-scans').text((localStorage.getItem('numberOfValidScans') || 0) - (localStorage.getItem('numberOfVisitors') || 0));
    $('#invalid-scans').text((localStorage.getItem('numberOfScans') || 0) - (localStorage.getItem('numberOfValidScans') || 0));

    if (scannedData.length === 0) {
        $('#visitors-of-classes').append('<p>スキャン履歴がありません。</p>');
        $('#visitors-of-times').append('<p>スキャン履歴がありません。</p>');
        $('#visitors-relationships').append('<p>スキャン履歴がありません。</p>');
        $('#history-table tbody').append('<tr><td colspan="8">スキャン履歴がありません。</td></tr>');
    } else {
        // クラスごとの来場者数
        for (let classId = 0; classId < 21; classId++) {
            const classVisits = scannedData.filter(data => data.isValid === 'valid' && data.performanceId === classId).length;
            $('#visitors-of-classes').append(`
                <div class="summary-block">
                    <h3>${Math.floor(classId / 7) + 1} - ${classId % 7 + 1}</h3>
                    <p><span class="summary-number small" id="0-visitors">${classVisits}</span>名</p>
                </div>`);
        }

        // 公演回数ごとの来場者数
        for (let timeId = 1; timeId <= 8; timeId++) {
            const timeVisits = scannedData.filter(data => data.isValid === 'valid' && data.times === timeId).length;
            $('#visitors-of-times').append(`
                <div class="summary-block">
                    <h3>第${timeId}公演</h3>
                    <p><span class="summary-number small" id="0-visitors">${timeVisits}</span>名</p>
                </div>`);
        }

        // 関係別来場者数
        const relations = ['本人', '家族', '友人（青高生）', '友人（外部）', 'その他'];
        relations.forEach(relation => {
            const relationVisits = scannedData.filter(data => data.isValid === 'valid' && data.relation === relation).length;
            $('#visitors-relationships').append(`
                <div class="summary-block">
                    <h3>${relation}</h3>
                    <p><span class="summary-number small" id="0-visitors">${relationVisits}</span>名</p>
                </div>`);
        });

        // スキャン履歴リスト
        let count = 1;
        scannedData.forEach(data => {
            let row = `<tr>
            <td>${count}</td>
            <td>${data.timestamp}</td>
            <td>${data.raw}</td>`;
            if (data.isValid === 'valid') {
                row += `<td>${data.id}</td>
                    <td>${data.relation}</td>
                    <td>${data.performance}</td>
                    <td>第${data.times}公演</td>
                    <td class="valid-cell">有効</td>`;
            } else if (data.isValid === 'reentry') {
                row += `<td>${data.id}</td>
                    <td>${data.relation}</td>
                    <td>${data.performance}</td>
                    <td>第${data.times}公演</td>
                    <td class="reentry-cell">再入場</td>`;
            } else {
                row += `<td colspan="4">-</td>
                    <td class="invalid-cell">無効</td>`;
            }
            row += `</tr>`;
            $('#history-table tbody').append(row);
            count++;
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

function getQRCodeData() {
    const result = [];
    const numberOfData = Number(localStorage.getItem('numberOfScans'));
    if (numberOfData === 0) {
        return [];
    }
    for (let i = 0; i < numberOfData; i++) {
        const data = localStorage.getItem(i + 1).split('-');
        const r = {};
        r['timestamp'] = data[0];
        r['isValid'] = data[2];
        if (data[2] === 'invalid') {
            r['raw'] = data[1];
        } else {
            const dataDecoded = decode(data[1]);
            for (const key in dataDecoded) {
                r[key] = dataDecoded[key];
            }
        }
        result.push(r);
    }
    return result;
}