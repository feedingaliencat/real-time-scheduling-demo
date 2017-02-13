var msInterval = null;

var canvasWidth = 1000;
var canvasHeight = 500;
var maxRows = 4;

var EXAMPLES = [
    {
        algorithm:'fps_rate_monotonic',
        data:[[0, 10, 6], [1, 15, 3]],
    },
    {
        algorithm:'fps_rate_monotonic',
        data:[[0, 10, 6], [1, 15, 8]],
    },
    {
        algorithm:'edf',
        data:[[0, 40, 20], [1, 60, 22], [2, 80, 8], [3, 120, 4]],
    },
];


function leastCommonMultiple(numbers) {

    function lcm(x, y) {
        return Math.abs((x * y) / gcd(x, y));
    }

    function gcd(x, y) {
        x = Math.abs(x);
        y = Math.abs(y);

        while (y) {
            var t = y;
            y = x % y;
            x = t;
        }
        return x;
    }

    result = numbers.pop();
    while (numbers.length > 0) {
        result = lcm(result, numbers.pop());
    }
    return result;
}


function getData() {
    var data = new Array();

    $('#input_data .data_field').each(function() {
        var el = {
            name:$( this ).find( '.thread_name' ).text(),
            priority:parseInt($( this ).find( 'input.priority' ).val()),
            period:parseInt($( this ).find( 'input.period' ).val()),
            wcet:parseInt($( this ).find( 'input.wcet' ).val()),
        };

        if ((el.priority || el.priority == "0") && el.period && el.wcet) {
            if(el.wcet > el.period) {
                throw 'WCET non può essere maggiore di T';
            }

            // The analyzed row is valid. Add some more info and push
            el['status'] = {
                remaining:0,
                active:false,
                index:data.length,
            };
            data.push(el);
        }
    });
    var options = new Object();
    options['algorithm'] = $('input[name="algorithm"]:checked').val();
    options['preemption'] = $('#opt-preemption').is(':checked');
    speed = $('#opt-speed').val();
    msInterval = 500 - speed;

    return { data:data, options:options };
}


function whoIsNext(data, options, time) {
    // check deadlines and if a thread if active
    var deadlines = new Array();
    var event = false;

    try {
        var whoIsReady = new Array();
        var activeThread = null;

        data.forEach(function(thread) {
            var deadline = !(time % thread.period);
            if (deadline) {
                if (thread['status']['remaining'] > 0) {
                    deadlines = [thread['status']['index']];
                    event = true;
                    throw thread;
                }
                else {
                    deadlines.push(thread['status']['index']);
                    thread['status']['remaining'] += thread.wcet;
                }
            }

            if (thread['status']['active']) {
                activeThread = thread;
            }
            if (thread['status']['remaining'] > 0) {
                whoIsReady.push(thread);
            }
        });
    }
    catch(failingThread) {
        return {
            ok:false,
            index:failingThread['status']['index'],
            thread:failingThread,
            // `deadlines` is inizialized in any case
            deadlines:deadlines,
            event:event,
        };
    }

    // idle case
    if (whoIsReady.length == 0) {
        return { ok:true, idle:true, deadlines:deadlines, event:event };
    }

    // apply the algorithms
    function fps() {
        winner = null;
        whoIsReady.forEach(function(thread) {
            if (winner === null || thread.priority < winner.priority) {
                winner = thread;
            }
        });
        return winner
    }

    function rms() {
        winner = null;
        whoIsReady.forEach(function(thread) {
            if (
                    winner === null ||
                    thread.period < winner.period ||
                    (thread.period == winner.period && thread.priority < winner.priority) ){
                winner = thread;
            }
        });
        return winner
    }

    function edf() {
        winner = null;
        whoIsReady.forEach(function(thread) {
            /*
                nextDeadline = time - time%period + period;
                distance = nextDeadlin - time;
            */
            thread['status']['deadlineDistance'] = thread.period - time%thread.period;
            if (winner === null) {
                winner = thread;
            }
            else {
                var tlife = thread['status']['deadlineDistance'];
                var wlife = winner['status']['deadlineDistance'];
                if (
                        tlife < wlife ||
                        ( tlife == wlife && thread.priority < winner.priority)) {
                    winner = thread;
                }
            }
        });
        return winner
    }

    if (activeThread && !options['preemption']) {
        winner = activeThread;
    }
    else if (options['algorithm'] == 'fps') {
        winner = fps();
    }
    else if (options['algorithm'] == 'fps_rate_monotonic') {
        winner = rms();
    }
    else if (options['algorithm'] == 'edf') {
        winner = edf();
    }
    else {
        throw 'Unexpected algorithm';
    }

    winner['status']['remaining']--;
    if (winner['status']['active']) {
        // a new thread is executing, now
        event = true;
    }
    winner['status']['active'] = winner['status']['remaining'] > 0;
    if (!winner['status']['active']) {
        event = true;
    }

    return {
        ok:true,
        index:winner['status']['index'],
        deadlines:deadlines,
        event:event
    };
}


function drawChart(data, options) {
    var chart = $('#chart')[0];
    var ctx = chart.getContext("2d");

    var padding = 20
    var zeroChart = { x:padding+40, y:canvasHeight-padding };
    var maxX = { x:canvasWidth-padding, y:zeroChart.y };
    var maxY = { x:zeroChart.x, y:padding };
    var xAxisHeight = maxX.x - zeroChart.x - 10;
    var yAxisHeight = zeroChart.y - maxY.y - 10;

    /* cartesian plane */
    ctx.strokeStyle = '#006666';
    ctx.lineCap="round";
    ctx.lineWidth = 4;
    ctx.moveTo(maxY.x, maxY.y);
    ctx.lineTo(zeroChart.x, zeroChart.y);
    ctx.lineTo(maxX.x, maxX.y);
    ctx.stroke();

    /* row names */
    var rowHeight = yAxisHeight / maxRows;

    ctx.font = '30px Arial';
    ctx.textBaseline = 'top';
    var position = maxY.y + 10;
    data.forEach(function(row) {
        ctx.fillText(row.name, padding, position + 30);
        position += rowHeight;
    });

    /* rectangles */
    var periods = new Array();
    data.forEach(function(row) { periods.push(row.period); });
    var totalTime = leastCommonMultiple(periods);

    var rectWidth = xAxisHeight / totalTime;
    var rectMargin = 16;
    var rectHeight = rowHeight - rectMargin;

    var time = 0;
    var animation = setInterval(frame, msInterval);
    function frame() {
        next = whoIsNext(data, options, time);
        if (!next['ok']) {
            var row = maxY.y + 10 + next['index']*rowHeight;
            ctx.fillStyle = '#FF3333';
            ctx.fillRect(
                zeroChart.x + time*rectWidth,
                row,
                rectWidth, rectHeight);

            clearInterval(animation);
            $('#result p').text(
                'Deadline non rispettata per il thread _' +
                next['thread']['name'] + '_.');
        }
        else if (time >= totalTime) {
            clearInterval(animation);
            $('#result p').text('OK!');
        }
        else if (next['idle']) {
            ctx.fillStyle = '#CCE5FF';
            ctx.fillRect(
                zeroChart.x + time*rectWidth,
                maxY.y,
                rectWidth, zeroChart.y - maxY.y - 2);
        }
        else {
            var row = maxY.y + 10 + next['index']*rowHeight;
            ctx.fillStyle = '#00CC66';
            ctx.fillRect(
                zeroChart.x + time*rectWidth,
                row,
                rectWidth, rectHeight);
        }

        if (!next['event']) {
            drawCurrentTime();
        }
        if (time >= totalTime) {
            var indexes = new Array();
            data.forEach(function(row) {
                indexes.push(row['status']['index']);
            });
            drawDeadlines(indexes);
        }
        else {
            drawDeadlines(next['deadlines']);
                time++;
        }
    }

    function drawDeadlines(indexes) {
        if (indexes.length > 0) {
            drawCurrentTime();
        }
        indexes.forEach(function(index) {
            ctx.moveTo(
                zeroChart.x + time*rectWidth,
                maxY.y + 12 + index*rowHeight - rectMargin/2);
            ctx.lineTo(
                zeroChart.x + time*rectWidth,
                maxY.y + (index + 1)*rowHeight + rectMargin/2 - 8);
            ctx.stroke();
        });
    }

    function drawCurrentTime() {
        var timeCaption = chart.getContext("2d");
        timeCaption.fillStyle = '#000000';
        timeCaption.font = '12px Arial';
        timeCaption.textBaseline = 'top';
        timeCaption.fillText(
            time,
            zeroChart.x + time*rectWidth - 5,
            zeroChart.y + 5 );
    }
}


function main() {
    try {
        formData = getData();
    }
    catch(message) {
        $('#result').html('<p class="error">' + message + '</p>');
        return;
    }

    if (formData['data'].length == 0) {
        $('#result').html('<p class="error">Nessun dato inserito</p>');
    }
    else if (!formData['options']['algorithm']) {
        $('#result').html('<p class="error">Selezionare un algoritmo</p>');
    }
    else {
        $('#result').html(
            '<canvas id="chart" width="' + canvasWidth +
            '" height="' + canvasHeight +
            '" style="border:1px solid #000000;"></canvas>' +
            '<p></p>'
        );
        drawChart(formData['data'], formData['options']);
    }
}


function loadExample() {
    index = $('input[name="example"]:checked').val();
    if (index === undefined) {
        return;
    }

    example = EXAMPLES[index];
    $('input[name="algorithm"][value="' + example.algorithm + '"]').click();

    var threadFields = $('#input_data .data_field');
    for (var i = 0; i < maxRows; i++) {
        row = example.data[i];
        if (!row) {
            row = ['', '', ''];
        }
        threadFields.eq(i).find( 'input.priority' ).val(row[0]);
        threadFields.eq(i).find( 'input.period' ).val(row[1]);
        threadFields.eq(i).find( 'input.wcet' ).val(row[2]);
    }
}
