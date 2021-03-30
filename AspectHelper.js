// This class allows you to design for a specific set of dimensions,
// but maintain the aspect ratio if the window is a different size.
function AspectHelper(sketch) {
  this.sketch = sketch;
  this.width = sketch.width;
  this.height = sketch.height;
  sketch.resizeCanvas(windowWidth, windowHeight);

  let left, top;
  let scale;

  this.apply = function() {
    //print(sketch.width + ' ' + windowWidth);
    //print(sketch.height + ' ' + windowHeight);
    let aspectH = sketch.width / this.width;
    let aspectV = sketch.height / this.height;
    scale = min(aspectH, aspectV);
    let h = floor(scale * this.height);
    top = (sketch.height - h) / 2;
    let w = floor(scale * this.width);
    left = (sketch.width - w) / 2;
    sketch.translate(left, top);
    sketch.scale(scale, scale);
  };

  this.mouseX = function() {
    return floor((sketch.mouseX - left) / scale);
  };

  this.mouseY = function() {
    return floor((sketch.mouseY - top) / scale);
  };
}
