var 
  h = 0, s = 0.3, v = 0.2,
  template = {}, 
  re, 
  query,
  convodb = DB(),
  nameMap = {},
  colorMap = {};

$(function(){
  template = {
    search: _.template($("#Search-Result").html()),
    call: _.template($("#Call-Result").html()),
    channel: _.template($("#Channel-Item").html())
  };

  $.getJSON("api/conversations.php", function(data) {
    _.each(data,function(what) {
      colorMap[what.id] = nextColor();

      $("#channelList").append(
      template
        .channel({
          content: what.displayname
        })
      );
    });
    convodb.insert(data);
  });
  $.getJSON("api/whois.php", function(data) {
    _.each(data, function(value, key) {
      nameMap[value.skypename] = value.fullname;
      colorMap[value.skypename] = nextColor();
    });
  });
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

function doFractionalDuration(num) {
  return (num / 3600).toFixed(3);
}

function hsv2rgb(h, s, v) {
  h = (h % 1 + 1) % 1; // wrap hue

  var i = Math.floor(h * 6),
      f = h * 6 - i,
      p = v * (1 - s),
      q = v * (1 - s * f),
      t = v * (1 - s * (1 - f));

  switch (i) {
    case 0: return [v, t, p];
    case 1: return [q, v, p];
    case 2: return [p, v, t];
    case 3: return [p, q, v];
    case 4: return [t, p, v];
    case 5: return [v, p, q];
  }
}

function nextColor() {
  v += 0.035;
  h += 0.06;

  if(v >= 0.5) {
    v = 0.1;
  }
  if(h >= 1) {
    h = 0;
  }

  var mycolor = hsv2rgb(h, s, v);
  mycolor[0] *= 256;
  mycolor[1] *= 256;
  mycolor[2] *= 256;
  mycolor = _.map(mycolor, Math.floor);
  return 'rgb(' + mycolor.join(',') + ')';
}


function getChannel(){
  var id = parseInt(this.innerHTML),
    channel = convodb.find('id', id).select('displayname')[0];

  console.log(id);
  this.innerHTML = channel;
  this.style.background = colorMap[id];

  $(this).addClass('convo-' + id).hover(
    function() { 
      $(".convo-" + id).addClass('hover'); 
      $(".convo-" + id).parent().parent().addClass('hover'); 
    },
    function() { 
      $(".convo-" + id).removeClass('hover'); 
      $(".convo-" + id).parent().parent().removeClass('hover'); 
    }
 );
}

function getName(){
  var value = this.innerHTML;

  if(nameMap[value]) {
    this.innerHTML = nameMap[value];
    this.style.background = colorMap[value];
  }

  var cName = value.replace(/[^\w]/g,'');

  $(this).addClass('user-' + cName).hover(
    function() { 
      $(".user-" + cName).addClass('hover'); 
      $(".user-" + cName).parent().parent().addClass('hover'); 
    },
    function() { 
      $(".user-" + cName).removeClass('hover'); 
      $(".user-" + cName).parent().parent().removeClass('hover'); 
    }
 );
}

function showCalls() {
  $.getJSON("api/calls.php", function(data) {
    $("#results").empty();
    if(!data.length) {
      return;
    }
    _.each(data, function(row) {
      if(!row) { return; }

      row.duration_real = row.duration;
      row.duration = doDuration(row.duration);
      if(!row.duration) { return; }

      row.fractional_duration = doFractionalDuration(row.duration_real);

      row.begin_timestamp = (new Date(row.begin_timestamp * 1000)).toLocaleString().split(' ').slice(1,-1)
      row.begin_timestamp.splice(2, 1);
      row.begin_timestamp = row.begin_timestamp.join(' ').replace(/GMT.*/, '').replace(/\s$/,'');
      var temp = row.begin_timestamp.split(' '),
          time = temp.pop(),
          hour = time.split(':').shift();

      temp.push( time );
      row.begin_timestamp = temp.join(' ');

      row.current_video_audience = row.current_video_audience.replace(/^\s+/, '').replace(/\s+$/, '');

      row.current_video_audience = '<span>' + row.current_video_audience.split(/\s+/).sort().join('</span><span>') + '</span>';

      $("<div class='row call'>")
        .html( template.call(row) )
        .appendTo("#results");

     });

     $(".channel span").each(getChannel);
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
