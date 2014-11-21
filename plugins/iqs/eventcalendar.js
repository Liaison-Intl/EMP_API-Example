$(document).ready(eventcalendar);

function eventcalendar() {
	
	var that = {},
	
	request_location = 'https://www.spectrumiqs.com/api/event_signup/',
	
	event_class = 'event',
	form_class = 'signup_form',
	error_class = 'error_message',
	thank_you_class = 'thank_you_message',
	calendar_class = 'calendar',
	dates_class = 'dates',
	time_wrapper_class = 'time_wrapper',
	custom_questions_class = 'customQuestionSection',
	
	event_field_name = 'eventID',
	record_field_name = 'recordID',
	registration_field_name = 'registrationID',
	date_field_name = 'eventDate',
	time_field_name = 'eventTime',
	
	daily_and_multi_cache = {},
	
	months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	
	that.gather_custom_values = function($form) {
		
		var fields = [];
		
		$form.find('.' + custom_questions_class).find('fieldset').each(function() {
			
			var $el = $(this),
            type = $el.data('type');
            
            switch (type) {
            	
            	case 'iqs-form-single-select':
            		
            		var $select = $el.find('select');
            		
            		fields.push([$select.attr('name'), $select.val()]);
            		
            		break;
            		
            	case 'iqs-form-radio':
            		
            		var $input = $el.find(':input:checked');
            		
            		if ($input.length > 0) {
            			
            			fields.push([$input.attr('name'), $input.val()]);
            		}
            		
            		break;
            		
            	case 'iqs-form-checkbox':
            		
            		var $input = $el.find(':input:checked'),
            		val = '';
            		
            		if ($input.length > 0) {
            			
            			$input.each(function() {
            				val += $(this).val() + ',';
            			});
            			
            			// remove last comma
            			val = val.substr(0, val.length-1);
            			
            			fields.push([$input.attr('name'), val]);
            		}
            		
            		break;
            		
            	case 'iqs-form-multi-select':
            		
            		var $select = $el.find('select'),
            		$input = $el.find('select option:selected'),
            		val = '';
            		
            		if ($input.length > 0) {
            			
            			$input.each(function() {
            				val += $(this).val() + ',';
            			});
            			
            			// remove last comma
            			val = val.substr(0, val.length-1);
            			
            			fields.push([$select.attr('name'), val]);
            		}
            		
            		break;
            		
            	case 'iqs-form-textarea':
            		
            		var $input = $el.find('textarea'),
            		val = $input.val();
                    
                    fields.push([$input.attr('name'), val]);
            		
            		break;
            		
            	default:
            		
            		var $input = $el.find('input'),
            		val = $input.val();
	                
	                fields.push([$input.attr('name'), val]);
            }
		});
		
		return fields;
	};
	
	/*
	 * date times
	 */
	
	that.show_time_options = function($date, selected, cache_ref) {
		
		var $event = $date.parents('.' + event_class),
		$date_field = $event.find(':input[name="' + date_field_name + '"]'),
		$time_wrapper = $event.find('.' + time_wrapper_class),
		$time_field = $time_wrapper.find(':input[name="' + time_field_name + '"]');
		
		$time_field.html('<option value=""></option>');
		
		if (selected) {
			
			var date_id = cache_ref['id'],
			times = cache_ref['times'];
			
			$date_field.val(date_id);
			
			if (times.length > 0) {
				
				for (i=0; i < times.length; i+=1) {
					
					$time_field.append('<option value="' + times[i].id + '">' + times[i].start + ' - ' + times[i].end + '</option>')
				}
				
				$time_wrapper.show();
				$time_field.addClass('iqs-field-required');
				
			} else {
				
				$time_wrapper.hide();
				$time_field.removeClass('iqs-field-required');
			}
			
		} else {
			
			$date_field.val('');
			$time_wrapper.hide();
			$time_field.removeClass('iqs-field-required');
		}
	},
	
	that.init = function() {
		
		$('.' + form_class).validate({
			
			onSuccess: function($form) {
				
				var $event = $form.parents('.' + event_class),
				eventID = $event.find(':input[name="' + event_field_name + '"]').val() || 0,
				recordID = $event.find(':input[name="' + record_field_name + '"]').val() || 0,
				registrationID = $event.find(':input[name="' + registration_field_name + '"]').val() || 0,
				dateID = $event.find(':input[name="' + date_field_name + '"]').val() || 0;
				
				if (dateID != 0 && dateID != '') {
					
					var $time_wrapper = $event.find('.' + time_wrapper_class),
					timeID = $time_wrapper.find(':input[name="' + time_field_name + '"]').val() || 0,
					$submit = $form.find('.submit').hide(),
					$loading = $form.find('.loading').css('display', 'block'),
					
					date = new Date(),
					form_id = 'event_form_copy_' + date.getTime(),
					frame_id = 'event_form_frame_' + date.getTime(),
					
					html = '<form id="' + form_id + '" name="' + form_id + '" action="' + request_location + '" method="post" target="' + frame_id + '" style="display: none;">' +
								'<input type="hidden" name="dateID" value="' + dateID + '">' +
								'<input type="hidden" name="timeID" value="' + timeID + '">',
					
					fields = that.gather_custom_values($form);
					
					for (i=0; i < fields.length; i+=1) {
						
						html += '<input type="hidden" name="fields[]" value="' + fields[i][0] + '|' + fields[i][1] + '">';
					}
					
					html += 	'<input type="hidden" name="eventID" value="' + eventID + '">' +
								'<input type="hidden" name="recordID" value="' + recordID + '">' +
								'<input type="hidden" name="registrationID" value="' + registrationID + '">' +
							'</form>' +
							'<iframe id="' + frame_id + '" name="' + frame_id + '" style="display: none;"></iframe>';
					
					$('body').append(html);
					
					$('#' + frame_id).load(function() {
						
						$form.hide();
						$event.find('.' + thank_you_class).show();
						
						$('#' + form_id).remove();
						$('#' + frame_id).remove();
					});
					
					$('#' + form_id).submit();
				}
			}
		});
		
		/*
		 * daily events
		 */
		
		$('.' + calendar_class).iqs_calendar({
			
			omit_days: [0,1,2,3,4,5,6],
			
			on_select: that.show_time_options,
			
			on_load: function($div) {
				
				$div.show();
			}
		});
		
		/*
		 * one day and multi day events
		 */
		
		$('.' + dates_class).each(function(index) {
			
			// specific dates
			var $div = $(this),
			$date = $div.siblings('select[name="' + date_field_name + '"]'),
			dates = $div.html() && $.trim($div.html()).length != 0 ? $.parseJSON($div.html()) : {};
			
			$date.html('<option value=""></option>');
			
			$div.data('calendarIndex', 'cal' + index).html('');
			
			daily_and_multi_cache[$div.data('calendarIndex')] = [];
			
			for (i=0; i < dates.length; i+=1) {
				
				var year = dates[i].date.substr(0, 4),
				month = dates[i].date.substr(5, 2),
				day = dates[i].date.substr(8, 2),
				index = year + '-' + month + '-' + day;			
				
				daily_and_multi_cache[$div.data('calendarIndex')][index] = {
					id: dates[i].id,
					year: year,
					month: month,
					day: day,
					hasTimes: dates[i].hasTimes,
					times: dates[i].times
				};
				
				$date.append('<option value="' + dates[i].id + '" data-date="' + index + '">' + months[month - 1] + ' ' + day + ', ' + year + '</option>');
			}
			
			$date.change(function() {
				
				var $date_field = $(this),
				$div = $date_field.siblings('.' + dates_class),
				$event = $date.parents('.' + event_class),
				$selected = $date.children('option:selected'),
				$time_wrapper = $event.find('.' + time_wrapper_class),
				$time_field = $time_wrapper.find(':input[name="' + time_field_name + '"]'),
				cache_ref = daily_and_multi_cache[$div.data('calendarIndex')][$selected.data('date')];
				
				$time_field.html('<option value=""></option>');
				
				if (cache_ref !== undefined) {
					
					var date_id = cache_ref['id'],
					times = cache_ref['times'];
					
					if (times[0] !== undefined) {
						
						for (i=0; i < times.length; i+=1) {
							
							$time_field.append('<option value="' + times[i].id + '">' + times[i].start + ' - ' + times[i].end + '</option>')
						}
						
						$time_wrapper.show();
						$time_field.addClass('iqs-field-required');
						
					} else {
						
						$time_wrapper.hide();
						$time_field.removeClass('iqs-field-required');
					}
				}
			});
		});
	}();
};