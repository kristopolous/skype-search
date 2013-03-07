var 
  template = {}, 
  re, 
  query,

  finder,
  finderAlias = function() { if(finder) { finder() } },

  ev = EvDa({
    channelList: [],
    channelIds: []
  }),
  convodb = DB(),
  callLog,
  nameMap = {},
  colorMap = {};

ev.on("channelList", function(what){
  $("#filterList").empty();

  document.getElementById("showAll")[
    (what.length ? "remove" : "set") +
    "Attribute"
  ]("disabled", true);

  _.each(what, function(filter) {
    $(template.room({
      room: filter
    })).click(function(){
      ev.setdel("channelList", this.innerHTML);
    }).hover(
      function(){ $(this).addClass('label-inverse'); },
      function(){ $(this).removeClass('label-inverse'); }
    ).appendTo("#filterList");
  });
});

function filterClear(){
  ev("channelList", []);
}

$(function(){
  template = {
    search: _.template($("#Search-Result").html()),
    call: _.template($("#Call-Result").html()),
    channel: _.template($("#Channel-Item").html()),
    room: _.template($("#Filter-Room").html())
  };

  $.getJSON("api/conversations.php", function(data) {
    _.each(data,function(what) {
      colorMap[what.id] = nextColor();
    });
    convodb.insert(data);
    var channels = convodb.select('displayname');
    $("#room").typeahead({
      source: function(){ 
        return _.difference(channels, ev("channelList"));
      },
      updater: function(what) {
        ev.setadd("channelList", what);
      }
    })
  });
  $.getJSON("api/whois.php", function(data) {
    _.each(data, function(value, key) {
      nameMap[value.skypename] = value.fullname;
      colorMap[value.skypename] = nextColor();
    });
  });
});

ev.on("channelList", function(what) {
  if(ev('channelList').length) {
    var idList = convodb.find({
      displayname: DB.isin(ev('channelList'))
    }).select('id');
    ev('channelIds', idList);
  } else {
    ev('channelIds', []);
  }
});

ev.on("channelIds", function(idList) {
  if(ev.db.calls) {
    if(idList) {
      ev('calls').update(function(row){
        row.visible = _.indexOf(idList, row.conv_dbid) > -1;
      });
    } else {
      ev('calls').update(function(row){
        row.visible = true;
      });
    }
  }
  finderAlias();
});

function getChannel(){
  var id = parseInt(this.innerHTML),
    channel = convodb.find('id', id).select('displayname')[0];

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
 ).click(function(){
   ev("channelList", [channel]);
 });
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

ev.setter('calls', function(done) {
  $.getJSON("api/calls.php", function(data) {
    var db = DB();

    db.addIf(function(row) {
      var test = !!row.current_video_audience;
      return test;
    })

    db.insert(data);

    db.update(function(row){
      row.visible = true;
      row.duration_real = row.duration;
      row.duration = doDuration(row.duration);
      if(!row.duration) { return; }

      row.fractional_duration = doFractionalDuration(row.duration_real);

      row.begin_timestamp = (new Date(row.begin_timestamp * 1000)).toLocaleString().split(' ').slice(0,-1)
  //      row.begin_timestamp.splice(1, 1);
      row.begin_timestamp = row.begin_timestamp.join(' ').replace(/GMT.*/, '').replace(/\s$/,'');
      var temp = row.begin_timestamp.split(' '),
          time = temp.pop(),
          hour = time.split(':').shift();

      temp.push( time );
  //     row.begin_timestamp = temp.join(' ');

      row.current_video_audience = row.current_video_audience.replace(/^\s+/, '').replace(/\s+$/, '');

      row.current_video_audience = '<span>' + row.current_video_audience.split(/\s+/).sort().join('</span><span>') + '</span>';
    });

    // db is our calls
    done(db);
  })
});

function state(el) {
  $(el).parent().addClass("active").siblings().removeClass("active");
  ev("state", el.innerHTML);
}

ev("state", function(state) {
  if(state == "Calls") {
    $("#search").hide();
    finder = showCalls;
  } else { // chat
    $("#search").show();
    finder = showChat;
  }
  finder();
});

function showCalls() {

  ev.isset('calls', function(db) {
    $("#results").empty();

    db.find({visible: true}).each(function(row) {
      if(!row.duration) { return; }


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
  row.timestamp = (new Date(row.timestamp * 1000)).toLocaleString().split(' ').slice(0,-1).join(' <br>').replace(/GMT.*/, '');
}

function showChat() {
  query = $("#search").val();
  window.location.hash = query;

  re = new RegExp("(" + query + ")", 'ig');

  $.getJSON("api/search.php?", {
    q: query,
    rooms: ev('channelIds')
  }, function(data) {
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

ev('state', 'Chat');
setInterval(function(){
  if(window.location.hash.slice(1) != query) {
    $("#search").val(window.location.hash.slice(1));
    finderAlias();
  }
}, 100);
