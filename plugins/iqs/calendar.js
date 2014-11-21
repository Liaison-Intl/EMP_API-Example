(function($) {
	
	$.fn.iqs_calendar = function(custom_options) {
		
		var options = {
			allow_backward: false,
			omit_weekdays: false,
			omit_weekends: false,
			omit_days: [],
			on_load: function() {},
			on_select: function() {},
			on_forward: function() {},
			on_backward: function() {},
			month: 0,
			year: 0,
			specific_dates: {},
			
			// wrapper
			wrapper_class: 'calendarContainer',
			// header
			header_wrapper_class: 'calendarContainerHeader',
			prev_month_class: 'calendarContainerHeaderLeft',
			current_month_class: 'calendarContainerHeaderMonth',
			next_month_class: 'calendarContainerHeaderRight',
			// weekdays
			weekday_wrapper_class: 'calendarContainerWeekdays',
			weekday_class: 'calendarContainerWeekdaysDay',
			// body
			body_wrapper_class: 'calendarContainerBody',
			day_class: 'calendarContainerBodyDay',
			day_omit_class: 'calendarContainerBodyDayStrikethrough',
			day_ignore_class: 'calendarContainerBodyDayUnselectable',
			day_select_class: 'selected'
		};
		
		$.extend(options, custom_options);
		
		var week_days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		days_in_months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
		
		/*
		 * fill the days in the calendar
		 */
		
		fill_calendar = function($cal, m, y) {
			
			// update month and year to current
			options.month = m;
			options.year = y;
			
			if (!options.allow_backward) {
				
				var now = new Date();
				
				if (y < now.getFullYear() || (y == now.getFullYear() && m <= now.getMonth())) {
					$cal.find('.' + options.prev_month_class).css('visibility', 'hidden');
				} else {
					$cal.find('.' + options.prev_month_class).css('visibility', 'visible');
				}
			}
			
			var first_day_of_month = new Date(y, m, 1).getDay();
			var month_len = days_in_months[m];
			
			// leap year
			if (m == 1) {
			
				if ((y % 4 == 0 && y % 100 != 0) || y % 400 == 0) {
				
					month_len = 29;
				}
			}
			
			// valid date
			if (days_in_months[m] != null && months[m] != null) {
				
				var d = 1;
				var txt = '';
				
				for (var i = 0; i < 9; i++) {
					
					// [0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday]
					for (var j = 0; j <= 6; j++) {
						
						if (d <= month_len && (i > 0 || j >= first_day_of_month)) {
							
							var pretty_date = pretty_format(y, m, d),
							js_formatted_date = js_format(y, m, d, j),
							mysql_formatted_date = mysql_format(y, m + 1, d);
							
							if (options.omit_weekdays && (j == 1 || j == 2 || j == 3 || j == 4 || j == 5 || j == 6) 
								|| options.omit_weekends && (j == 0 || j == 6) 
								|| j in options.omit_days) {
								
								txt += '<div class="' + options.day_omit_class + '" ' +
									'title="' + pretty_date + '" ' +
									'data-js-date="' + js_formatted_date + '" ' +
									'data-mysql-date="' + mysql_formatted_date + '">' + d + '</div>';
								
							} else {
								
								txt += '<div class="' + options.day_class + '" ' +
									'title="' + pretty_date + '" ' +
									'data-js-date="' + js_formatted_date + '" ' +
									'data-mysql-date="' + mysql_formatted_date + '">' + d + '</div>';
							}
							
							d++;
							
						} else {
						
							txt += '<div class="' + options.day_ignore_class + '">&nbsp;</div>';
						}
					}
					
					if (d > month_len) {
						break;
					} else {
						txt += '<br />';
					}
				}
				
				$cal.find('.' + options.current_month_class).html(months[m] + ' ' + y);
				$cal.find('.' + options.body_wrapper_class).html(txt);
				
			} else {
				
				goto_today($cal);
			}
		},
		
		/*
		 * allow selection of specific dates and times
		 */
		
		load_specific_dates = function($cal, dates) {
			
			options.specific_dates[$cal.data('calendarIndex')] = [];
			
			for (i=0; i < dates.length; i+=1) {
				
				if (dates[i].hasOwnProperty('date')) {
					
					var year = dates[i].date.substr(0, 4),
					month = dates[i].date.substr(5, 2),
					day = dates[i].date.substr(8, 2),
					index = year + '-' + month + '-' + day;
					
					options.specific_dates[$cal.data('calendarIndex')][index] = {
						id: dates[i].id,
						year: year,
						month: month,
						day: day,
						times: dates[i].times
					};
				}
			}
		},
		
		/*
		 * trigger function on forward or backward to set the specific dates
		 */
		
		set_specific_dates = function($cal) {
			
			var m = options.month + 1,
			m = ('' + m).length < 2 ? ('0' + m) : m,
			y = options.year,
			date_ref = options.specific_dates[$cal.data('calendarIndex')];
			
			// date_ref is indexed by dates
			for (i in date_ref) {
				
				if (date_ref[i].year == y && date_ref[i].month == m) {
					
					find_date($cal, date_ref[i].year, date_ref[i].month, date_ref[i].day, function($date) {
						
						if (!$date.hasClass(options.day_select_class)) {
							
							$date.removeClass(options.day_omit_class)
								.addClass(options.day_class);
						}
					});
				}
			}
		},
		
		/*
		 * find a specific calendar date
		 */
		
		find_date = function($cal, y, m, d, cb) {
			
			if (y.length == 4 && y != '0000' && m.length == 2 && m != '00' && d.length == 2 && d != '00') {
				
				m = Math.round(m);
				
				if (options.month != m - 1) {
					
					fill_calendar($cal, m - 1, y);
				}
				
				var search = mysql_format(y, m, d);
				
				$cal.find('.' + options.day_class + ', .' + options.day_omit_class).each(function() {
					
					if ($(this).data('mysql-date') == search) {
						
						cb($(this));
					}
				});
			}
		},
		
		/*
		 * goto a specific calendar date
		 */
		
		goto_date = function($cal, y, m, d) {
			
			find_date($cal, y, m, d, function($date) {
				
				$date.click();
			});
		},
		
		/*
		 * goto today's date
		 */
		
		goto_today = function($cal) {
			
			var date = new Date(),
			month = date.getMonth(),
			year = date.getFullYear();
			
			fill_calendar($cal, month, year);
		},
		
		/*
		 * goto previous month
		 */
		
		previous = function($cal) {
			
			var month = Math.round(options.month),
			year = Math.round(options.year);
			
			if (month > 0) {
				month -= 1;
			} else {
				month = 11;
				year -= 1;
			}
			
			fill_calendar($cal, month, year);
			
			options.on_backward($cal, month + 1, year);
		},
		
		/*
		 * goto next month
		 */
		
		next = function($cal) {
			
			var month = Math.round(options.month),
			year = Math.round(options.year);
			
			if (month < 11) {
				month += 1;
			} else {
				month = 0;
				year += 1;
			}
			
			fill_calendar($cal, month, year);
			
			options.on_forward($cal, month + 1, year);
		},
		
		/*
		 * calendar date clicked
		 */
		
		select = function() {
			
			var selected = true,
			$date = $(this),
			$parent = $date.parents('.calendar'),
			date_ref = options.specific_dates[$parent.data('calendarIndex')];
			
			if ($date.hasClass(options.day_select_class)) {
				
				$date.removeClass(options.day_select_class);
				
				selected = false;
				
			} else {
				
				$parent.find('.' + options.day_class).removeClass(options.day_select_class);
				
				$date.addClass(options.day_select_class);
			}
			
			if (date_ref[$date.data('mysql-date').substr(0, 10)] !== undefined) {
				
				options.on_select($date, selected, date_ref[$(this).data('mysql-date').substr(0, 10)]);
				
			} else {
				
				options.on_select($date, selected);
			}
		},
		
		/*
		 * Return a date in the following format:
		 * July 14, 2011
		 */
		
		pretty_format = function(y, m, d) {
			
			return months[m] + ' ' + d + ', ' + y;
		},
		
		/*
		 * Return a date in the following format:
		 * Thu, 14 Jul 2011 09:03:31 -0700
		 */
		
		js_format = function(y, m, d, j) {
			
			return week_days[j].substr(0, 3) + ', ' + d + ' ' + months[m].substr(0, 3) + ' ' + y + ' 00:00:00 -0000';
		},
		
		/*
		 * Return a date in the following format:
		 * 2011-07-14 13:35:02
		 */
		
		mysql_format = function(y, m, d) {
			
			return y + '-' + (('' + m).length < 2 ? '0' + m : m) + '-' + (('' + d).length < 2 ? '0' + d : d) + ' 00:00:00';
		};
		
		return this.each(function(index) {
			
			var $div = $(this),
			
			// specific dates
			dates = $div.html() && $.trim($div.html()).length != 0 ? $.parseJSON($div.html()) : {};
			
			html = '<div class="' + options.wrapper_class + '">'
					+ '<div class="' + options.header_wrapper_class + '">'
						+ '<div class="' + options.prev_month_class + '">&laquo;</div>'
						+ '<div class="' + options.current_month_class + '">January</div>'
						+ '<div class="' + options.next_month_class + '">&raquo;</div>'
						+ '<div class="clear"></div>'
					+ '</div>'
					+ '<div class="' + options.weekday_wrapper_class + '">'
						+ '<div class="' + options.weekday_class + '">Su</div>'
						+ '<div class="' + options.weekday_class + '">M</div>'
						+ '<div class="' + options.weekday_class + '">T</div>'
						+ '<div class="' + options.weekday_class + '">W</div>'
						+ '<div class="' + options.weekday_class + '">Th</div>'
						+ '<div class="' + options.weekday_class + '">F</div>'
						+ '<div class="' + options.weekday_class + '">S</div>'
						+ '<div class="clear"></div>'
					+ '</div>'
					+ '<div class="' + options.body_wrapper_class + '"></div>'
				+ '</div>';
			
			$div.html(html);
			$div.data('calendarIndex', 'cal' + index);
			
			$div.delegate('.' + options.day_class, 'click', select);
			
			goto_today($div);
			
			if (dates) {
				
				load_specific_dates($div, dates);
				
				set_specific_dates($div);
				
				$div.find('.' + options.prev_month_class).click(function() {
					
					previous($div);
					set_specific_dates($div);
				});
				
				$div.find('.' + options.next_month_class).click(function() {
					
					next($div);
					set_specific_dates($div);
				});
				
			} else {
				
				$div.find('.' + options.prev_month_class).click(function() {
					
					previous($div);
				});
				
				$div.find('.' + options.next_month_class).click(function() {
					
					next($div);
				});
			}
			
			options.on_load($div);
		});
	};
})(jQuery);