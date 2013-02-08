var template;
$(document).ready(function(){
  template = _.template($("#Search-Result").html());

});
function doSearch(){
  var query = $("#search").val(),
    re = new RegExp("(" + query + ")", 'ig');

  $("#search-text").html("Searching for " + query);
  $.getJSON("api/search.php?q=" + escape(query), function(data) {
    $("#results").empty();
    _.each(data, function(row) {
      row.body_xml = row.body_xml
        .replace(/\ \ /g, '&nbsp; ')
        .replace(/\n/g, "<br>")
        .replace(re, '<b>$1</b>');

      row.timestamp = (new Date(row.timestamp * 1000)).toLocaleString().split(' ').slice(1,-1).join(' ').replace(/GMT.*/, '');

      $("<div class='row result'>").html( template(row) ).appendTo("#results");
    });
  })
}
