/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2017, Codrops
 * http://www.codrops.com
 */
;(function(window) {

	// Helper vars and functions.
	function extend( a, b ) {
		for( var key in b ) { 
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	// Random number.
	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	// from http://www.quirksmode.org/js/events_properties.html#position
	function getMousePos(e) {
		var posx = 0;
		var posy = 0;
		if (!e) var e = window.event;
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft
				+ document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop
				+ document.documentElement.scrollTop;
		}
		return {
			x : posx,
			y : posy
		}
	}

	// From https://davidwalsh.name/javascript-debounce-function.
	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};

	/**
	 * PieceMaker obj.
	 */
	function PieceMaker(el, options) {
		this.el = el;
		this.options = extend({}, this.options);
		extend(this.options, options);
		this._init();
	}

	/**
	 * PieceMaker default options.
	 */
	PieceMaker.prototype.options = {
		// Number of pieces / Layout (rows x cols).
		pieces: {rows: 14, columns: 10},
		// Main image tilt: max and min angles.
		tilt: {maxRotationX: -2, maxRotationY: 3, maxTranslationX: 6, maxTranslationY: -2}
	};

	/**
	 * Init. Create layout and initialize/bind any events.
	 */
	PieceMaker.prototype._init = function() {
		// The source of the main image.
		this.imgsrc = this.el.style.backgroundImage.replace('url(','').replace(')','').replace(/\"/gi, "");
		// Window sizes.
		this.win = {width: window.innerWidth, height: window.innerHeight};
		// Container sizes.
		this.dimensions = {width:this.el.offsetWidth, height:this.el.offsetHeight};
		// Render all the pieces defined in the options.
		this._layout();
		// Init tilt.
		this.initTilt();
		// Init/Bind events
		this._initEvents();
	};

	/**
	 * Renders all the pieces defined in the PieceMaker.prototype.options.
	 */
	PieceMaker.prototype._layout = function() {
		this.el.style.backgroundImage = this.el.getAttribute('data-img-code');

		// Create the pieces and add them to the DOM (append it to the main element).
		this.pieces = [];
		for (let r = 0; r < this.options.pieces.rows; ++r) {
			for (let c = 0; c < this.options.pieces.columns; ++c) {
				const piece = this._createPiece(r,c);	
				piece.style.backgroundPosition = -1*c*100 + '% ' + -1*100*r + '%';
				this.pieces.push(piece);
			}
		}
	};

	/**
	 * Create a piece.
	 */
	PieceMaker.prototype._createPiece = function(row, column) {
		const w = Math.round(this.dimensions.width/this.options.pieces.columns),
			  h = Math.round(this.dimensions.height/this.options.pieces.rows),
			  piece = document.createElement('div');

		piece.style.backgroundImage = 'url(' + this.imgsrc + ')';
		piece.className = 'piece';
		piece.style.width = w + 'px';
		piece.style.height = h + + 'px';
		piece.style.backgroundSize = w * this.options.pieces.columns + 'px auto';
		piece.setAttribute('data-column', column);
		piece.setAttribute('data-delay', anime.random(-25,25));
		this.el.appendChild(piece);
		this.el.style.width = w * this.options.pieces.columns + 'px';
		this.el.style.height = h * this.options.pieces.rows + 'px';

		return piece;
	};

	/**
	 * Init tilt.
	 */
	PieceMaker.prototype.initTilt = function() {
		if( is3DBuggy ) return;
		this.el.style.transition = 'transform 0.2s ease-out';
		this.tilt = true;
	};

	/**
	 * Remove tilt.
	 */
	PieceMaker.prototype.removeTilt = function() {
		if( is3DBuggy ) return;
		this.tilt = false;
	};

	/**
	 * Init/Bind Events.
	 */
	PieceMaker.prototype._initEvents = function() {
		const self = this,
			  // Mousemove event / Tilt functionality.
			  onMouseMoveFn = function(ev) {
				requestAnimationFrame(function() {
					if( !self.tilt ) {
						if( is3DBuggy ) {
							self.el.style.transform = 'none';
						}
						return false;
					}
					const mousepos = getMousePos(ev),
						  rotX = 2*self.options.tilt.maxRotationX/self.win.height*mousepos.y - self.options.tilt.maxRotationX,
						  rotY = 2*self.options.tilt.maxRotationY/self.win.width*mousepos.x - self.options.tilt.maxRotationY,
						  transX = 2*self.options.tilt.maxTranslationX/self.win.width*mousepos.x - self.options.tilt.maxTranslationX,
						  transY = 2*self.options.tilt.maxTranslationY/self.win.height*mousepos.y - self.options.tilt.maxTranslationY;

					self.el.style.transform = 'perspective(1000px) translate3d(' + transX + 'px,' + transY + 'px,0) rotate3d(1,0,0,' + rotX + 'deg) rotate3d(0,1,0,' + rotY + 'deg)';
				});
			  },
			  // Window resize.
			  debounceResizeFn = debounce(function() {
				self.win = {width: window.innerWidth, height: window.innerHeight};
				self.el.style.width = self.el.style.height = '';
				const elBounds = self.el.getBoundingClientRect();
				self.dimensions = {width: elBounds.width, height: elBounds.height};
				for(let i = 0, len = self.pieces.length; i < len; ++i) {
					const w = Math.round(self.dimensions.width/self.options.pieces.columns),
						  h = Math.round(self.dimensions.height/self.options.pieces.rows),
						  piece = self.pieces[i];
					
					piece.style.width = w + 'px';
					piece.style.height = h + 'px';
					piece.style.backgroundSize = w * self.options.pieces.columns + 'px auto';
					self.el.style.width = w * self.options.pieces.columns + 'px';
					self.el.style.height = h * self.options.pieces.rows + 'px';
				}
			  }, 10);

		document.addEventListener('mousemove', onMouseMoveFn);
		window.addEventListener('resize', debounceResizeFn);
	};

	/**
	 * Squares loop effect (Main image)
	 */
	PieceMaker.prototype.loopFx = function() {
		this.isLoopFXActive = true;
		// Switch main image's background image:
		this.el.style.backgroundImage = this.el.getAttribute('data-img-alt');

		const self = this;
		anime.remove(this.pieces);
		anime({
			targets: this.pieces,
			duration: 50,
			easing: 'linear',
			opacity: [
				{
					value: function(t,i) {
						return !anime.random(0,5) ? 0 : 1;
					},
					delay: function(t,i) {
						return anime.random(0,2000);
					}
				},
				{
					value: 1,
					delay: function(t,i) {
						return anime.random(200,2000);	
					}
				}
			],
			complete: function() {
				if( self.isLoopFXActive ) {
					self.loopFx();
				}
			}
		});
	};

	/**
	 * Stop the loop effect.
	 */
	PieceMaker.prototype.stopLoopFx = function() {
		this.isLoopFXActive = false;
		this.el.style.backgroundImage = this.el.getAttribute('data-img-code');
		anime.remove(this.pieces);
		for(let i = 0, len = this.pieces.length; i < len; ++i) {
			this.pieces[i].style.opacity = 1;
		}
	};

	/**
	 * Animate the pieces.
	 */
	PieceMaker.prototype.animatePieces = function(dir, callback) {
		const self = this;
		anime.remove(this.pieces);
		anime({
			targets: this.pieces.reverse(),
			duration: dir === 'out' ? 600 : 500,
			delay: function(t,i) {
				return Math.max(0,i*6 + parseInt(t.getAttribute('data-delay')));
			},
			easing: dir === 'out' ? [0.2,1,0.3,1] : [0.8,1,0.3,1],
			translateX: dir === 'out' ? function(t,i) { 
				return t.getAttribute('data-column') < self.options.pieces.columns/2 ? anime.random(50,100) : anime.random(-100,-50);
			} : function(t,i) { 
				return t.getAttribute('data-column') < self.options.pieces.columns/2 ? [anime.random(50,100),0] : [anime.random(-100,-50),0];
			},
			translateY: dir === 'out' ? function(t,i) { 
				return [0,anime.random(-1000,-800)]; 
			} : function(t,i) { 
				return [anime.random(-1000,-800), 0]; 
			},
			opacity: {
				value: dir === 'out' ? 0 : 1,
				duration: dir === 'out' ? 600 : 300,
				easing: 'linear'
			},
			complete: callback
		});
	};

	/**
	 * Custom effect on the pieces.
	 */
	PieceMaker.prototype.fxCustom = function(dir) {
		this.fxCustomTriggered = true;
		const self = this;
		anime({
			targets: this.pieces.reverse().filter(function(t) {
				return t.getAttribute('data-column') < self.options.pieces.columns/2
			}),
			duration: dir === 'left' ? 400 : 200,
			easing: dir === 'left' ? [0.2,1,0.3,1] : [0.8,0,0.7,0],
			delay: function(t,i,c) {
				return dir === 'left' ? Math.max(0,i*5 + parseInt(t.getAttribute('data-delay'))) : Math.max(0,(c-1-i)*2 + parseInt(t.getAttribute('data-delay')));
			},
			translateX: function(t,i) { 
				return dir === 'left' ? anime.random(-500,-100) : [anime.random(-500,-100), 0];
			},
			translateY: function(t,i) { 
				return dir === 'left' ? anime.random(0,100) : [anime.random(0,100), 0];
			},
			opacity: {
				duration: dir === 'left' ? 200 : 200,
				value: dir === 'left' ? 0 : [0,1],
				easing: dir === 'left' ? 'linear' : [0.8,0,0.7,0]
			}
		});
	};

	/**
	 * Reset effect.
	 */
	PieceMaker.prototype.fxCustomReset = function(dir, callback) {
		this.fxCustomTriggered = false;
		const self = this;
		anime.remove(this.pieces);
		anime({
			targets: this.pieces.reverse().filter(function(t) {
				return t.getAttribute('data-column') < self.options.pieces.columns/2
			}),
			duration: dir === 'left' ? 200 : 400,
			easing: dir === 'left' ? [0.8,0,0.7,0] : [0.2,1,0.3,1],
			delay: function(t,i,c) {
				return dir === 'left' ? Math.max(0,(c-1-i)*2 + parseInt(t.getAttribute('data-delay'))) : Math.max(0,i*5 + parseInt(t.getAttribute('data-delay')));
			},
			translateX: function(t,i) {
				return dir === 'left' ? 0 : anime.random(-500,-100);
			},
			translateY: function(t,i) {
				return dir === 'left' ? 0 : anime.random(0,100);
			},
			opacity: {
				duration: dir === 'left' ? 200 : 200,
				value: dir === 'left' ? 1 : [1,0],
				easing: dir === 'left' ? [0.8,0,0.7,0] : 'linear'
			},
			complete: callback
		});
	};

	window.PieceMaker = PieceMaker;

	/**
	 * GlitchFx obj.
	 */
	function GlitchFx(elems, options) {
		this.elems = [].slice.call(elems);
		this.options = extend({}, this.options);
		extend(this.options, options);
		this.glitch();
	}

	/**
	 * GlitchFx default options.
	 */
	GlitchFx.prototype.options = {
		// Max and Min values for the time when to start the glitch effect.
		glitchStart: {min: 500, max: 4000},
		// Max and Min values of time that an element keeps each glitch state. 
		// In this case we are alternating classes so this is the time that an element will have one class before it gets replaced.
		glitchState: {min: 50, max: 250},
		// Number of times the class is changed per glitch iteration.
		glitchTotalIterations: 6
	};

	/**
	 * Glitch fn.
	 */
	GlitchFx.prototype.glitch = function() {
		this.isInactive = false;
		const self = this;
		clearTimeout(this.glitchTimeout);
		this.glitchTimeout = setTimeout(function() {
			self.iteration = 0;
			self._glitchState(function() {
				if( !self.isInactive ) {
					self.glitch();
				}
			});
		}, getRandomInt(this.options.glitchStart.min, this.options.glitchStart.max));
	};

	/**
	 * Glitch iteration fn.
	 */
	GlitchFx.prototype._glitchState = function(callback) {
		const self = this;

		if( this.iteration < this.options.glitchTotalIterations ) {
			this.glitchStateTimeout = setTimeout(function() {
				self.elems.forEach(function(el) {
					if( el.classList.contains('mode--code') ) {
						el.classList.add('mode--design');
						el.classList.remove('mode--code');
					}
					else {
						el.classList.add('mode--code');
						el.classList.remove('mode--design');
					}
					el.style.transform = self.iteration%2 !== 0 ? 'translate3d(0,0,0)' : 'translate3d(' + getRandomInt(-5,5) + 'px,' + getRandomInt(-5,5) + 'px,0)';
				});

				self.iteration++;
				if( !self.isInactive ) {
					self._glitchState(callback);
				}
				
			}, getRandomInt(this.options.glitchState.min, this.options.glitchState.max));
		}
		else {
			callback.call();
		}
	};

	GlitchFx.prototype.stopGlitch = function() {
		this.isInactive = true;
		clearTimeout(this.glitchTimeout);
		clearTimeout(this.glitchStateTimeout);
		// Reset styles.
		this.elems.forEach(function(el) {
			if( el.classList.contains('mode--code') ) {
				el.classList.add('mode--design');
				el.classList.remove('mode--code');
				el.style.transform = 'translate3d(0,0,0)';
			}
		});
	};

	window.GlitchFx = GlitchFx;

	const DOM = {}, is3DBuggy = navigator.userAgent.indexOf('Firefox') > 0;
	let pm, gfx;
	DOM.body = document.body;
	DOM.loading = document.querySelector('.loading');
	DOM.switchCtrls = document.querySelector('.switch');
	DOM.switchModeCtrls = {
		'design' : DOM.switchCtrls.firstElementChild,
		'code' : DOM.switchCtrls.lastElementChild
	};
	DOM.pieces = document.querySelector('.pieces');
	DOM.glitchElems = document.querySelectorAll('[data-glitch]');
	DOM.contact = {
		el: document.querySelector('.contact-link')
	};
	DOM.title = {
		el: document.querySelector('.title > .title__inner')
	};
	DOM.menuCtrl = document.querySelector('.btn--menu');
	DOM.menu = {
		'design' : {
			'wrapper': document.querySelector('.menu'),
			'items': document.querySelector('.menu').firstElementChild.querySelectorAll('.menu__inner a')
		},
		'code' : {
			'wrapper': document.querySelector('.menu--code'),
			'items': document.querySelectorAll('.menu--code > .menu__inner a')
		}
	};
	DOM.overlay = document.querySelector('.overlay');
	// The current mode.
	let mode = 'design', disablePageFx, isAnimating;

	function init() {
		imagesLoaded(DOM.body, { background: true }, function() {
			// Remove page loader.
			DOM.loading.classList.add('loading--hide');
			// Create the image pieces.
			pm = new PieceMaker(DOM.pieces);
			// Start the squares loop effect on the main image.
			pm.loopFx();
			// Glitch effect on some elements (title, contact and coder link) in the page.
			gfx = new GlitchFx(DOM.glitchElems);
			// Split the title, contact and code menu items into spans/letters.
			wordsToLetters();
			// Init/Bind events
			initEvents();
		});
	}

	function wordsToLetters() {
		// Title.
		charming(DOM.title.el);
		DOM.title.letters = [].slice.call(DOM.title.el.querySelectorAll('span'));
		// Contact.
		charming(DOM.contact.el);
		DOM.contact.letters = [].slice.call(DOM.contact.el.querySelectorAll('span'));
		// Menu items (code mode).
		DOM.menuCodeItemLetters = [];
		[].slice.call(DOM.menu.code.items).forEach(function(item) {
			charming(item);
			DOM.menuCodeItemLetters.push([].slice.call(item.querySelectorAll('span')));
		});
	}

	function initEvents() {
		DOM.switchModeCtrls.design.addEventListener('click', switchMode);
		DOM.switchModeCtrls.code.addEventListener('click', switchMode);

		const pauseFxFn = function() {
				pm.stopLoopFx();
				gfx.stopGlitch();
				pm.removeTilt();
			  },
			  playFxFn = function() {
				pm.loopFx();
				if( gfx.isInactive ) {
					gfx.glitch();
				}
				pm.initTilt();
			  },
			  contactMouseEnterEvFn = function(ev) {
				if( isAnimating ) return false;
				if( mode === 'design' ) {
					pauseFxFn();
				}
				pm.fxCustom(mode === 'design' ? 'left' : 'right');
			  },
			  contactMouseLeaveEvFn = function(ev) {
			  	if( isAnimating || !pm.fxCustomTriggered ) return false;
				pm.fxCustomReset(mode === 'design' ? 'left' : 'right', function() {
					if( !disablePageFx ) {
						playFxFn();
					}
				});
			  },
			  switchMouseEnterEvFn = function(ev) {
				if( disablePageFx || isAnimating ) return;
				pauseFxFn();
			  },
			  switchMouseLeaveEvFn = function(ev) {
				if( disablePageFx || isAnimating ) return;
				playFxFn();
			  };
		
		DOM.contact.el.addEventListener('mouseenter', contactMouseEnterEvFn);
		DOM.contact.el.addEventListener('mouseleave', contactMouseLeaveEvFn);
		DOM.switchCtrls.addEventListener('mouseenter', switchMouseEnterEvFn);
		DOM.switchCtrls.addEventListener('mouseleave', switchMouseLeaveEvFn);
	}

	function switchMode(ev) {
		ev.preventDefault();

		if( isAnimating ) {
			return false;
		}
		isAnimating = true;
		
		// mode: design||code.
		mode = ev.target === DOM.switchModeCtrls.code ? 'code' : 'design';

		switchOverlay();

		if( mode === 'code' ) {
			disablePageFx = true;
			pm.removeTilt();
			pm.stopLoopFx();
			gfx.stopGlitch();
		}
		
		// Change current class on the designer/coder links.
		DOM.switchModeCtrls[mode === 'code' ? 'design' : 'code'].classList.remove('switch__item--current');
		DOM.switchModeCtrls[mode].classList.add('switch__item--current');
		
		// Switch the page content.
		switchContent();
		
		// Animate the pieces.
		pm.animatePieces(mode === 'code' ? 'out' : 'in', function() {
			isAnimating = false;
			if( mode === 'design' ) {
				pm.initTilt();
				pm.loopFx();
				gfx.glitch();
				disablePageFx = false;
			}
		});
	}

	function switchOverlay() {
		anime.remove(DOM.overlay);
		anime({
			targets: DOM.overlay,
			duration: 800,
			easing: 'linear',
			opacity: mode === 'code' ? 1 : 0
		});
	}

	function switchContent() {
		// Change switchCtrls mode.
		DOM.switchCtrls.classList.remove('mode--' + (mode === 'code' ? 'design' : 'code'));
		DOM.switchCtrls.classList.add('mode--' + mode);

		if( mode === 'code' ) {
			switchToCode();
		}
		else {
			switchToDesign();	
		}
	}

	function switchToCode() {
		const hideDesign = function(target, callback) {
					let animeOpts = {};

					if( typeof target === 'string' ) {
						animeOpts.targets = DOM[target].el || DOM[target];
						animeOpts.duration = 400;
						animeOpts.easing = 'easeInQuint';
						animeOpts.scale = 0.3;
					}
					else {
						animeOpts.targets = target;
						animeOpts.duration = 100;
						animeOpts.delay = function(t,i) {
							return i*100;
						};
						animeOpts.easing = 'easeInQuad';
						animeOpts.translateY = '-75%';
					}

					animeOpts.opacity = {value: 0, easing: 'linear'};
					animeOpts.complete = callback;

					anime.remove(animeOpts.targets);
					anime(animeOpts);
			  },
			  showCode = function(target) {
					const el = DOM[target].el || DOM[target];

					if( target === 'title' || target === 'contact' || target === 'menuCtrl' ) {
						el.classList.remove('mode--design');
						el.classList.add('mode--code');
					}
					if( DOM[target].letters ) {
						animateLetters(DOM[target].letters, 'in', {
							begin: function() {
								DOM[target].el.style.opacity = 1;
								DOM[target].el.style.transform = 'none';
							}
						});
					}
					else {
						el.style.opacity = 1;
						el.style.transform = 'none';
					}
			  };

		// Animate the title, contact, menu ctrl and menu items out and show the code mode version of these elements.
		// Title:
		hideDesign('title', function() {
			showCode('title');
		});
		// Contact:
		hideDesign('contact', function() {
			showCode('contact');
		});
		// Menu ctrl:
		hideDesign('menuCtrl', function() {
			showCode('menuCtrl');
		});
		// Menu links:
		hideDesign(DOM.menu['design'].items, function() {
			DOM.menu['design'].wrapper.style.display = 'none';
				
			animateLetters(DOM.menuCodeItemLetters, 'in', {
				delay: function(t,i) {
					return i*30
				},
				begin: function() {
					DOM.menu['code'].wrapper.style.display = 'block';
				}
			});
		});
	}

	function switchToDesign() {
		const showDesign = function(target) {
			  		let animeOpts = {};

					if( typeof target === 'string' ) {
						let el = DOM[target].el || DOM[target]
						
						el.classList.remove('mode--code');
						el.classList.add('mode--design');

						animeOpts.targets = el;
						animeOpts.duration = 400;
						animeOpts.easing = 'easeOutQuint';
						animeOpts.scale = [0.3,1];

						animeOpts.begin = function() {
							if( DOM[target].letters !== undefined ) {
								DOM[target].letters.forEach(function(letter) {
									letter.style.opacity = 1;
								});
							}
						}
					}
					else {
						animeOpts.targets = target;
						animeOpts.duration = 600;
						animeOpts.delay = function(t,i,c) {
							return (c-i-1)*100;
						};
						animeOpts.easing = 'easeOutExpo';
						animeOpts.translateY = ['-75%','0%']
					}

					animeOpts.opacity = {value: [0,1], easing: 'linear'};
					
					anime.remove(animeOpts.targets);
					anime(animeOpts);
			  };


		// Animate the title, contact, menu ctrl and menu items out and show the design mode version of these elements.
		// Title:
		animateLetters(DOM.title.letters, 'out', {
			complete: function() {
				showDesign('title');
			}
		});
		// Contact:
		animateLetters(DOM.contact.letters, 'out', {
			complete: function() {
				showDesign('contact');
			}
		});
		// Menu ctrl:
		DOM.menuCtrl.style.opacity = 0;
		showDesign('menuCtrl');
		// Menu links:
		animateLetters(DOM.menuCodeItemLetters, 'out', {
			delay: function(t,i,c) {
				return (c-i-1)*10;
			},
			duration: 20,
			complete: function() {
				DOM.menu['code'].wrapper.style.display = 'none';
				DOM.menu['design'].wrapper.style.display = 'block';
				showDesign(DOM.menu['design'].items);
			}
		});
	}

	function animateLetters(letters, dir, extraAnimeOpts) {
		let animeOpts = {};
		
		animeOpts.targets = letters;
		animeOpts.duration = 50;
		animeOpts.delay = function(t,i,c) {
			return dir === 'in' ? i*50 : (c-i-1)*50;
		};
		animeOpts.easing = dir === 'in' ? 'easeInQuint' : 'easeOutQuint';
		animeOpts.opacity = dir === 'in' ? [0,1] : [1,0];
		extend(animeOpts, extraAnimeOpts);

		anime.remove(animeOpts.targets);
		anime(animeOpts);
	}

	init();

})(window);