// CONSTANTS
var threshold = 4;
var scale    = 10;
var baseSize = 100;

// SWIPE THRESHOLD
var leftBound = -3;
var rightBound = 4;
var fuckBound = 14;

// SWIPE TYPES
var SWIPE_LEFT = 0;
var SWIPE_RIGHT = 1;
var SWIPE_FUCK = 2;

// TRACKING VARS
var lastVal = 0;

function logMovement(movement) { 
    var s = ''; 
    while (s.length < movement+10) s += "**"; 
    console.log(s);
}

function sizeBox(movement) {
  var dimension = (baseSize + scale*movement) + 'px';

  document.getElementById('box').style.width  = dimension;
  document.getElementById('box').style.height = dimension;
}

function checkSwipes(movement) {
  if(movement < leftBound) {
    swipeEvent(SWIPE_LEFT);
  } else if(movement < rightBound) {
    document.getElementById('click').innerHTML = "None";
  } else if(movement < fuckBound) {
    swipeEvent(SWIPE_RIGHT);
  } else {
    swipeEvent(SWIPE_FUCK);
  }
}

function swipeEvent(whichSwipe) {
  if(whichSwipe == SWIPE_LEFT) {
    reportSwipeEvent("Left");
  } else if(whichSwipe == SWIPE_RIGHT) {
    reportSwipeEvent("Right");
  } else if(whichSwipe == SWIPE_FUCK) {
    reportSwipeEvent("Fuck");
  }
}

function reportSwipeEvent(swipeEvent) {
  document.getElementById('click').innerHTML = swipeEvent;
  console.log(swipeEvent);
}

window.addEventListener('load', function() {
  window.doppler.init(function(bandwidth) {
    if (bandwidth.left > threshold || bandwidth.right > threshold) {
      var movement = bandwidth.left - bandwidth.right;
      // lower values mean moving towards the microphone, a swipe goes to around -4 for left and +4 for right

      if(lastVal != movement) {
        lastVal = movement;

        logMovement(movement);
        sizeBox(movement);
        checkSwipes(movement);
      }
    }
  });
});