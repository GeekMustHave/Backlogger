$(function() {
    PresetControls();
    //Form submit Ajax call
    $("#btnFilterBacklog").click(function(event) {
        event.preventDefault();
        FilterBacklogs();
    });
    //Form submit Ajax call
    $("#btnResetFilterBacklog").click(function(event) {
        event.preventDefault();
        PresetControls();
        FilterBacklogs();
    });
});
function FilterBacklogs(){
    var data = {};
    data.person = $('#menuPersons').val();
    data.functionalarea = $('#menuFunctionalAreas').val();
    data.idea = $('#inpIdea').val();
    data.daterange = $('#inpBacklogDateRange').val();
    data.sortfield = $('#menuSortOn').val();
    data.sortorder = $('#menuSortOrder').val();
    data.resolved = $('#menuResolved').val();
    console.log(data);
    $.ajax({
        type: 'GET',
        url: '/backlogsfilterandsort',
        data: data,
        dataType: 'json'
    }).done(function (response){
        //template comes from server.
        var html = ejs.render(response.template, {backlogs: response.backlogs });
        $('#divBacklogRepeater').html(html);
    }); 
}
function PresetControls(){
    PresetDateRange('inpBacklogDateRange');
    RefreshPersons();
    RefreshFunctionalAreas();
    $('#inpIdea').val('');
    $("#menuResolved").val('').selectpicker('refresh');
    $("#menuSortOn").val('').selectpicker('refresh');
    $("#menuSortOrder").val('').selectpicker('refresh');
    $('#menuPersons').val('').selectpicker('refresh');
    $('#menuFunctionalAreas').val('').selectpicker('refresh');
}
function PresetDateRange(dtRangeID){
    var id= "#"+dtRangeID+"";
    $(id).val('');
    //var id = 'input[name="datefilter"]';  //For all fields at once
    $(id).daterangepicker({
      autoUpdateInput: false,
      "applyClass": "btn-primary",
      locale: {
          cancelLabel: 'Clear'
      }
    });

    $(id).on('apply.daterangepicker', function(ev, picker) {
      $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
    });

    $(id).on('cancel.daterangepicker', function(ev, picker) {
      $(this).val('');
    });
}
function RefreshPersons(){
    $.ajax({
            type: "GET",
            url: "/persons",
            dataType: "json"
        }).done(function(response) {
        $("#menuPersons option").remove();
        $("#menuPersons").append('<option></option>');
        $.each(response, function(key,value) {
            //alert(value.com);
            //<li role="presentation"><a role="menuitem" href="#">HTML</a></li>
            var liHtml = '<option>'+ value.name +'</option>';
            $("#menuPersons").append(liHtml);
        });
        $('#menuPersons').val('').selectpicker('refresh');
    });
}
function RefreshFunctionalAreas(){
    $.ajax({
            type: "GET",
            url: "/functionalareas",
            dataType: "json"
        }).done(function(response) {
        $("#menuFunctionalAreas option").remove();
        $("#menuFunctionalAreas").append('<option></option>');
        $.each(response, function(key,value) {
            var liHtml = '<option>'+ value.name +'</option>';
            $("#menuFunctionalAreas").append(liHtml);
        });
        $('#menuFunctionalAreas').val('').selectpicker('refresh');
    });
}