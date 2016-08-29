(function(e){
	var api = {};
	e.simplecanvas=api;
	e.sc=api;
    e.그리기 = api;
    width = function(e) {
        return parseInt(getComputedStyle(e).width);
    };
    height = function(e) {
        return parseInt(getComputedStyle(e).height);
    };
	var W = null;
	var H = null;
    var OW = null;
    var OH = null;
	var canvas = null;
	var context = null;
	var rawData = null;
	api.init = function(width, height, border) {
		canvas = document.createElement('canvas');
        if (border)
            canvas.style.border = "1px solid grey";
		W = width;
		H = height;
		canvas.width = width;
		canvas.height = height;
		var parentDiv = document.querySelector('body');
        parentDiv.style.userSelect = 'none';
        parentDiv.style.mozUserSelect = 'none';
        parentDiv.style.webkitUserSelect = 'none';
		parentDiv.appendChild(canvas);
        /*
		var p = document.createElement('p');
		p.id = 'simplecanvs_fps';
		parentDiv.appendChild(p)
        */
		context = canvas.getContext('2d');
        context.imageSmoothingEnabled= false;
        api.context = context;
        return canvas;
	};
	api.putpixel = function(x, y, c) {
		//x = Math.floor(x);
		//y = Math.floor(y);
		x = x>>0;
		y = y>>0;
		/*
		var p = x+y*W;
		p *= 4;
		rawData.data[p + 0] = r;
		rawData.data[p + 1] = g;
		rawData.data[p + 2] = b;
		rawData.data[p + 3] = a;
		*/
		//if (a == undefined) a = 255;
		//context.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (a / 255) + ')';
		//if (c.length == 3)
			//context.strokeStyle = 'rgb(' + c + ')';
		//else
			//context.strokeStyle = 'rgba(' + c + ')';
		if (c.length == 3)
			context.fillStyle = 'rgb(' + c + ')';
		else
			context.fillStyle = 'rgba(' + c + ')';
		context.fillRect(x,y,1,1);
		//context.moveTo(x,y);
		//context.lineTo(x+1,y);
	};
    api.line = function(x1, y1, x2, y2, c) {
		if (c.length == 3)
			context.strokeStyle = 'rgb(' + c + ')';
		else
			context.strokeStyle = 'rgba(' + c + ')';
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
    }
    api.circle = function(x, y, r, c) {
        context.stroke();
        context.beginPath();
		if (c.length == 3)
			context.fillStyle = 'rgb(' + c + ')';
		else
			context.fillStyle = 'rgba(' + c + ')';
        context.arc(x, y, r, 0, 2*Math.PI);
        context.fill();
        context.beginPath();
    };
	api.putrectangle = function(x, y, w, h, c) {
		//x = Math.floor(x);
		//y = Math.floor(y);
		x = x>>0;
		y = y>>0;
		w = w>>0;
		h = h>>0;
		/*
		var p = x+y*W;
		p *= 4;
		rawData.data[p + 0] = r;
		rawData.data[p + 1] = g;
		rawData.data[p + 2] = b;
		rawData.data[p + 3] = a;
		*/
		//if (a == undefined) a = 255;
		if (c.length == 3)
            context.fillStyle = 'rgb(' + c + ')';
		else
            context.fillStyle = 'rgba(' + c + ')';
		context.fillRect(x,y,w,h);
	};
    api.rectangle = api.putrectangle;
	api.run = function(f) {
		context.beginPath();
		f();
		context.stroke();
	};

var onEachFrame;

if (window.requestAnimationFrame) {
  onEachFrame = function(cb) {
    var _cb,
      _this = this;
    _cb = function() {
      cb();
      return window.requestAnimationFrame(_cb);
    };
    return _cb();
  };
} else if (window.webkitRequestAnimationFrame) {
  onEachFrame = function(cb) {
    var _cb,
      _this = this;
    _cb = function() {
      cb();
      return window.webkitRequestAnimationFrame(_cb);
    };
    return _cb();
  };
} else if (window.mozRequestAnimationFrame) {
  onEachFrame = function(cb) {
    var _cb,
      _this = this;
    _cb = function() {
      cb();
      return window.mozRequestAnimationFrame(_cb);
    };
    return _cb();
  };
} else {
  onEachFrame = function(cb) {
    return setInterval(cb, 1000 / 60);
  };
}


	api.load_image = function(url) {
		var img = new Image();
		img.src = url;
		return img;
	}
	api.draw_image = function(x,y,img) {
		context.drawImage(img, Math.floor(x), Math.floor(y));
	}
	api.text = function(x,y,text,size,c) {
		context.fillStyle = "rgb("+c+")";
		context.font = size+"px monospace";
		context.fillText(text, Math.floor(x), Math.floor(y));
	}
	api.clear = function(c) {
		if (c)
		{
			context.fillStyle = "rgb("+c+")";
			context.fillRect(0,0,W,H);
		}
		else
			context.clearRect(0,0,W,H);
	}

    api.on = function(e, f) {
        window.addEventListener(e, f);
    }

	api.onkeydown = function(f) {
		document.onkeydown = function(e) {
			f(e.keyCode);
		}
	}

	api.mainloop = function(f) {
		onEachFrame(function(){
            var force_redraw = false;
            if (OW != width(canvas) || OH != height(canvas)) {
                OW = width(canvas);
                OH = height(canvas);
                /*
                canvas.width = OW;
                canvas.height = OH;
                octx = context;
                //context = canvas.getContext('2d');
                context.scale(canvas.width/W, canvas.height/H);
                console.log(OW, OH, W, H, canvas.width/W, canvas.height/H);
                */
                force_redraw = true;
            }
			//var t = (new Date).getTime();
			context.beginPath();
			f(force_redraw);
			context.stroke();
			//var t2 = (new Date).getTime();
//$("#simplecanvs_fps").text((t2-t) + ' ' + (pxcnt-oldpxcnt));
		});
	}

    api.random = function(l, r) {
        if (!r) {
            if (!l) {
                return Math.random();
            } else {
                r = l;
                l = 0;
            }
        }
        return Math.floor(Math.random()*(r-l))+l;
    }

    api.randdice = function(d) {
        return Math.floor(Math.random()*d)+1;
    }

    api.준비= api.init;
    api.점 = api.putpixel;
    api.원 = api.circle;
    api.선 = api.line;
    api.사각형 = api.rectangle;
    api.반복 = api.mainloop;
    api.지우기 = api.clear;
    api.이벤트 = api.on;
    api.이미지준비 = api.load_image;
    api.이미지 = api.draw_image;
    api.랜덤 = api.random;
    api.주사위 = api.randdice;
})(window);
