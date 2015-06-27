window.doppler = (function() {
  var AuContext = (window.AudioContext ||
                   window.webkitAudioContext ||
                   window.mozAudioContext ||
                   window.oAudioContext ||
                   window.msAudioContext);

  var ctx = new AuContext();
  var osc = ctx.createOscillator();
  // This is just preliminary, we'll actually do a quick scan
  // (as suggested in the paper) to optimize this.
  var freq = 20000;

  // See paper for this particular choice of frequencies
  var relevantFreqWindow = 33;

  var freqSweepStart = 19000;
  var freqSweepEnd = 22000;

  var getBandwidth = function(analyser, freqs) {
    var primaryTone = freqToIndex(analyser, freq);
    var primaryVolume = freqs[primaryTone];
    // This ratio is totally empirical (aka trial-and-error).
    var maxVolumeRatio = 0.001;

    var leftBandwidth = 0;
    do {
      leftBandwidth++;
      var volume = freqs[primaryTone-leftBandwidth];
      var normalizedVolume = volume / primaryVolume;
    } while (normalizedVolume > maxVolumeRatio && leftBandwidth < relevantFreqWindow);

    var rightBandwidth = 0;
    do {
      rightBandwidth++;
      var volume = freqs[primaryTone+rightBandwidth];
      var normalizedVolume = volume / primaryVolume;
    } while (normalizedVolume > maxVolumeRatio && rightBandwidth < relevantFreqWindow);

    return { left: leftBandwidth, right: rightBandwidth };
  };

  var optimizeFrequency = function(osc, analyser) {
    var oldFreq = osc.frequency.value;

    var audioData = new Uint8Array(analyser.frequencyBinCount);
    var maxAmp = 0;
    var maxAmpIndex = 0;

    var from = freqToIndex(analyser, freqSweepStart);
    var to   = freqToIndex(analyser, freqSweepEnd);
    for (var i = from; i < to; i++) {
      osc.frequency.value = indexToFreq(analyser, i);
      analyser.getByteFrequencyData(audioData);

      if (audioData[i] > maxAmp) {
        maxAmp = audioData[i];
        maxAmpIndex = i;
      }
    }
    // Sometimes the above procedure seems to fail, not sure why.
    // If that happends, just use the old value.
    if (maxAmpIndex == 0) {
      return oldFreq;
    } else {
      return indexToFreq(analyser, maxAmpIndex);
    }
  };
  // CONSTANTS
  var threshold = 4;
  var scale    = 10;
  var baseSize = 100;

  // SWIPE THRESHOLD
  var leftBound = -3;
  var centerLowBound = -1;
  var centerHighBound = 2;
  var rightBound = 4;
  var fuckBound = 14;

  // SWIPE TYPES
  var SWIPE_LEFT = 0;
  var SWIPE_CENTER = 1;
  var SWIPE_RIGHT = 2;
  var SWIPE_FUCK = 3;

  // TRACKING VARS
  var lastVal = 0;
  var state = 0; // -1: left, 0: center, 1: right, 2: fuck

  function logMovement(movement) {
      var s = '';
      while (s.length < movement+10) s += "**";
      console.log(s);
  }

  function checkSwipes(movement, userCallback) {
    if(movement < leftBound) {
      swipeEvent(SWIPE_LEFT, userCallback);
    } else if(movement < centerLowBound) {
      
    } else if(movement < centerHighBound) {
      swipeEvent(SWIPE_CENTER, userCallback);
    } else if(movement < rightBound) {
      
    } else if(movement < fuckBound) {
      swipeEvent(SWIPE_RIGHT, userCallback);
    } else {
      swipeEvent(SWIPE_FUCK, userCallback);
    }
  }

  function swipeEvent(whichSwipe, userCallback) {
    if(whichSwipe == SWIPE_CENTER) {
      if(state == SWIPE_LEFT) {
        userCallback("LEFT");
      }
      if(state == SWIPE_RIGHT) {
        userCallback("RIGHT");
      }
      if(state == SWIPE_FUCK) {
        userCallback("FUCK");
      }
    }
    if(whichSwipe == SWIPE_RIGHT && state == SWIPE_FUCK) {
      userCallback("FUCK");
    }

    state = whichSwipe;
  }
  var readMicInterval = 0;
  var readMic = function(analyser, userCallback) {
    var audioData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(audioData);

    var band = getBandwidth(analyser, audioData);
    if (band.left > threshold || band.right > threshold) {
      var movement = band.left - band.right;
      // lower values mean moving towards the microphone, a swipe goes to around -4 for left and +4 for right

      if(lastVal != movement) {
        lastVal = movement;

        logMovement(movement);
        checkSwipes(movement, userCallback);
      }
    }

    //userCallback(band);

    readMicInterval = setTimeout(readMic, 1, analyser, userCallback);
  };

  var handleMic = function(stream, callback, userCallback) {
    // Mic
    var mic = ctx.createMediaStreamSource(stream);
    var analyser = ctx.createAnalyser();

    analyser.smoothingTimeConstant = 0.5;
    analyser.fftSize = 2048;

    mic.connect(analyser);

    // Doppler tone
    osc.frequency.value = freq;
    osc.type = osc.SINE;
    osc.start(0);
    osc.connect(ctx.destination);

    // There seems to be some initial "warm-up" period
    // where all frequencies are significantly louder.
    // A quick timeout will hopefully decrease that bias effect.
    setTimeout(function() {
      // Optimize doppler tone
      freq = optimizeFrequency(osc, analyser, 19000, 22000);
      osc.frequency.value = freq;

      clearInterval(readMicInterval);
      callback(analyser, userCallback);
    });
  };

  var freqToIndex = function(analyser, freq) {
    var nyquist = ctx.sampleRate / 2;
    return Math.round( freq/nyquist * analyser.fftSize/2 );
  };

  var indexToFreq = function(analyser, index) {
    var nyquist = ctx.sampleRate / 2;
    return nyquist/(analyser.fftSize/2) * index;
  };

  return {
    init: function(callback) {
      ctx.resume();
      navigator.getUserMedia_ = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
      navigator.getUserMedia_({ audio: { optional: [{ echoCancellation: false }] } }, function(stream) {
        handleMic(stream, readMic, callback);
      }, function() { console.log('Error!') });
    },
    stop: function () {
      clearInterval(readMicInterval);
      ctx.suspend();
    }
  }
})(window, document);
