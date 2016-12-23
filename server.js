var express = require('express');
var app = express();
var browserify = require('browserify-middleware');


app.get('/gl-draw-foxgis.js', browserify('./index.js', {
    standalone: 'mapbox-gl-draw',
    debug: true,
    cache: 'dynamic',
    minify: false
}));

app.get('/mapbox-gl.js', browserify('./node_modules/mapbox-gl/js/mapbox-gl.js',{
    standalone: 'mapboxgl',
    debug: true,
    cache: 'dynamic'
}));

app.get('/mapbox-gl.css', function(req, res) {
    res.sendFile(__dirname+ '/node_modules/mapbox-gl/dist/mapbox-gl.css');
});

app.get('/bench/index.js', browserify('./bench/index.js', {
    transform: ['unassertify', 'envify'],
    debug: true,
    minify: true,
    cache: 'dynamic'
}));

app.get('/bench/:name', function(req, res) {
    res.sendFile(__dirname + '/bench/index.html');
});

app.use('/debug', express.static(__dirname + '/debug'));
app.use('/dist', express.static(__dirname + '/dist'));


var port = process.env.PORT || 9967;

app.listen(port, function () {
    console.log('gl-draw-foxgis debug server running at http://localhost:' + port);
});
