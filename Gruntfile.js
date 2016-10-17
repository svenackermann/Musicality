module.exports = function(grunt) {
    // Do grunt-related things in here
    grunt.initConfig({
    	pkg: grunt.file.readJSON('package.json'),
    	clean: ['build', 'Musicality.zip'],
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
    	},
    	jsonlint: {
    		players: {
    			src: ['json/*.json']
    		}
    	},
    	uglify: {
    		options: {
    			banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
    		},
    		dist: {
    			files: [
    			    {
    			    	expand: true,
    			    	src: ['js/**/*.js', '!js/tp/*.js'],
    			    	dest: 'build/'
    			    },
					{
						src: ['node_modules/dragdealer/src/dragdealer.js'],
						dest: 'build/js/popup/dragdealer.js'
					}
    			]
    		}
    	},
    	cssmin: {
    		dist: {
    			files: {
    				'build/css/options.css' : ['css/options.css'],
    				'build/css/popup.css' : ['css/popup.css']
    			}
    		}
    	},
    	htmlmin: {
    		dist: {
    			options: {
    			  removeComments: true,
    			  collapseWhitespace: true
    			},
    			files: [
    			    {
    			    	expand: true,
    			    	src: ['html/**/*.html'],
    			    	dest: 'build/'
    			    }
    			]
    		}
    	},
    	copy: {
    		default: {
    			files: [
    			    {
    			    	expand: true,
    			    	src: [
    			    	    'images/**/*.png',
    			    	    'css/bootstrap*.css',
    			    	    'js/tp/*.js',
    			    	    'fonts/*',
    			    	    'manifest.json',
    			    	    'json/*.json'
    			    	],
    			    	dest: 'build/'
    			    }
    			]
    		},
			debug: {
				files: [
					{
						expand: true,
						src: [
							'images/**/*.png',
							'css/bootstrap*.css',
							'js/**/*.js',
							'fonts/*',
							'manifest.json',
							'json/*.json'
						],
						dest: 'build/'
					},
					{
						src: ['node_modules/dragdealer/src/dragdealer.js'],
						dest: 'build/js/popup/dragdealer.js'
					}
				]
			}
    	},
    	compress: {
    		dist: {
    			options: {
    				archive: 'Musicality.zip'
    			},
    			files: [
    			    {
    			    	src: ['build/**'],
    			    	dest: ''
    			    }
    			]
    		}
    	}
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('default', [
    	'clean',
    	'jshint',
    	'jsonlint',
    	'uglify',
    	'cssmin',
    	'htmlmin',
    	'copy',
    	'compress'
    	]);

	grunt.registerTask('debug', [
		'clean',
		'jshint',
		'jsonlint',
		'cssmin',
		'htmlmin',
		'copy',
		'compress'
	]);
};