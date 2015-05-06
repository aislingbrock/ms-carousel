/**
 * options:
 *
 * useArrows (true): if false then no arrows will be shown
 * arrowLeft (undefined): if given then this element will be used as the left arrow
 * arrowRight (undefined): if given then this element will be used as the right arrow
 * useThumbs (false): if true then thumbnail navigation will be used
 * thumbElement (undefined): if given this will be used to contain the thumbs
 * animation:
 *   - type (slide): the type of animation (currently supports slide, custom and none by default)
 *   - customAnimation (undefined): a custom animation function to be used with animation type 'custom'
 * animations (object): the animation functions
 * imagesPerSlide (1): the number of images shown at any one time
 * allowZoom (false): if true then then images will zoom on click
 * thumbConfig (undefined): the config for the thumbnail slider. the important option is imagesPerSlide
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
			imagesPerSlide: 1,
			allowZoom: false,
			animations: {
				slide: function (carousel, slide, speed) {
					var marginLeft = -slide*carousel.width,
						animationSpeed = carousel.config.animation.speed || speed || 500
					;

					carousel.$slides.stop().animate({
						marginLeft: marginLeft+'px'
					}, animationSpeed, 'linear');
				},
				none: function(carousel, slide) {
					var marginLeft = -slide*carousel.width;

					carousel.$slides.css('margin-left', marginLeft+'px');
					// carousel.update();
				}
			}
		};

		this.$element     = $element;
		this.config       = $.extend(defaults, config);
		this.width        = $element.width();
		this.currentSlide = 0;
		this.controls     = {};
		this.zoomed       = false;
	}

	Carousel.prototype.goTo = function (slide, speed) {
		var self = this,
			animationType = self.config.animation.type,
			animationSpeed = self.config.animation.speed || speed,
			marginLeft = -slide*this.width
		;

		self.currentSlide = slide;

		if (slide > self.slideCount - 1) {
			throw new Error('Slide out of range');
		}

		if (self.config.animations[animationType]) {
			self.config.animations[animationType](self, slide, animationSpeed);
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

		self.width = self.$element.width();
		self.slideCount = Math.ceil(self.$slides.children().size()/self.config.imagesPerSlide);

		$slides.css('min-width', (self.slideCount*self.width) +'px');

		$slides.children().each(function (key, item) {
			$(item).outerWidth(self.width/self.config.imagesPerSlide);
		});

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
	};

	Carousel.prototype.init = function () {
		var self = this;

		self.$element.data('instance', self);
		self.$slides = self.$element.children('.slides');

		self._initControls();

		$(window).on('orientationchange.carousel resize.carousel', function () {
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

		self.update();
	};

	Carousel.prototype.zoom = function (slide) {
		var self = this,
			$zoom,
			$zoomSlide = self.$slides.children('*:nth-child('+(slide+1)+')'), // slide+1 as nth-child is 1 indexed
			$zoomImage = $('<img src="'+ 
				($zoomSlide.data('zoom') || $zoomSlide.data('image') || $zoomSlide.children('img').first().attr('src')) +
				'">')
		;

		if (slide > self.slideCount - 1) {
			throw new Error('Slide out of range');
		}

		if (typeof self.$zoom === 'undefined') {
			$zoom = $('<div class="carousel-zoom">');
			$zoom.hide();
			$zoom.on('click.carousel', '.unzoom', function (e) {
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

		$zoom.html($zoomImage);
		$zoom.prepend('<a href="#" class="unzoom">X</a>');
		$zoom.show();

		self.$element.stop().hide();

		self.zoomed = true;
	};

	Carousel.prototype.unZoom = function () {
		var self = this;

		if (!self.zoomed) return false;
		self.$zoom.stop().hide();
		self.$element.show();

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

		self.$dots = $('<ol class="dots">');

		for (i=0; i<self.$slides.children().size(); ++i) {
			$dot = $('<li><a href="#" class="dot'+(self.currentSlide === i ? ' active' : '')+
				'" data-slide='+i+'><span>'+(i+1)+'</span></a></li>');
			self.$dots.append($dot);
		}

		self.$dots.on('click.carousel', '.dot', function (e) {
			e.preventDefault();
			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
			self.goTo($(this).data('slide'));
		});

		self.$element.append(self.$dots);
	};

	Carousel.prototype._initThumbs = function () {
		var self = this,
			$thumbs = self.config.thumbElement || self.$element.children('.thumbs'),
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
		
		$thumbs.append($('<ul class="slides">'));

		self.$slides.children().each(function(k, v) {
			var imgurl = $(v).data('thumb'),
				element = $('<li><a class="thumb'+(self.currentSlide === k ? ' active' : '')+
					'" data-slide="'+k+'" href="#"><img src="'+imgurl+'"></a></li>')
			;

			$thumbs.children('.slides').append(element);
		});

		$thumbs.on('click.carousel', '.thumb', function (e) {
			e.preventDefault();
			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
			self.goTo($(this).data('slide'));
		});

		thumbCarousel = new Carousel($thumbs, thumbConfig);
		thumbCarousel.init();

		self.thumbs = thumbCarousel;

		return thumbCarousel;
	};

	Carousel.prototype._initZoom = function () {
		var self = this;

		if (!this.config.allowZoom) return false;

		self.$slides.children().each(function (k, v) {
			$(v).on('click.carousel', function () {
				self.zoom(k);
			});
		});
	};

	Carousel.prototype._initArrows = function () {
		var self = this,
			arrowLeft = self.config.arrowLeft,
			arrowRight = self.config.arrowRight
		;

		if (!self.config.useArrows) return false;

		if (typeof arrowLeft === 'undefined') {
			arrowLeft = self.$element.children('.arrow.left');

			if (!arrowLeft.size()) {
				arrowLeft = $('<a href="#" class="arrow left"><span>Prev</span></a>');
				self.$element.append(arrowLeft);
			}
		}

		if (typeof arrowRight === 'undefined') {
			arrowRight = self.$element.children('.arrow.right');

			if (!arrowRight.size()) {
				arrowRight = $('<a href="#" class="arrow right"><span>Next</span></a>');
				self.$element.append(arrowRight);
			}
		}

		arrowLeft.on('click.carousel', function (e) {
			e.preventDefault();
			self.prev.call(self);
		});

		arrowRight.on('click.carousel', function (e) {
			e.preventDefault();
			self.next.call(self);
		});

		self.controls.arrowLeft = arrowLeft;
		self.controls.arrowRight = arrowRight;
	};

	$.fn.carousel = function (options) {
		var carousel = new Carousel(this, options);

		carousel.init();

		return carousel;
	};

})(jQuery, window, document);