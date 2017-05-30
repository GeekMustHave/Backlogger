$('#mdlViewDetails').on('show.bs.modal', function (event) {
    var retData;
    var button = $(event.relatedTarget); // Button that triggered the modal
    var backlogId = button.data('backlogid'); // Extract info from data-* attributes
    // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
    // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
    $.ajax({
            type: "GET",
            url: "/backlogs/" + backlogId,
            dataType: "json"
        }).done(function(response) {
        //d.resolve(response);
        //retData = response;
        var modal = $('#mdlViewDetails');
        var date = new Date(response.insertdate);
        var resolvedDate = '';

        $('#btnUpdateResolved').attr('data-backlogid', backlogId);
        if (response.resolveddate != null){
            resolvedDate = getDateFormatted(new Date(response.resolveddate));
            $('#btnUpdateResolved').hide();
        }
        else
            $('#btnUpdateResolved').show();
        modal.find('.modal-title').text('Backlog Details');
        modal.find('.modal-body #backlogDate').text(getDateFormatted(date));
        modal.find('.modal-body #resolvedDate').text(resolvedDate);
        modal.find('.modal-body #backlogPerson').text(response.person);
        modal.find('.modal-body #backlogFuncArea').text(response.functionalarea);
        var txtHtml = response.idea.replace(/(\r\n|\n|\r)/g,"<br />");
        modal.find('.modal-body #backlogIdea').html(txtHtml);
    });
});

function getDateFormatted(date){
    var month = date.getMonth() + 1;
    return (month.length > 1 ? month : "0" + month) + "/" + date.getDate() + "/" + date.getFullYear();
}