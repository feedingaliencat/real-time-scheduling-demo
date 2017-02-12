console.log('js imported');

var msInterval = 250;

var canvasWidth = 1000;
var canvasHeight = 500;
var maxRows = 5;


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
    console.log('form!');

    var data = new Array();

    $('#input_data .data_field').each(function() {
        var el = {
            name:$( this ).find( '.thread_name' ).text(),
            priority:parseInt($( this ).find( 'input.priority' ).val()),
            period:parseInt($( this ).find( 'input.period' ).val()),
            wcet:parseInt($( this ).find( 'input.wcet' ).val()),
        };

        if ((el.priority || el.priority == "0") && el.period && el.wcet) {
            el['status'] = {
                remaining:0,
                index:data.length,
            };
            data.push(el);
        }
    });

    console.log('data: ', data);
    return data;
}


function whosNext(data, time) {
    // check deadlines
    try {
        var whosReady = new Array();

        data.forEach(function(thread) {
            var deadline = !(time % thread.period);
            if (deadline) {
                /* TODO: draw deadlines */
                if (thread['status']['remaining'] > 0) {
                    debugger;
                    throw thread.name;
                }
                else {
                    thread['status']['remaining'] += thread.wcet;
                }
            }

            if (thread['status']['remaining'] > 0) {
                whosReady.push(thread);
            }
        });
    }
    catch(err) {
        return 'failure';
    }

    /* FPS */
    winner = null;
    if (whosReady.length == 0) {
        return 'idle';
    }
    whosReady.forEach(function(thread) {
        if (winner === null || thread.priority < winner.priority) {
            winner = thread;
        }
    })
    winner['status']['remaining']--;
    return winner['status']['index'];
}


function drawChart(data) {
    var chart = $('#chart')[0];
    var ctx = chart.getContext("2d");

    var padding = 20
    var zeroChart = { x:padding+40, y:canvasHeight-padding };
    var maxX = { x:canvasWidth-padding, y:zeroChart.y };
    var maxY = { x:zeroChart.x, y:padding };
    var xAxisHeight = maxX.x - zeroChart.x - 10;
    var yAxisHeight = zeroChart.y - maxY.y - 10;

    /* cartesian plane */
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
        ctx.fillText(row.name, padding, position + 15);
        position += rowHeight;
    });

    /* rectangles */
    var periods = new Array();
    data.forEach(function(row) { periods.push(row.period); });
    var totalTime = leastCommonMultiple(periods);

    var rectWidth = xAxisHeight / totalTime;
    var rectHeight = rowHeight - 15;

    ctx.fillStyle = '#00CC66';

    var time = 0;
    var animation = setInterval(frame, msInterval);
    function frame() {
        if (time >= totalTime) {
            clearInterval(animation);
            /* TODO: print ok */
            console.log('ok!!');
        }
        else {
            nextIndex = whosNext(data, time);
            console.log('time: ', time);
            console.log('next: ', nextIndex);
            if (nextIndex == 'failure') {
                clearInterval(animation);
                /* TODO: print fail */
                console.log('failure :(');
            }
            else if (nextIndex == 'idle') {
                /* TODO */
            }
            else {
                var row = maxY.y + 10 + nextIndex*rowHeight;
                ctx.fillRect(
                    zeroChart.x + time*rectWidth,
                    row,
                    rectWidth, rectHeight);
            }
            time++;
        }
    }
}


function main() {
    data = getData();

    if (data.length == 0) {
        $('#result').html('<p class="error">Nessun dato inserito</p>');
    }
    /*else {*/
        $('#result').html(
            '<canvas id="chart" width="' + canvasWidth +
            '" height="' + canvasHeight +
            '" style="border:1px solid #000000;">'
        );
        drawChart(data);
    /*}*/

    console.log('done');
}