module.exports = function(grunt) {
    // Do grunt-related things in here
    grunt.initConfig({
    	pkg: grunt.file.readJSON('package.json'),
    	concat: {
    		options: {
    			separator: ';'
    		},
    		background: {
    			src: ['js/background/*.js'],
    			dest: 'build/<%= pkg.name %>.background.js'
    		}
    	},
    	uglify: {
    		options: {
    			banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
    		},
    		dist: {
    			files: {
    				'build/<%= pkg.name %>.background.min.js' : ['<%= concat.background.dest %>'],
    				'build/popup.min.js' : ['js/popup/popup.js'],
    				'build/options.min.js' : ['js/options/options.js'],
    				'build/contentscript.min.js' : ['js/contentscript/contentscript.js']
    			}
    		}
    	},
    	jshint: {
    		files: ['Gruntfile.js', 'js/background/*.js', 'js/popup/*.js', 'js/options/*.js', 'js/contentscript/contentscript.js'],
    		options: {
    			loopfunc: true,
    			evil: true, // contentscript needs eval by design
    			globals: {
    				jQuery: true,
    				console: true
    			}
    		}
    	}
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
};