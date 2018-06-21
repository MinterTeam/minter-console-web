// common
const gulp = require('gulp');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const log = require('fancy-log');
const beeper = require('beeper');
// css
const less = require('gulp-less');
const postcss = require('gulp-postcss');
const postcssNormalize = require('postcss-normalize');
const autoprefixer = require('autoprefixer');
const cleanCss = require('gulp-clean-css');
const multiProcess = require('gulp-multi-process');
// images
const del = require('del');
const path = require('path');
const cache = require('gulp-cache');
const imagemin = require('gulp-imagemin');
const mozjpeg = require('imagemin-mozjpeg');
//const pngquant = require('imagemin-pngquant');


let paths = {
    src: {
        less: 'assets/less/*.less',
        img: ['assets/img/**/*.{png,jpg,gif,svg}'],
    },
    dest: {
        css: 'static/css/',
        img: 'static/img/',
    },
    watch: {
        less: 'assets/less/**/*.less',
    },
    cache: {
        tmpDir: 'tmp/',
        cacheDirName: 'gulp-cache',
    },
};


// LESS
gulp.task('less', function () {
    return gulp.src(paths.src.less)
        .pipe(plumber({errorHandler: onError}))
        .pipe(less())
        .pipe(postcss([
            autoprefixer({cascade: false}),
            postcssNormalize({forceImport: true}),
        ]))
        .pipe(cleanCss({
            level: {
                1: {},
                2: {
                    removeUnusedAtRules: true,
                },
            }
        }))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.dest.css));
});




// IMG
gulp.task('imagemin', function () {
    return gulp.src(paths.src.img)
        .pipe(plumber({errorHandler: onError}))
        .pipe(cache(
            imagemin([
                imagemin.gifsicle({interlaced: true}),
                mozjpeg({quality: 90}),
                imagemin.jpegtran({progressive: true}),
                //pngquant(),
                imagemin.optipng({optimizationLevel: 5}),
                imagemin.svgo({plugins: [{removeViewBox: false}]})
            ], {
                verbose: true
            }), {
                fileCache: new cache.Cache(paths.cache),
                name: 'default',
            }))
        .pipe(gulp.dest(paths.dest.img));
});
gulp.task('imagemin:clean', ['imagemin:clean-dest', 'imagemin:clean-cache']);
gulp.task('imagemin:clean-dest', function() {
    return del.sync(paths.dest.img);
});
gulp.task('imagemin:clean-cache', function() {
    return del.sync([
        paths.cache.tmpDir + '/' + paths.cache.cacheDirName + '/default',
    ]);
});



// Полная сборка с вотчем
gulp.task('default', ['less', 'imagemin'], function() {
    gulp.watch(paths.watch.less, () => multiProcess(['less'], () => {}));
    gulp.watch(paths.src.img, ['imagemin']).on('change', function(event) {
        if (event.type === 'deleted') {
            del(paths.dest.img + path.basename(event.path));
        }
    });
    setTimeout(function () {
        log('Watching ...');
    });
});
// Полная сборка без вотча
gulp.task('once', ['less', 'imagemin']);




// Ошибки
let onError = function(error) {
    log([
        (error.name + ' in ' + error.plugin).bold.red,
        '',
        error.message,
        ''
    ].join('\n'));
    beeper();
    this.emit('end');
};


