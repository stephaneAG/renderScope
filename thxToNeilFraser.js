
  var canvas, ctx;
  var isDown = false;
  var prevX = 0, currX = 0, prevY = 0, currY = 0;
  var xData = [], yData = [];

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#080';
  ctx.lineWidth = 2;

  canvas.addEventListener('mousemove', mousemove, false);
  canvas.addEventListener('mousedown', mousedown, false);
  canvas.addEventListener('mouseup', mouseup, false);
  canvas.addEventListener('mouseout', mouseup, false);

  function draw() {
    ctx.lineTo(currX, currY);
    ctx.stroke();
    xData.push(clamp(currX));
    yData.push(clamp(256 - currY));
  }

  function clamp(n) {
    // Integer only, 0-255.
    n = Math.round(n);
    return Math.max(0, Math.min(255, n));
  }

  function getXY() {
    var x = 0;
    var y = 0;
    var o = canvas;
    while (o) {
      x += o.offsetLeft;
      y += o.offsetTop;
      o = o.offsetParent;
    }
    try {
      x -= document.scrollingElement.scrollLeft;
      y -= document.scrollingElement.scrollTop;
    } catch (e) { /* MSIE? */}
    return {x: x, y: y};
  }

  function mousemove(e) {
    if (isDown) {
      prevX = currX;
      prevY = currY;
      var xy = getXY();
      currX = e.clientX - xy.x;
      currY = e.clientY - xy.y;
      draw();
    }
  }

  function mousedown(e) {
    // Erase.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    xData.length = 0;
    yData.length = 0;

    // Initialize new drawing path.
    prevX = currX;
    prevY = currY;
    var xy = getXY();
    currX = e.clientX - xy.x;
    currY = e.clientY - xy.y;
    ctx.beginPath();

    isDown = true;
  }

  function mouseup(e) {
    if (isDown) {
      isDown = false;
      ctx.closePath();
      if (xData.length > 1) {
        play();
      }
    }
  }

  function repeatArray(array, n) {
    // Return an array of length n,
    // made of repeated copies of the input array.
    var repeated = array.slice();
    while (repeated.length < n) {
      repeated = repeated.concat(repeated);
    }
    return repeated.slice(0, n);
  }

  function play() {
    // Generate about 10 seconds worth of data.
    var length = 200000;
    var left = repeatArray(yData, length);
    var right = repeatArray(xData, length);

    // Morph the shape after one second.
    var speed = 100000;
    var rotX = 0;
    var rotY = 0;
    var rotZ = 0;
    for (var i = 20000; i < left.length; i++) {
      var p1 = left[i] - 128;
      var p2 = right[i] - 128;
      // Rotate on X and Y axes.
      p1 *= Math.cos(rotX / speed);
      p2 *= Math.cos(rotY / speed);
      // Rotate on Z axis.
      var rotZs = Math.sin(rotZ / speed);
      var rotZc = Math.cos(rotZ / speed);
      var pTemp = p1 * rotZc - p2 * rotZs;
      p2 = p1 * rotZs + p2 * rotZc;
      p1 = pTemp;

      left[i] = clamp(p1 + 128);
      right[i] = clamp(p2 + 128);
      rotX += 4;
      rotY += 3;
      rotZ += 2;
      speed -= 0.5;
    }

    // Play the sound.
    var wav = makeWav(left, right);
    var audio = document.getElementById('audio');
    audio.src = 'data:audio/x-wav;base64,' + btoa(wav);
    audio.play();
  }

  function makeWav(left, right) {
    // Return a stereo WAV file built from the provided data arrays.
    var min = Math.min(left.length, right.length);
    var SubChunk2Size = min * 2;
    // RIFF chunk descriptor.
    var file = 'RIFF';
    file += numToLong(36 + SubChunk2Size);  // ChunkSize
    file += 'WAVE';
    // The 'fmt ' sub-chunk.
    file += 'fmt ';
    file += numToLong(16);  // Subchunk1Size
    file += numToShort(1);  // AudioFormat
    file += numToShort(2);  // NumChannels
    file += numToLong(22050);  // SampleRate
    file += numToLong(22050 * 2);  // ByteRate
    file += numToShort(2);  // BlockAlign
    file += numToShort(8);  // BitsPerSample

    // The 'data' sub-chunk.
    file += 'data';
    file += numToLong(SubChunk2Size);
    for (var i = 0; i < min; i++) {
      file += numToChar(left[i]) + numToChar(right[i]);
    }
    return file;
  }

  function numToChar(num) {
    // num is 0 - 255
    return String.fromCharCode(num);
  }

  function numToShort(num) {
    // num is 0 - 65536
    var b0 = num % 256; // low
    var b1 = (num - b0) / 256; // high
    return String.fromCharCode(b0) + String.fromCharCode(b1);
  }

  function numToLong(num) {
    // num is 0 - 4.2billion
    var b0 = num % 256;
    num = (num - b0) / 256;
    var b1 = num % 256;
    num = (num - b1) / 256;
    var b2 = num % 256;
    num = (num - b2) / 256;
    var b3 = num;
    return String.fromCharCode(b0) + String.fromCharCode(b1) +
        String.fromCharCode(b2) + String.fromCharCode(b3);
  }
