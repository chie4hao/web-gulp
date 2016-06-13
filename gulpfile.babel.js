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

import path from 'path';
import gulp from "gulp";
import gulpLoadPlugins from "gulp-load-plugins";
import browserSync from "browser-sync";
import runSequence from 'run-sequence';
import swPrecache from 'sw-precache';
import del from 'del';
import pkg from './package.json';

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

gulp.task('images', () =>
    gulp.src('app/images/**/*')
        .pipe($.cache($.imagemin({
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('dist/images'))
        .pipe($.size({title: 'images'}))
);

gulp.task('styles', () => {
    const AUTOPREFIXER_BROWSERS = [
        'ie >= 10',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
    ];

    // For best performance, don't add Sass partials to `gulp.src`
    return gulp.src([
            'app/styles/**/*.scss',
            'app/styles/**/*.css'
        ])
        .pipe($.newer('.tmp/styles'))
        .pipe($.sourcemaps.init())
        .pipe($.sass({
            precision: 10
        }).on('error', $.sass.logError))
        // Remove any unused CSS
        .pipe($.if('*.css', $.uncss({
            html: [
                'app/index.html'
            ],
            // CSS Selectors for UnCSS to ignore
            ignore: []
        })))

        .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
        .pipe(gulp.dest('.tmp/styles'))
        // Concatenate and minify styles
        .pipe($.if('*.css', $.cssnano()))
        .pipe($.size({title: 'styles'}))
        .pipe($.sourcemaps.write('./'))
        .pipe(gulp.dest('dist/styles'));
});

gulp.task('scripts', () =>
    gulp.src([
            // Note: Since we are not using useref in the scripts build pipeline,
            //       you need to explicitly list your scripts here in the right order
            //       to be correctly concatenated
            './app/scripts/test.js',
            // Other scripts
        ])
        .pipe($.newer('.tmp/scripts'))
        .pipe($.sourcemaps.init())
        .pipe($.babel())
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('.tmp/scripts'))
        //.pipe($.concat('main.js'))
        .pipe($.uglify({preserveComments: 'some'}))
        // Output files
        .pipe($.size({title: 'scripts'}))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('dist/scripts'))
);

gulp.task('clean', () => del(['.tmp', 'dist/*', '!dist/.git'], {dot: true}));

gulp.task('serve', ['scripts','styles'], () => {
    browserSync({
        notify: false,
        // Customize the Browsersync console logging prefix
        logPrefix: 'WSK',
        // Run as an https by uncommenting 'https: true'
        // Note: this uses an unsigned certificate which on first access
        //       will present a certificate warning in the browser.
        // https: true,
        server: {
            baseDir: ['.tmp','app']
        }
    });

    gulp.watch(['app/**/*.html'], reload);
    gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload]);
    gulp.watch(['app/scripts/**/*.js'], ['scripts',reload]);
    gulp.watch(['app/images/**/*'], reload);
});

gulp.task('copy', () =>
    gulp.src([
        'app/*',
        '!app/*.html',
        'node_modules/apache-server-configs/dist/.htaccess'
    ], {
        dot: true
    }).pipe(gulp.dest('dist'))
        .pipe($.size({title: 'copy'}))
);

gulp.task('default', ['clean'], cb =>
    runSequence(
        'styles',
        [ 'html', 'scripts', 'images', 'copy'],
        'generate-service-worker',
        cb
    )
);

gulp.task('copy-sw-scripts', () => {
    return gulp.src(['node_modules/sw-toolbox/sw-toolbox.js', 'app/scripts/sw/runtime-caching.js'])
        .pipe(gulp.dest('dist/scripts/sw'));
});

gulp.task('generate-service-worker', ['copy-sw-scripts'], () => {
    const rootDir = 'dist';
    const filepath = path.join(rootDir, 'service-worker.js');

    return swPrecache.write(filepath, {
        // Used to avoid cache conflicts when serving on localhost.
        cacheId: pkg.name || 'web-starter-kit',
        // sw-toolbox.js needs to be listed first. It sets up methods used in runtime-caching.js.
        importScripts: [
            'scripts/sw/sw-toolbox.js',
            'scripts/sw/runtime-caching.js'
        ],
        staticFileGlobs: [
            // Add/remove glob patterns to match your directory setup.
            `${rootDir}/images/**/*`,
            `${rootDir}/scripts/**/*.js`,
            `${rootDir}/styles/**/*.css`,
            `${rootDir}/*.{html,json}`
        ],
        // Translates a static file path to the relative URL that it's served from.
        // This is '/' rather than path.sep because the paths returned from
        // glob always use '/'.
        stripPrefix: rootDir + '/'
    });
});