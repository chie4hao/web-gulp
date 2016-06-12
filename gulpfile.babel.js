/**
 * Created by chie on 2016/6/12.
 */
/**
 * Created by chie on 2016/6/12.
 */

/**
 * Created by chie on 2016/6/12.
 */

'use strict';

import gulp from "gulp";
import gulpLoadPlugins from "gulp-load-plugins";
import browserSync from "browser-sync";


const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('html', () => {
    return gulp.src('app/**/*.html')
        .pipe($.useref({
            searchPath: '{.tmp,app}',
            noAssets: true
        }))

        // Minify any HTML
        .pipe($.if('*.html', $.htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            removeOptionalTags: true
        })))
        // Output files
        .pipe($.if('*.html', $.size({title: 'html', showFiles: true})))
        .pipe(gulp.dest('dist'));
});

gulp.task('scripts', () =>
    gulp.src([
            // Note: Since we are not using useref in the scripts build pipeline,
            //       you need to explicitly list your scripts here in the right order
            //       to be correctly concatenated
            './app/scripts/test.js',
            // Other scripts
        ])
        //.pipe($.newer('.tmp/scripts'))
        .pipe($.sourcemaps.init())
        .pipe($.babel())
        .pipe($.sourcemaps.write())
        //.pipe(gulp.dest('.tmp/scripts'))
        //.pipe($.concat('main.js'))
        .pipe($.uglify({preserveComments: 'some'}))
        // Output files
        .pipe($.size({title: 'scripts'}))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('dist/scripts'))
);

gulp.task('js-watch', ['scripts'], reload)

gulp.task('serve', ['scripts'], () => {
    browserSync({
        notify: false,
        // Customize the Browsersync console logging prefix
        logPrefix: 'WSK',
        // Allow scroll syncing across breakpoints
        scrollElementMapping: ['main', '.mdl-layout'],
        // Run as an https by uncommenting 'https: true'
        // Note: this uses an unsigned certificate which on first access
        //       will present a certificate warning in the browser.
        // https: true,
        server: {
            baseDir: 'dist'
        },
        port: 3010,
    });
    setInterval(function(){
        reload();
    },1000)
    gulp.watch(['app/**/*.html'], reload);
    //gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload]);
    gulp.watch(['app/scripts/**/*.js'], ['js-watch']);
    //gulp.watch(['app/images/**/*'], reload);
});

gulp.task('default', ['serve']);