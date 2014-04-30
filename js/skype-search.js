var 
  template = {}, 
  re, 
  query,

  // This is an aliased function that can move around depending
  // on whether we are in the call or chat mode.
  finder,
  finderAlias = function() { if(finder) { finder() } },

  ev = EvDa({
    channelList: [],
    channelIds: [],
    "+userList": [],
    "-userList": [],
    "+channelIds": [],
    "-channelIds": []
  }),
  nameList = [],
  nameMap = {},
  // The global list of search params that will get tacked on to the search query
  searchParams = {},
  colorMap = {};

function clearSearchDate(){
  $("#from,#to").val('');
  delete searchParams['to'];
  delete searchParams['from'];
  showChat();
}

function searchDate(){
  searchParams['from'] = $("#from").val();
  searchParams['to'] = $("#to").val();
  showChat();
}

function swap(){
  var slosh = $(this).attr('hover');
  $(this).attr({'hover': $(this).attr('class')});
  $(this).attr({'class': slosh});
}

ev([
  "+userList",
  "-userList",
  "channelList"
  ], function(what, meta){
  $("#filterList").empty();

  document.getElementById("showAll")[
    (what.length ? "remove" : "set") +
    "Attribute"
  ]("disabled", true);

  _.each(['channelList', '-userList', '+userList'], function(key) {
    _.each(ev(key), function(filter) {
      $(template.room({
        room: nameMap[filter] || filter,
        type: {
          'channelList':'label-warning', 
          '-userList':'label-info',
          '+userList':'label-info'
        }[key]
      })).click(function(){
        ev.setdel(key, filter);
      }).hover(swap, swap).appendTo("#filterList");
    })
  });
});

function filterClear() {
  ev("channelList", []);
}

$(function(){
  _.each([
    [ "search", "Search-Result" ],
    [ "container", "Search-Container" ],
    [ "call", "Call-Result" ],
    [ "channel", "Channel-Item" ],
    [ "channelHeader", "Channel-Header" ],
    [ "room", "Filter-Room" ]
  ], function(tuple) {
    template[tuple.shift()] = _.template(
      $("#" + tuple.shift() ).html()
    );
  });

  $.getJSON("api/conversations.php", function(data) {
    // Make sure that we give a unique color to all the 
    // conversations that there have been.
    _.each(data,function(what) {
      colorMap[what.id] = nextColor();
    });

    // Put the convo database in a global ev object - some
    // parts of the code are waiting for this
    ev.set('convodb', DB(data));

    // This is of course, assumed to be static for the duration
    // of web application runtime.
    var channels = ev('convodb').select('displayname');

    $("#room").typeahead({
      source: function(){ 
        var set;

        this.include = true;
        // negation search
        if (this.query.substr(0,1) == '-') {
          this.include = false;
          this.query = this.query.slice(1);
        }

        // Make sure that we don't show options that are already
        // selected.
        if(ev('state') == 'Chat') {
          set = _.difference(channels, ev("channelList"));
        } else {
          set = _.difference(ev('callList'), ev('channelList'));
        }

        // There's two different kind of filters: either what a (u)ser
        // has said or a (r)oom that it was said in.
        return _.map(_.uniq(set), function(which) { 
          return "r: " + which;
        }).concat( _.map(nameList, function(which) {
          return "u: " + which;
        })).sort();
      },

      updater: function(what) {
        // Since we have a crappy little type system,
        // we have to use the string value to determine
        // whether the person was in a room or a user.
        var 
          parts = what.split(':'),

          // Since a colon is part of a valid channel name, 
          // we have to shift off the stack to determine
          // the type
          type = parts.shift(),

          // and then reassemble the rest of the parts back
          // together, if there are more than one of course.
          thing = $.trim(parts.join(':'));

        // Now we use this to determine whether it was a room
        // or a user.  If it's a user, then we use their real
        // skype username, as the aliased name such as "Joe Smith"
        // can collide.  Of course, we don't handle that at all very well
        // throughout the code and will break on such collisions.
        if(type == 'r') {
          ev.setadd("channelList", ['-','+'][ +this.include ] + thing);
        } else {
          ev.setadd(['-','+'][ +this.include ] + "userList", nameMap[thing]);
        }
      }
    })
  });

  $.getJSON("api/whois.php", function(data) {
    _.each(data, function(value, key) {
      if(value.fullname || value.skypename) {
        nameList.push(value.fullname || value.skypename);
      }
      nameMap[value.skypename] = value.fullname || value.skypename;

      if(value.fullname) {
        nameMap[value.fullname] = value.skypename;
      }

      colorMap[value.skypename] = nextColor();
    });
  });
});

function getChannel(){
  var 
    id = parseInt(this.innerHTML),
    channel = ev('convodb')
      .find('id', id)
      .select('displayname')[0];

  this.innerHTML = channel;
  this.style.background = colorMap[id];

  $(this).addClass('convo-' + id).addClass('filterable').click(function(){
    ev("channelList", ["+" + channel]);
  });
}

function getName(){
  var value = this.innerHTML;

  if(nameMap[value]) {
    this.innerHTML = nameMap[value];
    this.style.background = colorMap[value];
  }

  var cName = value.replace(/[^\w]/g,'');

/*
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
  */
}

ev.setter('calls', function(done) {
  $.getJSON("api/calls.php", function(data) {
    var db = DB();

    _.each(data, function(which) {
      var xml = $($.parseXML(which.body_xml));

      which.duration = 0;

      which.conv_dbid = which.convo_id;
      delete which.convo_id;
      which.participants = Array.prototype.slice.call((xml.find('part')).map(function(el) {

        which.duration = Math.max(
          parseInt(
            $(this).find('duration').text()
          ), 
          which.duration);

        return this.getAttribute('identity');
      }));

    });
    db.insert(data);

    db.update(function(row){
      row.visible = true;
      row.duration_real = row.duration;
      row.duration = doDuration(row.duration);
      if(!row.duration) { return; }

      row.fractional_duration = doFractionalDuration(row.duration_real);

      row.begin_timestamp = timeConvert(new Date(row.timestamp * 1000));
      row.current_video_audience = '<span>' + row.participants.sort().join('</span><span>') + '</span>';
    });

    db.remove({duration: false});

    // This is the set with calls
    ev.set(
      "callList", 
      ev('convodb').find({
        id: DB.isin(
          _.uniq(
            db
              .find()
              .select('conv_dbid')
          )
        )
      }).select('displayname')
    );

    // db is our calls
    done(db);
  })
});

function state(el) {
  $(el)
    .parent()
    .addClass("active")
    .siblings()
    .removeClass("active");

  ev("state", el.innerHTML);
}

var filter = {
  user: function(who, operator) {
    if(who === 'false') { return; }
    operator = operator || '+';
    ev.setAdd(operator + 'userList', who);
  },
  userLink: function(who) {
    return '<a onclick=filter.user("' + who + '")>' + (nameMap[who] || who) + '</a>';
  },
  channel: function(what, operator) {
    if(what === 'false') { return; }
    operator = operator || '+';
    ev.setAdd('channelList', operator + what);
  }
};

ev({
  '+userList': function(what) {
    finderAlias();
  },
  '-userList': function(what) {
    finderAlias();
  },

  channelList: function(what) {
    if(ev('channelList').length) {

      // First we find the convo id in the filter list
      var 
      idMap = ev('convodb').find({
        displayname: DB.isin(
          // while truncating whether we want to include or
          // exclude the item.
          ev('channelList').map(
            function(m) { 
              return m.slice(1); 
            }
          )
        )
        // Then we group it all by the display name, which
        // will correspond to the human readable names
      }).group('displayname'),

      // The idList we send off to the api will have a sign bit
      // on whether it should be included or excluded from the search.
      // 
      // We get this by mapping the selected items in the filter,
      // (1) removing the sign bit, (2) looking up the id from the
      // map created above, and then (3) combining them
      //
      // (3)
      idList = ev('channelList').map(function(name) {
              // (1)               (2)
        return name.substr(0, 1) + idMap[ name.slice(1) ][0].id; 
      });

      ev('+channelIds', _.map(
        _.filter(idList, function(m) { return parseInt(m) > 0 }),
        function(m) { return m.slice(1) }
      ));
      ev('-channelIds', _.map(
        _.filter(idList, function(m) { return parseInt(m) < 0 }),
        function(m) { return m.slice(1) }
      ));
      ev('channelIds', idList);
    } else {
      ev(['+channelIds', 'channelIds', '-channelIds'], []);
    }
  },

  channelIds: function(idList) {
    if(ev('state') == 'Calls') {
      if(idList.length) {
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
  },

  state: function(state) {
    if(state == "Calls") {
      $("#search, #instructions").hide();
      finder = showCalls;
    } else { // chat
      $("#search").show();
      finder = showChat;
    }
    finder();
  }
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

var wait = {
  on: function(){
    $("#waiter").css('display','block');
  },
  off: function(){
    $("#waiter").css('display','none');
  }
}

function Expand(ts, convo, el, button) {
  button.level = (button.level || 0) + 1;
  $.getJSON("api/search.php", {
    ts: ts,
    convo: convo,
    level: button.level
  }, function(res) {
    var 
      data = res.data,
      rowDOM,
      lastAuthor;

    console.log(res.dbg);

    $(el)
      .empty()
      .hide()
      .addClass("expanded");

    _.each(data, function(row) {
      if(!row) { return; }
      process(row);
      rowDOM = $("<div>").html( template.search(row) );
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

function parseCall(xml) {
  var sub = $(xml), table = [];
  $("part", sub).each(function(what) {
    table.push(
    '<tr>' +
      '<td>' + $("name", this).html() + '</td>' +
      '<td>' + doFractionalDuration(parseInt($("duration", this).html(),10)) + '</td>' +
    '</tr>'
    )
  });
  return '*** call<br><table>' + table.join('') + '</table>'; 
}

function process(row) {
  (row.chatmsg_type == 1) && (row.body_xml = "*** invited " + row.identities.split(' ').map(filter.userLink).join(' ') + " to join");
  (row.chatmsg_type == 4) && (row.body_xml = "*** left the chat");
  (row.chatmsg_type == 15) && (row.body_xml = "*** changed the picture");
  (row.chatmsg_type == 11) && (row.body_xml = "*** kicked " + row.identities.split(' ').map(filter.userLink).join(' ') + " from chat");
  (row.chatmsg_type == 18) && (row.body_xml = parseCall(row.body_xml));

  if(row.body_xml == null) { 
    row.body_xml = "*** unsupported chatmsg_type: " + row.chatmsg_type + " (message id: " + row.id + ")";
  }
  (row.body_xml.length == 0) && (row.body_xml = "*** empty message");

  // a little trick to make sure we don't regex replace
  // inside of a tag.
  row.body_xml = ('>' + row.body_xml + '<')
    .replace(/\ \ /g, '&nbsp; ')
    .replace(/\n/g, process.newline_replacer)
    .replace(re, '>$1<b>$2</b>$3<')
    .slice(1, -1);

  row.username = nameMap[row.from_dispname] || false;
  row.rawtimestamp = row.timestamp;
  row.timestamp = timeConvert(new Date(row.timestamp * 1000));
}
// chrome inline-blocks will prepend the elipses on the same line,
// firefox will place them on separate.
process.newline_replacer = navigator.userAgent.search(/WebKit/) > -1 ?
  // chrome
  "<br><pre class='tab'>&nbsp; ... &nbsp;</pre>" :
  // not chrome
  "<br><i class='tab'>&nbsp; ... &nbsp;</i>";

function showChat() {
  var lastChannel;

  query = $("#search").val();
  window.location.hash = query;

  re = new RegExp(">(.*)(" + query + ")(.*)<", 'ig');

  if(window.location.hash.length == 0 && Array.prototype.concat.apply([],
    ev(['+channelIds', '-channelIds', '+userList', '-userList'])).length == 0) {
    return;
  } else {
    $("#instructions").css('display','none');
  }

  $("#results").empty();
  wait.on();
  $.getJSON("api/search.php", _.extend({
      q: query,
      rooms: ev('+channelIds'),
      notRooms: ev('-channelIds'),
      users: ev('+userList'),
      notUsers: ev('-userList')
    }, searchParams)
  , function(res) {
    var data = res.data;
    console.log(res.dbg.join("\n"));
    wait.off();
    if(data.length) {
      _.each(data, function(row) {
        if(!row) { return; }

        process(row);

        var 
          channel = false,
          resultDOM = $("<div class='row result' />"),
          rowDOM = $("<div class='row' />").html(template.search(row));


        if(row.convo_id != lastChannel) {
          lastChannel = row.convo_id;
          $("#results").append(template.channelHeader({ channel: lastChannel}));
        }

        resultDOM.html(template.container({
          row: rowDOM.html()
        })).appendTo("#results");

        $(".expand", resultDOM).click(function(){
          Expand(row.rawtimestamp, row.convo_id, $(this).next(), this);
        })
      });
    } else {
      $("#results").html("<h2>Woops, nothing found for '" + query + "'. Check the spelling?</h2>");
    }
  });
  window.scrollTo(0,0);

  setTimeout(function(){
    ev.isset('convodb', function(d){
      $(".channel-name").each(getChannel);
    });
  }, 1500);
}


$(function(){
  $('body').css('display','block');
  $("#search").val(window.location.hash.slice(1));
  ev('state', 'Chat');

  setInterval(function(){
    if(window.location.hash.slice(1) != query) {
      $("#search").val(window.location.hash.slice(1));
      finderAlias();
    }
  }, 100);
});
