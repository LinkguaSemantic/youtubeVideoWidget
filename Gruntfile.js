module.exports = function (grunt) {
    'use strict'; // make jshint happy with it

    var packageJson = grunt.file.readJSON('package.json');

    require('load-grunt-tasks')(grunt, {
        pattern: [
            'grunt-*'
        ]
    });

    grunt.initConfig({

        meta: {
            src: 'src',
            tests: 'test',
            out: 'dist',
            widgetName: grunt.file.readJSON('package.json').name
        },

        clean: {
            beforebuild: [
                '<%= meta.out %>'
            ]
        },

        requirejs: {
            compile: {
                options: {
                    baseUrl: "<%= meta.src %>/js",
                    mainConfigFile: "<%= meta.src %>/js/config.js",
                    name: "../../bower_components/almond/almond", // assumes a production build using almond
                    include: ['embed'],
                    out: "<%= meta.out %>/<%= meta.widgetName %>.min.js",
                    //optimize: 'none' //todo: Esto se debe eliminar para produccion final. Sino no crea el .min.js
                }
            }
        },

        // Revisa el codigo de posibles errores.
        jshint: {
            options: {
                force: true
            },
            toConsole: {
                src: ['<%= meta.src %>/**/*.js']
            }
        },

        watch: {
            files: [
                '<%= meta.src %>/**/*.js',
                '<%= meta.src %>/**/*.html',
                '<%= meta.src %>/**/*.scss'
            ],
            tasks: 'build'
        },

        jasmine: {
            src: '<%= meta.src %>/js/models/*.js',
            options: {
                specs: 'specs/**/*.js',
                template: require('grunt-template-jasmine-requirejs'),
                templateOptions: {
                    requireConfig: {
                        baseUrl: ''
                    }
                }
            }
        },
        'copy': {
            dist: {
                files: [
                    {
                        expand: true,
                        dest: '<%= meta.out %>/',
                        src: ['src/images/*.*','src/lang/*.*','widget_testing.html','widget_testing_1.html']
                    }
                ]
            }
        },
        sass: {                              // Task
            dist: {                            // Target
                options: {                       // Target options
                    style: 'expanded'
                },
                files: {                         // Dictionary of files
                    'src/css/linkgua-semantic-styles.css': 'src/css/linkgua-semantic-styles.scss'
                }
            }
        }
    });

    // build
    grunt.registerTask('build', [
        'clean:beforebuild',
        'jshint',
        'sass',
        'requirejs',
        'copy:dist'
    ]);

    //dev
    grunt.registerTask('dev', [
        'watch'
    ]);

    //test
    grunt.registerTask('test', [
        'jshint',
        'jasmine'
    ]);


};