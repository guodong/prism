/**
 * Created by gd on 16/6/1.
 */
define(function() {
    function min(a, b) {
        return (a < b) ? a : b;
    }

    function max(a, b) {
        return (a < b) ? b : a;
    }

    var matrix = {
        multiply: function(m1, m2) {
            var result = [];
            for (var i = 0; i < m1.length; i++) {
                result[i] = [];
                for (var j = 0; j < m2[0].length; j++) {
                    var sum = 0;
                    for (var k = 0; k < m1[0].length; k++) {
                        sum += m1[i][k] * m2[k][j];
                    }
                    result[i][j] = sum;
                }
            }
            return result;
        }
    };

    var debug = {
        info: function() {
            var args = [].slice.call(arguments);
            args.unshift('%c Info:', 'color: blue; font-weight: bold; font-style: italic');
            console.log.apply(console, args);
        },
        error: function() {
            var args = [].slice.call(arguments);
            args.unshift('%c Error:', 'color: red; font-weight: bold; font-style: italic');
            console.log.apply(console, args);
        },
        warning: function() {
            var args = [].slice.call(arguments);
            args.unshift('%c Warning:', 'color: #FF6600; font-weight: bold; font-style: italic');
            console.log.apply(console, args);
        },

    };

    function yuv2canvas(yuv, width, height, canvas) {

        canvas.width = width;
        canvas.height = height;

        context = canvas.getContext("2d");
        output = context.createImageData(width, height);
        outputData = output.data;

        yOffset = 0;
        uOffset = width * height;
        vOffset = width * height + (width * height) / 4;
        for (var h = 0; h < height; h++) {
            for (var w = 0; w < width; w++) {
                ypos = w + h * width + yOffset;

                upos = (w >> 1) + (h >> 1) * width / 2 + uOffset;
                vpos = (w >> 1) + (h >> 1) * width / 2 + vOffset;

                Y = yuv[ypos];
                U = yuv[upos] - 128;
                V = yuv[vpos] - 128;

                R = (Y + 1.371 * V);
                G = (Y - 0.698 * V - 0.336 * U);
                B = (Y + 1.732 * U);
                outputData_pos = w * 4 + width * h * 4;
                outputData[0 + outputData_pos] = R;
                outputData[1 + outputData_pos] = G;
                outputData[2 + outputData_pos] = B;
                outputData[3 + outputData_pos] = 255;
            }
        }

        context.putImageData(output, 0, 0);
    }

    function yuv2rgb(y, u, v, width, height, canvas) {
        canvas.width = width;
        canvas.height = height;

        context = canvas.getContext("2d");
        output = context.createImageData(width, height);
        outputData = output.data;

        yOffset = 0;
        uOffset = 0;//width * height;
        vOffset = 0;//width * height + (width * height) / 4;
        for (var h = 0; h < height; h++) {
            for (var w = 0; w < width; w++) {
                ypos = w + h * width + yOffset;

                upos = (w >> 1) + (h >> 1) * width / 2 + uOffset;
                vpos = (w >> 1) + (h >> 1) * width / 2 + vOffset;

                Y = y[w][h];
                U = u[w>>1][h>>1];
                V = v[w>>1][h>>1];

                R = 1.164 * (Y - 16) + 1.594 * (V - 128);
                G = 1.164 * (Y - 16) - 0.813 * (V - 128) + 0.392 * (U - 128);
                B = 1.164 * (Y - 16) + 2.017 * (U - 128);
                outputData_pos = w * 4 + width * h * 4;
                outputData[0 + outputData_pos] = R;
                outputData[1 + outputData_pos] = G;
                outputData[2 + outputData_pos] = B;
                outputData[3 + outputData_pos] = 255;
            }
        }

        context.putImageData(output, 0, 0);
    }

    return {
        min: min,
        max: max,
        matrix: matrix,
        debug: debug,
        yuv2canvas: yuv2canvas,
        yuv2rgb: yuv2rgb
    };
});