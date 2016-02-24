(function () {
    var video = document.querySelector('.camera__video'),
        canvas = document.querySelector('.camera__canvas'),
        canvasWidth = 640,
        canvasHeight = 480;

    var getVideoStream = function (callback) {
        navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;

        if (navigator.getUserMedia) {
            navigator.getUserMedia({video: true},
                function (stream) {
                    var url = window.URL || window.webkitURL; 
                    video.src = url ? url.createObjectURL(stream) : stream;
                    video.onloadedmetadata = function (e) {
                        video.play();

                        callback();
                    };
                },
                function (err) {
                    console.log("The following error occured: " + err.name);
                }
            );
        } else {
            console.log("getUserMedia not supported");
        }
    };

    var applyFilterToPixels = function (pixels) {
        var filters = {
            invert: function () {
                for (var i = 0; i < pixels.length; i += 4) { // i+=4 т.к. 1 пиксель представлен 4-мя значениями rgba соответственно, которые и меняем далее
                  pixels[i]     = 255 - pixels[i];     
                  pixels[i + 1] = 255 - pixels[i + 1]; 
                  pixels[i + 2] = 255 - pixels[i + 2]; 
                }
            },
            grayscale: function () {
                for (var i = 0; i < pixels.length; i += 4) {
                  var r = pixels[i];
                  var g = pixels[i+1];
                  var b = pixels[i+2];
                  var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                  pixels[i] = pixels[i+1] = pixels[i+2] = v;
                }
            },
            threshold: function () {
                for (var i = 0; i < pixels.length; i += 4) {
                  var r = pixels[i];
                  var g = pixels[i+1];
                  var b = pixels[i+2];
                  var v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= 128) ? 255 : 0;
                  pixels[i] = pixels[i+1] = pixels[i+2] = v;
                }
            }
        };

        var filterName = document.querySelector('.controls__filter').value;

        return filters[filterName]();
    };

    var applyFilter = function () {
        // Возвращает данные о цвете (RGB) и прозрачности всей канвы
        var imageData = canvas.getContext('2d').getImageData(0, 0, canvasWidth,  canvasHeight);
        // Метод  getImageData затратный, поэтому применять его к каждому пикселю отдельно не стоит => применяем сразу ко всей канве
        var pixels = imageData.data; //массив значений
        pixels = applyFilterToPixels(pixels); // фильтр
        canvas.getContext('2d').putImageData(imageData, 0, 0); // Помещаем на канву объект imageData
        // putImageData затратный, поступаем также как и с getImageData 
    };

    var captureFrame = function () {
      if (video.videoWidth > 0) {canvasHeight = video.videoHeight; canvasWidth = video.videoWidth;}
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        // Смещаем координаты и зеркалим
        canvas.getContext('2d').translate(canvasWidth, 0);
        canvas.getContext('2d').scale(-1, 1);

        canvas.getContext('2d').drawImage(video, 0, 0); // Выводит изображение
        applyFilter();
    };

    getVideoStream(function () {
        /*captureFrame();*/

        setInterval(captureFrame, 16);
    });
})();
