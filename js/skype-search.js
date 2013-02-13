var template = {}, 
    re, 
    query;

$(document).ready(function(){
  template.search = _.template($("#Search-Result").html());
  template.call = _.template($("#Call-Result").html());
});

function doDuration(num) {
  if(!num) { return false }
  var res = [];
  for(var i = 0; i < 3; i++) {
    res.push((100 + (num % 60)).toString().slice(1));
    num = Math.floor(num / 60);
  }
  return res.reverse().join(':');
}

var nameMap = {};
$(function(){
  $.getJSON("api/whois.php", function(data) {
    _.each(data, function(value, key) {
      nameMap[value.skypename] = value.fullname;
    });
  });
});

function getName(){
  var value = this.innerHTML;
  if(nameMap[value]) {
    this.innerHTML = nameMap[value];
  }
}

function showCalls() {
  $.getJSON("api/calls.php", function(data) {
    $("#results").empty();
    if(!data.length) {
      return;
    }
    _.each(data, function(row) {
      if(!row) { return; }

      row.duration = doDuration(row.duration);
      if(!row.duration) { return; }

      row.begin_timestamp = (new Date(row.begin_timestamp * 1000)).toLocaleString().split(' ').slice(1,-1)
      row.begin_timestamp.splice(2, 1);
      row.begin_timestamp = row.begin_timestamp.join(' ').replace(/GMT.*/, '');

      row.current_video_audience = row.current_video_audience.replace(/^\s+/, '').replace(/\s+$/, '');

      row.current_video_audience = '<span>' + row.current_video_audience.split(/\s+/).sort().join('</span><span>') + '</span>';

      $("<div class='row call'>")
        .html( template.call(row) )
        .appendTo("#results");

     });
     $(".members span").each(getName);
  });
}

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
      rowDOM = $("<div class='row'>").html( template.search(row) );
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
        $("<div class='row result highlight'>").html( template.search(row) ).on('click', function(){
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
