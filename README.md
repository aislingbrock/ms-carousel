# Mothership Carousel

A general purpose carousel plugin built with [Mothership](http://mothership.ec) in mind.

## Basic usage

This library exposes a JQuery carousel function: `carousel(options)`. A carousel is defined in the markup as a list of images within a block element. Calling `.carousel()` on the JQuery element will transform it into a carousel. Additional options may be passed into the carousel function.

```html
<section class="carousel" id="carousel">
  <ul class="slides">
    <li>
      <img src="img/slide1.jpg">
    </li>
    <li>
      <img src="img/slide2.jpg">
    </li>
    <li>
      <img src="img/slide3.jpg">
    </li>
  </ul>
</section>

<script>
    $('#carousel1').carousel();
</script>
```

The image inside of each the slides may also be defined in a data attribute. For example 
```html
<li data-image="img/slide1"></li>
```
would work in the same way.

## Zoom

The zoom functionality allows a larger image to be displayed whilst hiding the carousel. The options relating to this are `allowZoom`, `hideCarouselOnZoom`, `hideThumbsOnZoom` and `zoomElement`.

A zoom element should either be passed to the plugin via the `zoomElement` option or specified in the `data-zoom` attribute, each slide should specify their own zoom images in their own `data-zoom` attributes. This element will be filled with the larger image when the carousel is clicked and hidden when the 'Close' button is clicked. If using a zoom element, a custom 'Close' button may be included. This button must have a class of `unzoom`.

`hideCarouselOnZoom` and `hideThumbsOnZoom` may be set to false to keep the carousel open when showing the zoomed image.

```html
<section class="carousel" id="carousel" data-thumbs="#thumbs" data-zoom="#zoom">
  <ul class="slides">
    <li data-image="./img/normal/1.jpg"
        data-zoom="./img/1.jpg"></li>
    <li data-image="./img/normal/2.jpg"
        data-zoom="./img/2.jpg"></li>
    <li data-image="./img/normal/3.jpg"
        data-zoom="./img/3.jpg"></li>
  </ul>
</section>
<div id="zoom" class="carousel-zoom"></div>

<script>
    $('#carousel').carousel({ allowZoom: true });
</script>
```

## Navigation

There are three main ways to navigate the carousel: arrows, dots and thumbnails. Only arrows are enabled by default.

Arrows may be disabled by setting the `useArrows` option to false: `$('#carousel').carousel({ useArrows: false })`.

Similarly the "dots" and "thumbnails" can be enabled by setting the `useDots` and the `useThumbs` option to true. When enabling thumbnails you should also set the image to use as the thumbnail with a data attribute as well as which element should be used for the thumbnails.

Using thumbnails:
```html
<section class="carousel" id="carousel" data-thumbs="#thumbs">
  <ul class="slides">
    <li data-thumb="img/thumbs/2_thumb.jpg">
      <img src="img/normal/2_norm.jpg">
    </li>
    <li data-thumb="img/thumbs/3_thumb.jpg">
      <img src="img/normal/3_norm.jpg">
    </li>
    <li data-thumb="img/thumbs/4_thumb.jpg">
      <img src="img/normal/4_norm.jpg">
    </li>
  </ul>
</section>
<div id="thumbs" class="carousel thumbs"></div>

<script>
    $('#carousel').carousel({ useThumbs: true });
</script>
```

This will generate a new carousel in the thumbnail element and link it's slides to the controls.

## Custom Animations

Custom animations may be defined in the `animations` option. These are functions may be called when the `goTo()` function is called. They are sould be defined as `function(carousel, slide, speed)` and should modify the `carousel.$slides` to achieve a transition to the correct slide.

The following example defines a custom animation to fade between slides in `animations` and sets it as the animation to use in the `animation` option.
```html
<script>
$('#carousel').carousel({
    animation: {
        type: 'custom'
    },
    animations: {
        custom: function (carousel, slide, speed) {
            $.when(carousel.$slides.children().fadeOut()).done(function() {
                carousel.$slides.children('*:nth-child('+(slide+1)+')').fadeIn();
            });
        }
    }
});
</script>
```

## Further examples

A document with example carousel setups is included in the example directory.

## Options

The options that may be passed in are as follows:

Option             | Default   | Type                         | Description
:---------         |:--------: |:--------------------------:  |:-----------
useArrows          | true      | boolean                      | Use arrow navigation if true.
arrowLeft          | undefined | string&#124;jquery           | The element or id of element to use as the left arrow contorl. If not set and useArrows is true, arrows will be generated.
arrowRight         | undefined | string&#124;jquery           | The element or id of element to use as the right arrow contorl. If not set and useArrows is true, arrows will be generated.
useDots            | false     | boolean                      | Use dot navigation if true.
useThumbs          | false     | boolean                      | Use thumbnail navigation if true.
thumbElement       | undefined | string&#124;jquery           | The element to use for thumbs. This may be set using the 'data-thumbs' attribute.
animation          | object    | object                       | Animation settings object. Contains type (default "slide"): The type of animation to use, slide and none are available by default. More may be added by setting the 'animations' option. and speed (default 500): The animation speed.
animations         | object    | object                       | Contains the animations that may be used by setting animation type.
imagesPerSlide     | 1         | int                          | The number of images to show at any one time.
allowZoom          | false     | boolean                      | Allows zoom to a larger view if true.
zoomElement        | undefined | string&#124;jquery           | The element to insert the larger image view into. If undefined an element will be inserted after the carousel.
hideCarouselOnZoom | true      | boolean                      | Hide the carousel when a zoom happens.
hideThumbsOnZoom   | true      | boolean                      | Hide the thumbnails when a zoom happens.
hideElementsOnZoom | []        | array                        | Elements to hide on zoom.
thumbConfig        | object    | object                       | The config to use when creating the Thumbnail carousel. It may take all the same options as the regular carousel. By default arrows are shown and imagesPerSlide is set to 2.6
