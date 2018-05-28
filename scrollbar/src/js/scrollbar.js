/*
*	BlockElement
*/

$.fn.BlockElement = function(_block_class)
{
	var _el = this;
	_el.block_class = _block_class;

	_el.getBlockClass = function()
	{
		return _el.block_class;
	};

	_el.addBlockElement = function(_element_class, _element)
	{
		if (_element == undefined) _element = "div";
		var newBlockElement = $('<' + _element + '>').BlockElement(_el.getBlockClass() + "__" + _element_class);
		return newBlockElement;
	};

	_el.addModifier = function(_modifier_class)
	{
		_el.addClass(_el.block_class + "--" + _modifier_class);
		return _el;
	};

	_el.removeModifier = function(_modifier_class)
	{
		_el.removeClass(_el.block_class + "--" + _modifier_class);
		return _el;
	};

	return function()
	{
		_el.addClass(_el.block_class)
		return _el;
	}();
}

/*
*	Scrollbar
*/

$.fn.MLMI_Scrollbar = function(_scroller, _options)
{
	var _bar = this;
	_bar.options = _options;
	_bar.scroller = _scroller;
	_bar.el = {
		thumb: undefined
	};
	_bar.status = {
		dragging: false
	};
	_bar.active_timeout = undefined;

	_bar.dragging = function()
	{
		if (_bar.options.direction == 'vertical') {
			var targetPercentage = parseFloat(_bar.el.thumb.css('top')) / _bar.getScrollableHeight();
			if (targetPercentage < 0) targetPercentage = 0;
			if (targetPercentage > 1) targetPercentage = 1;
			_bar.scroller.setScrollPercentage(targetPercentage);
		}
	};

	_bar.start = function()
	{
		_bar.status.dragging = true;
		_bar.addModifier('active').addModifier('dragging');
	};

	_bar.stop = function()
	{
		_bar.status.dragging = false;
		_bar.removeModifier('active').removeModifier('dragging');
	};

	_bar.getScrollableHeight = function()
	{
		return _bar.height() - _bar.el.thumb.height();
	};

	_bar.setScrollPercentage = function(_percentage)
	{
		_bar.el.thumb.css({
			top: Math.ceil(_percentage * _bar.getScrollableHeight())
		});

		// active scrollbar
		if (_bar.active_timeout != undefined){
			clearTimeout(_bar.active_timeout);
		}
		_bar.addModifier("active");
		_bar.active_timeout = setTimeout(function(){
			_bar.removeModifier("active");
		}, 500);
	};

	_bar.setVisiblePercentage = function(_percentage)
	{
		_bar.el.thumb.css({
			height: (_percentage * 100) + "%"
		});
	};

	return function()
	{
		// default options
		if (_bar.options == undefined) _bar.options = {};
		if (!_bar.options.hasOwnProperty('direction')) _bar.options.direction = 'vertical';
		if (!_bar.options.hasOwnProperty('size')) _bar.options.size = 'auto';

		// create elements
		_bar.el.thumb = _bar.addBlockElement("thumb");
		_bar.append(_bar.el.thumb);
		_bar.scroller.append(_bar);
		_bar.el.thumb.draggable({
			axis: _bar.options.direction == 'horizontal' ? 'x' : 'y',
			containment: _bar,
			start: _bar.start,
			drag: _bar.dragging,
			stop: _bar.stop
		});

		// scrollbar object
		return _bar;
	}();
};

/*
*	Scroller
*/

$.fn.MLMI_Scroller = function(_options)
{
	var self = this;
	self.options = _options;
	self.el = {
		scroller: undefined,
		scrollbar: undefined
	};
	self.prop = {
		paddingTop: 0,
		paddingRight: 0,
		paddingBottom: 0,
		paddingLeft: 0
	};
	self.resize_timeout = undefined;

	self.sizes = function()
	{
		// reset forced padding 0
		self.removeClass("scroller__container");

		// get initial properties
		self.prop.paddingTop = parseFloat(self.css('paddingTop'));
		self.prop.paddingRight = parseFloat(self.css('paddingRight'));
		self.prop.paddingBottom = parseFloat(self.css('paddingBottom'));
		self.prop.paddingLeft = parseFloat(self.css('paddingLeft'));

		// create scroller
		self.el.scroller.css({
			paddingTop: self.prop.paddingTop,
			paddingLeft: self.prop.paddingLeft,
			paddingRight: self.prop.paddingRight + self.options.spacing,
			paddingBottom: self.prop.paddingBottom,
			width: 'calc(100% + ' + self.options.spacing + 'px)'
		});

		// add container forced padding to 0
		self.addClass("scroller__container");

		// check if scrollbar is needed
		if (self.el.scrollbar != undefined){
			if (self.el.scroller.get(0).scrollHeight > self.el.scroller.outerHeight(false)){
				self.el.scrollbar.show();
				self.el.scrollbar.setVisiblePercentage(self.el.scroller.outerHeight() / self.el.scroller.get(0).scrollHeight);
			} else {
				self.el.scrollbar.hide();
			}
		}
	};

	self.addScrollbar = function(options)
	{
		self.el.scrollbar = self.el.scroller.addBlockElement("scrollbar").MLMI_Scrollbar(self, options);
		self.el.scroller.on("scroll", self.scrolled);
		self.sizes();
		self.scrolled();
	};

	self.setScrollPercentage = function(_scroll_percentage)
	{
		self.el.scroller.scrollTop((self.el.scroller.get(0).scrollHeight - self.el.scroller.outerHeight(false)) * _scroll_percentage);
	};

	self.scrolled = function()
	{
		if (!self.el.scrollbar.status.dragging){
			var targetPercentage = self.el.scroller.scrollTop() / (self.el.scroller.get(0).scrollHeight - self.el.scroller.outerHeight(false));
			if (targetPercentage < 0) targetPercentage = 0;
			if (targetPercentage > 1) targetPercentage = 1;
			self.el.scrollbar.setScrollPercentage(targetPercentage);
		}
	};

	return function()
	{
		// default options
		if (self.options == undefined) self.options = {};
		if (!self.options.hasOwnProperty('spacing')) self.options.spacing = 60;
		if (!self.options.hasOwnProperty('resize_delay')) self.options.resize_delay = 60;

		// create scroller html structure
		self.el.scroller = $('<div></div>').BlockElement('scroller');
		self.sizes();
		self.el.scroller.append(self.html());
 		self.html(self.el.scroller);

		// resize element
		$(window).on("load resize orientationchange", function(){
			clearTimeout(self.resize_timeout);
			self.resize_timeout = setTimeout(self.sizes, self.options.resize_delay);
		});

		// scroller object
		return self;
	}();
};