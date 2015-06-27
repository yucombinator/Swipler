window.addEventListener('load', function() {
  window.doppler.init(function(bandwidth) {
    var threshold = 4;
    if (bandwidth.left > threshold || bandwidth.right > threshold) {
        var scale    = 10;
        var baseSize = 100;
        var diff = bandwidth.left - bandwidth.right;
        var dimension = (baseSize + scale*diff) + 'px';

        console.log(dimension);
        document.getElementById('box').style.width  = dimension;
        document.getElementById('box').style.height = dimension;

        if (diff < 13) {
          document.getElementById('click').innerHTML = "Not!";
        } else {
          document.getElementById('click').innerHTML = "Clicked!";
        }
      }
    });
  });