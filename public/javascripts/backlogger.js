$(function() {
    // var initialLoad = true;
    // var persons = [];
    // var functionalareas = [];
    var tableBacklogs = $('#tblBacklogs').DataTable( {
        "ajax" : {
            "url" : "/backlogs",
            "type" : "GET",
            //"dataScr": ''
            "dataSrc" : function (json) {
                // manipulate your data (json)
                // return the data that DataTables is to use to draw the table
                return json;
            }
        },
        "order": [[ 0, "desc" ]],
        "processing" :true,
        "columns" : [ {
            "data" : "insertdate",
            "width": "auto",
            "render": function (data) {
                var date = new Date(data);
                return dateFormat(date, "mm/dd/yyyy h:MM:ss TT");
                //return getDateFormatted(date);
            }
        }, {
            "data" : "person",
            "width": "auto"

        }, {
            "data" : "functionalarea",
            "width" : "auto"
        }, {
            "data" : "idea",
            "width" : "auto",
            "render": function(data){
                var rtnString = data.substring(0, 95);
                if (data.length > 95 ) rtnString = rtnString + ' ....';
                return rtnString;
            }
        },{
            "data" : "_id",
            "width": "auto",
            "render": function(data){
                return '<button style="padding-top:5px !important;padding-bottom:5px;" class="btn btn-primary" data-toggle="modal" data-target="#mdlViewDetails" data-backlogid="'+ data + '" href="#">View Details</a>';
                //return '<a href="/backlogss"> View Details</a>';
            }
        }]
        // ,rowId: 'extn'
        // ,select: true
        //,dom: 'Bfrtip'
        ,dom: '<"search"Bf><"top">rt<"bottom"ip><"clear">'
        ,lengthMenu: [
            [ 10, 25, 50, -1 ],
            [ '10 rows', '25 rows', '50 rows', 'Show all' ]
        ]
        ,buttons: [
            {
                text: 'Refresh',
                action: function () {
                    tableBacklogs.ajax.reload();
                },
                className: 'customRefresh'
            }
            , 'pageLength'
        ]
        ,initComplete: function () {
            this.api().columns([1, 2]).every( function () {
                var column = this;
                var select = $('<select><option value=""></option></select>')
                    .appendTo( $(column.footer()).empty() )
                    .on( 'change', function () {
                        var val = $.fn.dataTable.util.escapeRegex(
                            $(this).val()
                        );
 
                        column
                            .search( val ? '^'+val+'$' : '', true, false )
                            .draw();
                    } );

                column.data().unique().sort().each( function ( d, j ) {
                    select.append( '<option value="'+d+'">'+d+'</option>' )
                } );
            } );
        }
    });
    rePaintJsGridButtons();

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

    $('#mdlAddNew').on('show.bs.modal', function (event) {
        
        var date = new Date();
        var modal = $('#mdlAddNew');
        modal.find('.modal-body #spanAddBacklogDate').text(getDateFormatted(date));
        modal.find('.modal-body #txtAddBacklogIdea').text('');
        $("#mdlAddNewErrorMessage").removeClass('alert alert-danger');
        $("#mdlAddNewErrorMessage").removeClass('alert alert-success');
        $("#mdlAddNewErrorMessage").text('');
        // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
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
            $('#menuPersons').selectpicker('refresh');
        });
        $.ajax({
                type: "GET",
                url: "/functionalareas",
                dataType: "json"
            }).done(function(response) {
            $("#menuFuncArea option").remove();
            $("#menuFuncArea").append('<option></option>');
            $.each(response, function(key,value) {
                //alert(value.com);
                //<li role="presentation"><a role="menuitem" href="#">HTML</a></li>
                var liHtml = '<option>'+ value.name +'</option>';
                $("#menuFuncArea").append(liHtml);
            });
            $('#menuFuncArea').selectpicker('refresh');
        });
    });
    //submit Ajax call to update resolved date
    $("#btnUpdateResolved").click(function(event) {
        event.preventDefault();
        var backlogId = $("#btnUpdateResolved").data('backlogid');
        console.log('--- I CAME EHERE');
        console.log(backlogId);
        var data = {};
        data.resolveddate =  getDateFormatted(new Date());
        $.ajax({
            type: 'PATCH',
            url: "/backlogs/" + backlogId,
            data: data,
            dataType: 'json'
        }).done(function (response){
            console.log(response);
            //We are cheating instead of reloading from DB. change this in future if custom resolved date is needed.
            //finally update the Resolved Date to today and disable the button.
            var modal = $('#mdlViewDetails');
            var resolvedDate = getDateFormatted(new Date());
            modal.find('.modal-body #resolvedDate').text(resolvedDate);
            $('#btnUpdateResolved').hide();
        });
         
    });

    //Form submit Ajax call
    //$("#frmAddNewBacklog").submit(function(event) {
    $("#btnAddNewBacklog").click(function(event) {
        event.preventDefault();
        var data = {};
        data.person = $('#menuPersons').val();
        data.functionalarea = $('#menuFuncArea').val();
        data.idea = $('#txtAddBacklogIdea').val();
        if(data.person == '' ||data.functionalarea == '' ||data.idea == '' ){
            $("#mdlAddNewErrorMessage").removeClass('alert alert-success');
            $("#mdlAddNewErrorMessage").addClass('alert alert-danger');
            $("#mdlAddNewErrorMessage").text('Oops! All fields are required.');
        }else {
            $.ajax({
                type: 'POST',
                url: '/backlogs',
                data: data,
                dataType: 'json'
            }).done(function (response){
                $("#mdlAddNewErrorMessage").removeClass('alert alert-danger');
                $("#mdlAddNewErrorMessage").addClass('alert alert-success');
                $("#mdlAddNewErrorMessage").text(response.message);
                // Clear the form.
                $('#menuPersons').val('');
                $('#menuFuncArea').val('');
                $('#txtAddBacklogIdea').val('');
                $('#menuPersons').selectpicker('refresh');
                $('#menuFuncArea').selectpicker('refresh');
                tableBacklogs.ajax.reload();
            });
        }   
    });

    $("#btnCheckAdminPassword").click(function(event){
        event.preventDefault();
        var data = {};
        data.adminpass = $('#adminPassword').val();
        $.ajax({
            type: 'POST',
            url: '/checkadminpwd',
            data: data,
            dataType: 'json'
        }).done(function (response){
            if(response.isValid){
                // Clear the form.
                $('#adminPassword').val('');
                $('#mdlAdminPassword').modal('hide');
                $('#mdlAddAdminFormValues').modal('show');
            }else{
                $("#mdlCheckAdminPassErrorMessage").addClass('alert alert-danger');
                $("#mdlCheckAdminPassErrorMessage").text('Password incorrect. Please try again.!');
                // Clear the form.
                $('#adminPassword').val('');
            }
        });
    });

    // Super Admin Verification Code
    $("#btnVerifySuperAdmin").click(function(event){
        event.preventDefault();
        var data = {};
        data.superadminpass = $('#superadminpassword').val();
        $.ajax({
            type: 'POST',
            url: '/checksuperadminpwd',
            data: data,
            dataType: 'json'
        }).done(function (response){
            if(response.isValid){
                // Clear the form.
                $('#superadminpassword').val('');
                $("#divErrorSuperAdminPassword").removeClass('alert alert-danger');
                $("#divErrorSuperAdminPassword").addClass('alert alert-success');
                $("#divErrorSuperAdminPassword").text('Thank you. You many now perform DB Actions.!');
                $("#btnDBBackup").removeClass('disabled');
                $("#btnDBReset").removeClass('disabled');
            }else{
                $("#divErrorSuperAdminPassword").removeClass('alert alert-success');
                $("#divErrorSuperAdminPassword").addClass('alert alert-danger');
                $("#divErrorSuperAdminPassword").text('Super Admin Key incorrect.!');
                // Clear the form.
                $('#superadminpassword').val('');
            }
        });
    });
    // btnDBReset - Database Reset Code
    $("#btnDBReset").click(function(event){
        event.preventDefault();
        var data = {};
        if ($("#chkPerson").is(':checked'))
            data.person = true;
        if ($("#chkFunctionalArea").is(':checked'))
            data.functionalarea = true;
        if ($("#chkBacklog").is(':checked'))
            data.backlog = true;
        if(!$("#chkPerson").is(':checked') && !$("#chkFunctionalArea").is(':checked') &&  !$("#chkBacklog").is(':checked')){
            $("#divErrorSuperAdminPassword").removeClass('alert alert-success');
            $("#divErrorSuperAdminPassword").addClass('alert alert-danger');
            $("#divErrorSuperAdminPassword").text('Select atleast one checkbox.');
            return;
        }
        $.ajax({
            type: 'POST',
            url: '/dbreset',
            data: data,
            dataType: 'json'
        }).done(function (response){
            if(response.isSuccess){
                // Clear the form.
                $("#divErrorSuperAdminPassword").removeClass('alert alert-danger');
                $("#divErrorSuperAdminPassword").addClass('alert alert-success');
                $("#divErrorSuperAdminPassword").text(response.message);
                //update the Persons, Functional Areas or Backlog Grids.
                if ($("#chkPerson").is(':checked'))
                    tablePersons();
                if ($("#chkFunctionalArea").is(':checked'))
                    tableFunctionalAreas();
                if ($("#chkBacklog").is(':checked'))
                    tableBacklogs.ajax.reload();
                //Clear the Input values
                $( "#chkPerson" ).prop( "checked", false );
                $( "#chkFunctionalArea" ).prop( "checked", false );
                $( "#chkBacklog" ).prop( "checked", false );
            }else{
                $("#divErrorSuperAdminPassword").removeClass('alert alert-success');
                $("#divErrorSuperAdminPassword").addClass('alert alert-danger');
                $("#divErrorSuperAdminPassword").text(response.message);
            }
        });
    });

    $('#mdlAdminPassword').on('show.bs.modal', function (event) {
        $("#mdlCheckAdminPassErrorMessage").removeClass('alert alert-danger');
        $("#mdlCheckAdminPassErrorMessage").text('');
    });

    $('#mdlAddAdminFormValues').on('show.bs.modal', function (event) {
        tablePersons();
        tableFunctionalAreas();
        rePaintJsGridButtons();
        //clear fields on the popup
        $('#txtAddNewPerson').val('');
        $('#txtAddNewFuncArea').val('');
        $("#mdlAddPersonErrorMessage").removeClass('alert alert-danger');
        $("#mdlAddPersonErrorMessage").removeClass('alert alert-success');
        $("#mdlAddPersonErrorMessage").text('');
        $("#mdlAddFuncAreaErrorMessage").removeClass('alert alert-danger');
        $("#mdlAddFuncAreaErrorMessage").removeClass('alert alert-success');
        $("#mdlAddFuncAreaErrorMessage").text('');
        $("#divErrorSuperAdminPassword").removeClass('alert alert-danger');
        $("#divErrorSuperAdminPassword").removeClass('alert alert-success');
        $("#divErrorSuperAdminPassword").text('')
    });

    $("#btnAddNewPerson").click(function(event){
        event.preventDefault();
        var data = {};
        data.person = $('#txtAddNewPerson').val();
        if(data.person == ''){
            $("#mdlAddPersonErrorMessage").text('Person is required');
            $("#mdlAddPersonErrorMessage").removeClass('alert alert-success');
            $("#mdlAddPersonErrorMessage").addClass('alert alert-danger');
        }else {
            $.ajax({
                type: 'POST',
                url: '/persons',
                data: data,
                dataType: 'json'
            }).done(function (response){
                // Clear the form.
                $('#txtAddNewPerson').val('');
                $("#mdlAddPersonErrorMessage").text(response.message);
                $("#mdlAddPersonErrorMessage").removeClass('alert alert-danger');
                $("#mdlAddPersonErrorMessage").addClass('alert alert-success');
                tablePersons();
            }); 
        }
    });
    $("#btnAddNewFuncArea").click(function(event){
        event.preventDefault();
        var data = {};
        data.functionalarea = $('#txtAddNewFuncArea').val();
        if(data.functionalarea == ''){
            $("#mdlAddFuncAreaErrorMessage").text('Functional area is required');
            $("#mdlAddFuncAreaErrorMessage").removeClass('alert alert-success');
            $("#mdlAddFuncAreaErrorMessage").addClass('alert alert-danger');
        }else {
            $.ajax({
                type: 'POST',
                url: '/functionalareas',
                data: data,
                dataType: 'json'
            }).done(function (response){
                // Clear the form.
                $('#txtAddNewFuncArea').val('');
                $("#mdlAddFuncAreaErrorMessage").text(response.message);
                $("#mdlAddFuncAreaErrorMessage").removeClass('alert alert-danger');
                $("#mdlAddFuncAreaErrorMessage").addClass('alert alert-success');
                tableFunctionalAreas();
            }); 
        }
    });
});

var rePaintJsGridButtons = function(){
    $('.dt-button.customRefresh').each(function() {
        $(this).removeClass('dt-button customRefresh').addClass('btn btn-primary')
    });
    $('.dt-button.buttons-collection.buttons-page-length').each(function() {
        $(this).removeClass('dt-button buttons-collection buttons-page-length').addClass('btn btn-primary');
        $(this).css({"margin-left":"4px"});
    });
};

function getDateFormatted(date){
    var month = date.getMonth() + 1;
    return (month.length > 1 ? month : "0" + month) + "/" + date.getDate() + "/" + date.getFullYear();
}
var tablePersons = function(){
    return $('#tblPersons').DataTable( {
        "ajax" : {
            "url" : "/persons",
            "type" : "GET",
            //"dataScr": ''
            "dataSrc" : function (json) {
                // manipulate your data (json)
                // return the data that DataTables is to use to draw the table
                return json;
            }
        },
        destroy: true,
        "processing" :true,
        "columns" : [ 
        {
            "data" : "name"
        }]
        // ,rowId: 'extn'
        // ,select: true
        ,dom: 'rtip'
        //,dom: '<"search"Bf><"top">rt<"bottom"ip><"clear">'
        ,lengthMenu: [
            [ 5, 25, 50, -1 ],
            [ '5 rows', '25 rows', '50 rows', 'Show all' ]
        ]
        ,buttons: [
            {
                text: 'Refresh',
                action: function () {
                    tablePersons().ajax.reload();
                    rePaintJsGridButtons();
                },
                className: 'customRefresh'
            }
            , 'pageLength'
        ]
    });
};
var tableFunctionalAreas = function(){
    return $('#tblFuncAreas').DataTable( {
        "ajax" : {
            "url" : "/functionalareas",
            "type" : "GET",
            "dataSrc" : function (json) {
                // manipulate your data (json)
                // return the data that DataTables is to use to draw the table
                return json;
            }
        },
        destroy: true,
        "processing" :true,
        "columns" : [ 
        {
            "data" : "name"
        }]
        ,dom: 'rtip'
        //,dom: '<"search"Bf><"top">rt<"bottom"ip><"clear">'
        ,lengthMenu: [
            [ 5, 25, 50, -1 ],
            [ '5 rows', '25 rows', '50 rows', 'Show all' ]
        ]
        ,buttons: [
            {
                text: 'Refresh',
                action: function () {
                    tableFunctionalAreas().ajax.reload();
                    rePaintJsGridButtons();
                },
                className: 'customRefresh'
            }
            , 'pageLength'
        ]
    });
};