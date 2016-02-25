(function () {
    var video = document.querySelector('.camera__video'),
        canvas = document.querySelector('.camera__canvas'),
        context = canvas.getContext('2d');
        canvasWidth = 640,
        canvasHeight = 480,
        isStreaming = false;

    function getVideoStream(callback) {
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
                    alert("The following error occured: " + err.name); 
                }
            );
        } else {
            alert("getUserMedia not supported"); // Выводить алертом ошибку, чтобы каждый мог видеть ее сразу (не только раработчик)
        }
    };

    function applyFilterToPixels(pixels) {
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

    function applyFilter() {
        // Возвращает данные о цвете (RGB) и прозрачности всей канвы
        var imageData = context.getImageData(0, 0, canvasWidth,  canvasHeight);
        // Метод  getImageData затратный, поэтому применять его к каждому пикселю отдельно не стоит => применяем сразу ко всей канве
        var pixels = imageData.data; //массив значений
        pixels = applyFilterToPixels(pixels); // фильтр
        context.putImageData(imageData, 0, 0); // Помещаем на канву объект imageData
        // putImageData затратный, поступаем также как и с getImageData 
    };

    function captureFrame() {
        // Делаем операции с канвой только раз, чтобы они не выполнялись каждые 16 миллисекунд
        if (!isStreaming) { 
            if (video.videoWidth > 0) {
                canvasHeight = video.videoHeight;
                canvasWidth = video.videoWidth;
            }
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            // Смещаем координаты и зеркалим
            context.translate(canvasWidth, 0);
            context.scale(-1, 1);
            isStreaming = true;
        }

        drawVideo();
       
    };

    //Баг 879717 в Firefox
    function drawVideo() {
      try {
        context.drawImage(video, 0, 0); // Выводит изображение
        applyFilter();
      } catch (e) {
        if (e.name == "NS_ERROR_NOT_AVAILABLE") {
          // Если ошибка подождать и запустить опять функцию
          setTimeout(drawVideo, 70);
        } else {
          throw e;
        }
      }
    }

    getVideoStream(function () {
        /*captureFrame();*/

        setInterval(captureFrame, 16);
    });
})();
