var 
  h = 0, s = 0.3, v = 0.2;

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

function text(str) {
  return str.replace(/\ /g, '&nbsp;');
}
