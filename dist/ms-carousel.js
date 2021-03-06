/**
 * options:
 *
 * useArrows (true): if false then no arrows will be shown
 * arrowLeft (undefined): if given then this element will be used as the left arrow
 * arrowRight (undefined): if given then this element will be used as the right arrow
 * useThumbs (false): if true then thumbnail navigation will be used
 * thumbElement (undefined): if given this will be used to contain the thumbs
 * animation:
 *   - type (slide): the type of animation (currently supports slide, css and none by default)
 *   - speed (500): the animation speed
 * animations (object): the animation functions
 * imagesPerSlide (1): the number of images shown at any one time
 * allowZoom (false): if true then then images will zoom on click
 * zoomElement (undefined): if not given an element will automatically be inserted
 * hideCarouselOnZoom (true): carousel will be hidden on zoom
 * hideThumbsOnZoom (true): thumbnails will be hidden on zoom 
 * thumbConfig (undefined): the config for the thumbnail slider. the important option is imagesPerSlide
 * automatic (false): wheather to change automatically
 * automaticDelay (800): the delay between automatic changes
 * pauseOnInteraction (true): Will pause automatic changes when controls are interracted with
 * hideElementsOnZoom ([]): Elements to hide on zoom
 */
(function($, window, document) {
	'use strict';

	function Carousel ($element, config) {
		var defaults = {
			useArrows: true,
			animation: {
				type: 'slide',
				speed: 500,
			},
			useThumbs: false,
			hideThumbsOnZoom: true,
			hideCarouselOnZoom: true,
			imagesPerSlide: 1,
			allowZoom: false,
			animations: {
				slide: function (carousel, slide, speed) {
					var marginLeft = -slide*carousel.width;

					carousel.$slides.css('min-width', (carousel.slideCount*carousel.width) +'px');

					if (typeof speed == 'undefined') {
						speed = 500;
					}

					carousel.$slides.stop().animate({
						marginLeft: marginLeft+'px'
					}, speed, 'linear');
				},
				css: function(carousel, slide) {
					carousel.$slides.children(":not(*:nth-child("+(slide+1)+"))").removeClass('active');
					carousel.$slides.children("*:nth-child("+(slide+1)+")").addClass('active');
				},
				none: function(carousel, slide) {
					var marginLeft = -slide*carousel.width;

					carousel.$slides.css('min-width', (carousel.slideCount*carousel.width) +'px');

					carousel.$slides.css('margin-left', marginLeft+'px');
				}
			},
			automatic: false,
			automaticDelay: 2000,
			pauseOnInteraction: true,
			hideElementsOnZoom: []
		};

		this.$element     = $element;
		this.config       = $.extend(defaults, config);
		this.width        = $element.width();
		this.currentSlide = 0;
		this.controls     = {};
		this.paused       = false;
		this.zoomed       = false;
	}

	Carousel.prototype.goTo = function (slide, speed) {
		var self = this,
			animationType = self.config.animation.type,
			marginLeft = -slide*this.width
		;

		if (typeof speed == 'undefined') {
			speed = self.config.animation.speed;
		}

		self.currentSlide = slide;

		if (slide > self.slideCount - 1) {
			throw new Error('Slide out of range');
		}

		if (self.config.animations[animationType]) {
			self.config.animations[animationType](self, slide, speed);
		} else {
			throw new Error('Animation of type ' + animationType + ' is not supported');
		}

		self._updateControls();

		return slide;
	};

	Carousel.prototype.next = function () {
		if (this.currentSlide + 1 > this.slideCount - 1) {
			return;
		}

		return this.goTo(this.currentSlide + 1);
	};

	Carousel.prototype.prev = function () {
		if (this.currentSlide - 1 < 0) {
			return;
		}

		return this.goTo(this.currentSlide - 1);
	};

	Carousel.prototype.update = function () {
		var self = this,
			$slides = self.$slides
		;

		if (!self.$element.is(':visible')) {
			return;
		}

		self.width = self.$element.width();
		self.slideCount = Math.ceil(self.$slides.children().size()/self.config.imagesPerSlide);

		$slides.children().each(function (key, item) {
			$(item).outerWidth(self.width/self.config.imagesPerSlide);
		});

		self.goTo(self.currentSlide, 0);

		self._updateControls();
	};

	Carousel.prototype._updateControls = function () {
		if (typeof this.controls.arrowLeft !== 'undefined') {
			if (this.currentSlide <= 0) {
				this.controls.arrowLeft.addClass('disabled');
			} else {
				this.controls.arrowLeft.removeClass('disabled');
			}
		}

		if (typeof this.controls.arrowRight !== 'undefined') {
			if (this.currentSlide + 1 >= this.slideCount) {
				this.controls.arrowRight.addClass('disabled');
			} else {
				this.controls.arrowRight.removeClass('disabled');
			}
		}

		if (typeof this.$dots !== 'undefined') {
			this.$dots.children().removeClass('active');
			this.$dots.children('*:nth-child('+(this.currentSlide+1)+')').addClass('active');
		}
	};

	Carousel.prototype.init = function () {
		var self = this;

		self.$element.data('instance', self);
		self.$slides = self.$element.children('.msc-slides');

		self._initControls();

		$(window).on('orientationchange.msc-carousel resize.msc-carousel', function () {
			self.update();
		});

		self.$slides.children().each(function (k, v) {
			var $v = $(v),
				image = $v.data('image')
			;

			if (image) {
				$v.append($('<img src="'+image+'">'));
			}
		});

		if (self.config.automatic) {
			window.setInterval(function () {
				if (self.paused) return;

				if (self.currentSlide + 1 >= self.slideCount) {
					self.goTo(0);
				} else{
					self.next();
				}
			}, self.config.automaticDelay);
		}

		self.update();
	};

	Carousel.prototype.zoom = function (slide) {
		var self = this,
			$zoom,
			$zoomSlide = self.$slides.children('*:nth-child('+(slide+1)+')'), // slide+1 as nth-child is 1 indexed
			$zoomImage = $('<img src="'+ 
				($zoomSlide.data('zoom') || $zoomSlide.data('image') || $zoomSlide.children('img').first().attr('src')) +
				'">'),
			$closeButton,
			animationPromise
		;

		if (slide > self.slideCount - 1) {
			throw new Error('Slide out of range');
		}

		self.$element.trigger('zoom.msc-carousel');

		if (typeof self.$zoom === 'undefined') {
			$zoom = $('<div class="msc-carousel-zoom">');
			$zoom.hide();
			$zoom.on('click.msc-carousel', '.msc-unzoom', function (e) {
				if (self.config.pauseOnInteraction) self.paused = true;
				e.preventDefault();

				self.unZoom();
			});
			self.$element.after($zoom);
			self.$zoom = $zoom;
		} else {
			$zoom = self.$zoom;
		}

		slide = slide || self.currentSlide;

		if (self.zoomed) {
			self.unZoom();
		}

		$closeButton = $zoom.children('.msc-unzoom').size() ? $zoom.children('.msc-unzoom') : $('<a href="#" class="msc-unzoom">Close</a>');
		$zoom.html($zoomImage);
		$zoom.prepend($closeButton);
		

		if (self.config.hideCarouselOnZoom) {
			animationPromise = self.$element.stop().slideUp();
		}

		if (self.config.hideThumbsOnZoom && typeof self.thumbs !== 'undefined') {
			animationPromise = self.thumbs.$element.stop().slideUp();
		}

		$.each(self.config.hideElementsOnZoom, function (i, value) {
			animationPromise = $(value).stop().slideUp();
		});
		
		$.when(animationPromise).done(function() {
			$zoom.stop().slideDown();
		});

		self.zoomed = true;
	};

	Carousel.prototype.unZoom = function () {
		var self = this;

		if (!self.zoomed) return false;
		
		self.$element.trigger('unzoom.msc-carousel');

		$.when(self.$zoom.stop().slideUp()).done(function() {
			if (self.config.hideThumbsOnZoom && typeof self.thumbs !== 'undefined') {
				self.thumbs.$element.stop().slideDown();
			}

			if (self.config.hideCarouselOnZoom) {
				self.$element.stop().slideDown();
			}

			$.each(self.config.hideElementsOnZoom, function (i, value) {
				$(value).stop().slideDown();
			});

			self.update();
			self.thumbs.update();
		});

		self.zoomed = false;
	};

	Carousel.prototype._initControls = function () {
		this._initArrows();
		this._initThumbs();
		this._initZoom();
		this._initDots();
	};

	Carousel.prototype._initDots = function () {
		var self = this, i, $dot;

		if (!self.config.useDots) return false;

		self.$dots = $('<ol class="msc-dots">');

		for (i=0; i<self.$slides.children().size(); ++i) {
			$dot = $('<li><a href="#" class="msc-dot'+(self.currentSlide === i ? ' active' : '')+
				'" data-slide='+i+'><span>'+(i+1)+'</span></a></li>');
			self.$dots.append($dot);
		}

		self.$dots.on('click.msc-carousel', '.msc-dot', function (e) {
			if (self.config.pauseOnInteraction) self.paused = true;
			e.preventDefault();

			self.goTo($(this).data('slide'));
		});

		self.$element.append(self.$dots);
	};

	Carousel.prototype._initThumbs = function () {
		var self = this,
			$thumbs = self.config.thumbElement || $(self.$element.data('thumbs')),
			thumbCarousel,
			defaultThumbConfig = {
				imagesPerSlide: 2.6
			},
			thumbConfig
		;


		thumbConfig = $.extend(defaultThumbConfig, self.config.thumbConfig || {});

		if (!self.config.useThumbs) return false;
		// don't display thumbnails if only one or fewer slides
		if (self.$slides.children().size() <= 1) return false;
		
		$thumbs.append($('<ul class="msc-slides">'));

		self.$slides.children().each(function(k, v) {
			var imgurl = $(v).data('thumb'),
				element = $('<li><a class="msc-thumb'+(self.currentSlide === k ? ' active' : '')+
					'" data-slide="'+k+'" href="#"><img src="'+imgurl+'"></a></li>')
			;

			$thumbs.children('.msc-slides').append(element);
		});

		$thumbs.on('click.msc-carousel', '.msc-thumb', function (e) {
			if (self.config.pauseOnInteraction) self.paused = true;
			e.preventDefault();

			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
			self.goTo($(this).data('slide'));
		});

		thumbCarousel = new Carousel($thumbs, thumbConfig);
		$thumbs.addClass('msc-carousel');
		thumbCarousel.init();

		self.thumbs = thumbCarousel;

		return thumbCarousel;
	};

	Carousel.prototype._initZoom = function () {
		var self = this,
			$zoom = $(self.config.zoomElement || self.$element.data('zoom'))
		;

		if (!this.config.allowZoom) return false;

		$zoom.on('click.msc-carousel', '.msc-unzoom', function (e) {
			if (self.config.pauseOnInteraction) self.paused = true;
			e.preventDefault();

			self.unZoom();
		});

		self.$slides.children().each(function (k, v) {
			$(v).on('click.msc-carousel', function () {
				if (self.config.pauseOnInteraction) self.paused = true;
				self.zoom(k);
			});
		}).addClass('control');

		$zoom.hide();

		if ($zoom) {
			self.$zoom = $zoom;
		}
	};

	Carousel.prototype._initArrows = function () {
		var self = this,
			arrowLeft = self.config.arrowLeft,
			arrowRight = self.config.arrowRight
		;

		if (!self.config.useArrows) return false;

		if (typeof arrowLeft === 'undefined') {
			arrowLeft = self.$element.children('.msc-arrow.left');

			if (!arrowLeft.size()) {
				arrowLeft = $('<a href="#" class="msc-arrow left"><span>Prev</span></a>');
				self.$element.append(arrowLeft);
			}
		}

		if (typeof arrowRight === 'undefined') {
			arrowRight = self.$element.children('.msc-arrow.right');

			if (!arrowRight.size()) {
				arrowRight = $('<a href="#" class="msc-arrow right"><span>Next</span></a>');
				self.$element.append(arrowRight);
			}
		}

		arrowLeft.on('click.msc-carousel', function (e) {
			if (self.config.pauseOnInteraction) self.paused = true;
			e.preventDefault();

			self.prev.call(self);
		});

		arrowRight.on('click.msc-carousel', function (e) {
			if (self.config.pauseOnInteraction) self.paused = true;
			e.preventDefault();

			self.next.call(self);
		});

		self.controls.arrowLeft = arrowLeft;
		self.controls.arrowRight = arrowRight;
	};

	$.fn.carousel = function (options) {
		var carousel = new Carousel(this, options);

		carousel.init();
		this.data('carousel', carousel);

		return this;
	};
})(jQuery, window, document);