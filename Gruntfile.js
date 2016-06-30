/**
 * Created by gd on 16/5/9.
 */
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                jshintrc: true
            },
            all: ['Gruntfile.js', 'src/**/*.js']
        },
        requirejs: {
            compile: {
                options: {
                    baseUrl: 'src',
                    paths: {
                        prism: './'
                    },
                    include: ['main'],
                    name: '../bower_components/almond/almond',
                    out: 'build/prism.min.js',
                    wrap: {
                        startFile: 'src/begin.frag',
                        endFile: 'src/end.frag'
                    }
                }
            },
            debug: {
                options: {
                    baseUrl: 'src',
                    paths: {
                        prism: './'
                    },
                    include: ['main'],
                    name: '../bower_components/almond/almond',
                    out: 'build/prism.min.js',
                    wrap: {
                        startFile: 'src/begin.frag',
                        endFile: 'src/end.frag'
                    },
                    optimize: "none"
                }
            }
        },
        watch: {
            src: {
                files: ['src/**'],
                tasks: ['jshint', 'requirejs:debug']
            }
        },
        connect: {
            server: {
                options: {
                    port: 8917
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');

    // Default task(s).
    grunt.registerTask('default', ['jshint', 'requirejs:compile']);
    grunt.registerTask('test', ['connect', 'watch']);

};