(function () {
    var video = document.querySelector('.camera__video'),
        canvas = document.querySelector('.camera__canvas'),
        context = canvas.getContext('2d'),
        canvasWidth = 640,
        canvasHeight = 480,
        isStreaming = false,
        filterSelect = document.querySelector('.controls__filter'),
        filterName = filterSelect.value;
    
    function oldGetUserMedia(constraints, success, error) {
        var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        
        // Если нет поддержки getUserMedia
        if (!getUserMedia) {
            return Promise.reject(
                new Error('getUserMedia not supported')
            );
        }
        
        return new Promise(function (success, error) {
            getUserMedia.call(navigator, constraints, success, error);
        });
    }
    
    function getVideoStream(callback) {
        // Старые браузеры могут не поддерживать mediaDevices
        if (navigator.mediaDevices === undefined) {
            navigator.mediaDevices = {};
        }
        
        // Некоторые браузеры частично поддерживают mediaDevices
        if (navigator.mediaDevices.getUserMedia === undefined) {
            navigator.mediaDevices.getUserMedia = oldGetUserMedia;
        }
        
        var constraints = {video : true};
        navigator.mediaDevices.getUserMedia(constraints)
            .then(
                function (stream) {
                    var url = window.URL || window.webkitURL;
                    video.src = url ? url.createObjectURL(stream) : stream;
                    video.onloadedmetadata = function () {
                        video.play();

                        callback();
                    };
                }
            )
            .catch(
                function (err) {
                    alert(err); // Выводить алертом ошибку, чтобы каждый мог видеть ее сразу (не только раработчик)
                }
            )
    }

    function applyFilterToPixels(pixels) {
        var i,
            length = pixels.length, // переменная для хранения длины массива
            r,
            g,
            b,
            v,
            filters = {
                invert: function () {
                    for (i = 0; i < length; i += 4) { // i+=4 т.к. 1 пиксель представлен 4-мя значениями rgba соответственно, которые и меняем далее
                        pixels[i] = 255 - pixels[i];
                        pixels[i + 1] = 255 - pixels[i + 1];
                        pixels[i + 2] = 255 - pixels[i + 2];
                    }
                },
                grayscale: function () {
                    for (i = 0; i < length; i += 4) {
                        r = pixels[i];
                        g = pixels[i + 1];
                        b = pixels[i + 2];
                        v = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                        pixels[i] = pixels[i + 1] = pixels[i + 2] = v;
                    }
                },
                threshold: function () {
                    for (i = 0; i < length; i += 4) {
                        r = pixels[i];
                        g = pixels[i + 1];
                        b = pixels[i + 2];
                        v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= 128) ? 255 : 0;
                        pixels[i] = pixels[i + 1] = pixels[i + 2] = v;
                    }
                }
            };

        filterSelect.onchange = function () {
            // Меняем filterName только если изменяется выбранный option элемента <select>,
            // а не каждые 16 миллисекунд
            filterName = this.value;
        };

        return filters[filterName]();
        /*
            Так же можно функции фильтров не вкладывать в цикл for, а просто потом вызывать
            for (var i = 0; i < pixels.length; i += 4){
                filters[filterName]();
            }
            return pixels;
            Но тогда captureFrame() выполняется чуть медленнее

            Можно изменить порядок перебора массива на обратный
            for (i = pixels.length-1; i >= 0; i -= 4) {
              pixels[i - 3]     = 255 - pixels[i - 3];
              pixels[i - 2] = 255 - pixels[i - 2];
              pixels[i - 1] = 255 - pixels[i - 1];
            }
            Но это не принесет существенной оптимизации
        */
    }

    function applyFilter() {
        // Возвращает данные о цвете (RGB) и прозрачности всей канвы
        var imageData = context.getImageData(0, 0, canvasWidth, canvasHeight),
        // Метод  getImageData затратный, поэтому применять его к каждому пикселю отдельно не стоит => применяем сразу ко всей канве
            pixels = imageData.data; //массив значений
        pixels = applyFilterToPixels(pixels); // фильтр
        context.putImageData(imageData, 0, 0); // Помещаем на канву объект imageData
        // putImageData затратный, поступаем также как и с getImageData
    }

    //Баг 879717 в Firefox
    function drawVideo() {
        try {
            context.drawImage(video, 0, 0); // Выводит изображение
            applyFilter();
        } catch (e) {
            if (e.name === "NS_ERROR_NOT_AVAILABLE") {
              // Если ошибка подождать и запустить опять функцию
                setTimeout(drawVideo, 70);
            } else {
                throw e;
            }
        }
    }

    function captureFrame() {
        var start = new Date().getTime();
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
        var el = new Date().getTime() - start;
        console.log(el);

    }

    getVideoStream(function () {
        /*captureFrame();*/

        setInterval(captureFrame, 16);
    });
}());
