
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

}
