module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        uglify: {
            my_target: {
                files: {
                    'public/js/app.min.js': [
                        'public/js/Services/ItemService.js',
                        'public/js/Services/TemplateService.js',
                        'public/js/main.js',
                        'public/js/router.js'
                    ]
                }
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            target: {
                files: {
                    'public/css/main.min.css': [
                        'public/css/style.css',
                        'public/css/glyphs.css'
                    ]
                }
            }
        }
    });

    // Load required modules
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    // Task definitions
    grunt.registerTask('default', ['uglify', 'cssmin']);
    
};