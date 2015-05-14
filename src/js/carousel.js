/**
 * options:
 *
 * useArrows (true): if false then no arrows will be shown
 * arrowLeft (undefined): if given then this element will be used as the left arrow
 * arrowRight (undefined): if given then this element will be used as the right arrow
 * useThumbs (false): if true then thumbnail navigation will be used
 * thumbElement (undefined): if given this will be used to contain the thumbs
 * animation:
 *   - type (slide): the type of animation (currently supports slide and none by default)
 *   - speed (500): the animation speed
 * animations (object): the animation functions
 * imagesPerSlide (1): the number of images shown at any one time
 * allowZoom (false): if true then then images will zoom on click
 * zoomElement (undefined): if not given an element will automatically be inserted
 * hideCarouselOnZoom (true): carousel will be hidden on zoom
 * hideThumbsOnZoom (true): thumbnails will be hidden on zoom 
 * thumbConfig (undefined): the config for the thumbnail slider. the important option is imagesPerSlide
 *
 * automatic (false): wheather to change automatically
 * automaticDelay (800): the delay between automatic changes
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

					if (typeof speed == 'undefined') {
						speed = 500;
					}

					carousel.$slides.stop().animate({
						marginLeft: marginLeft+'px'
					}, speed, 'linear');
				},
				none: function(carousel, slide) {
					var marginLeft = -slide*carousel.width;

					carousel.$slides.css('margin-left', marginLeft+'px');
				}
			},
			automatic: false,
			automaticDelay: 2000
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

		self.width = self.$element.width();
		self.slideCount = Math.ceil(self.$slides.children().size()/self.config.imagesPerSlide);

		$slides.css('min-width', (self.slideCount*self.width) +'px');

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

		if (self.config.automatic) {
			window.setInterval(function () {
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
			$closeButton
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

		$closeButton = $zoom.children('.unzoom').size() ? $zoom.children('.unzoom') : $('<a href="#" class="unzoom">Close</a>');
		$zoom.html($zoomImage);
		$zoom.prepend($closeButton);
		
		$zoom.stop().slideDown();

		if (self.config.hideCarouselOnZoom) {
			self.$element.stop().slideUp();
		}

		if (self.config.hideThumbsOnZoom && typeof self.thumbs !== 'undefined') {
			self.thumbs.$element.stop().slideUp();
		}

		self.zoomed = true;
	};

	Carousel.prototype.unZoom = function () {
		var self = this;

		if (!self.zoomed) return false;
		
		self.$zoom.stop().slideUp();
		
		if (self.config.hideThumbsOnZoom && typeof self.thumbs !== 'undefined') {
			self.thumbs.$element.stop().slideDown();
		}

		if (self.config.hideCarouselOnZoom) {
			self.$element.stop().slideDown();
		}

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
		$thumbs.addClass('carousel');
		thumbCarousel.init();

		self.thumbs = thumbCarousel;

		return thumbCarousel;
	};

	Carousel.prototype._initZoom = function () {
		var self = this,
			$zoom = $(self.config.zoomElement || self.$element.data('zoom'))
		;

		if (!this.config.allowZoom) return false;

		$zoom.on('click.carousel', '.unzoom', function (e) {
			e.preventDefault();
			self.unZoom();
		});

		self.$slides.children().each(function (k, v) {
			$(v).on('click.carousel', function () {
				self.zoom(k);
			});
		});

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