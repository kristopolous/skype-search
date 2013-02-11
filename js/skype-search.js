var template, re, query;
$(document).ready(function(){
  template = _.template($("#Search-Result").html());
});

function Expand(ts, convo, el) {
  $.getJSON("api/search.php?ts=" + ts + "&convo=" + convo, function(data) {
    var rowDOM;

    $(el)
      .empty()
      .removeClass('highlight')
      .unbind('click')
      .hide();

    _.each(data, function(row) {
      if(!row) { return; }
      process(row);
      rowDOM = $("<div class='row'>").html( template(row) );
      if(row.rawtimestamp == ts) {
        rowDOM.addClass("highlight").click(function(){
          $(this.parentNode).slideUp(function(){
            $(this).toggleClass("off").slideDown();
          });
        });
      }
      rowDOM.appendTo(el);
    });

   $(el).slideDown();
  });
}

function process(row) {
  row.body_xml = row.body_xml
    .replace(/\ \ /g, '&nbsp; ')
    .replace(/\n/g, "<br>")
    .replace(re, '<b>$1</b>');

  row.rawtimestamp = row.timestamp;
  row.timestamp = (new Date(row.timestamp * 1000)).toLocaleString().split(' ').slice(1,-1).join(' ').replace(/GMT.*/, '');
}

function doSearch(){
  query = $("#search").val();
  window.location.hash = query;

  re = new RegExp("(" + query + ")", 'ig');

  $("#search-text").html("Searching for " + query);
  $.getJSON("api/search.php?q=" + escape(query), function(data) {
    $("#results").empty();
    if(data.length) {
      _.each(data, function(row) {
        if(!row) { return; }
        process(row);
        $("<div class='row result highlight'>").html( template(row) ).on('click', function(){
          Expand(row.rawtimestamp, row.convo_id, this);
        }).appendTo("#results");
      });
    } else {
      $("#results").html("<h2>Woops, nothing found for '" + query + "'. Check the spelling?</h2>");
    }
  })
}

setInterval(function(){
  if(window.location.hash.slice(1) != query) {
    $("#search").val(window.location.hash.slice(1));
    doSearch();
  }
}, 100);
