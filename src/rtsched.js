var canvasWidth = 1000;
var canvasHeight = 500;
var maxRows = 5;


function getData() {
    var data = new Array();

    $('#input_data .data_field').each(function() {
        var el = {
            name:$( this ).find( '.thread_name' ).text(),
            priority:$( this ).find( 'input.priority' ).val(),
            period:$( this ).find( 'input.period' ).val(),
            wcet:$( this ).find( 'input.wcet' ).val(),
        };

        if ((el.priority || el.priority == "0") && el.period && el.wcet) {
            data.push(el);
        }
    });

    return data;
}


function drawChart(data) {
    var chart = $('#chart')[0];
    var ctx = chart.getContext("2d");

    var padding = 20
    var zeroChart = { x:padding+40, y:canvasHeight-padding };
    var maxX = { x:canvasWidth-padding, y:zeroChart.y };
    var maxY = { x:zeroChart.x, y:padding };

    /* cartesian plane */
    ctx.moveTo(maxY.x, maxY.y);
    ctx.lineTo(zeroChart.x, zeroChart.y);
    ctx.lineTo(maxX.x, maxX.y);
    ctx.stroke();

    /* row names */
    var rowHeight = (zeroChart.y - maxY.y - 10) / maxRows;

    ctx.font = '30px Arial';
    ctx.textBaseline = 'top';
    var position = parseInt(maxY.y) + 10;
    data.forEach(function(row) {
        ctx.fillText(row.name, padding, position);
        position += rowHeight;
    });
}


function main() {
    data = getData();

    if (data.length == 0) {
        $('#result').html('<p class="error">Nessun dato inserito</p>');
    }
    else {
        $('#result').html(
            '<canvas id="chart" width="' + canvasWidth +
            '" height="' + canvasHeight +
            '" style="border:1px solid #000000;">'
        );
    }
}
