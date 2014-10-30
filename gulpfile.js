'use strict';

var gulp, uglify, concat;

gulp = require("gulp");
uglify = require('gulp-uglify');
concat = require('gulp-concat');

gulp.task('js', function () {
  gulp.src(['./csbind-client.js'])
    .pipe(concat('csbind-client.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(''));
});

gulp.task('watch', function () {
  gulp.watch(['./csbind-client.js'], ['js']);
});
