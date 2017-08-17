;

var settings = null;

var defaultElem = null;

var billingStatus = null;

var billingMessage = null;

var submitStatus = null;

var submitMessage = null;

var answerStatus = null;

var rightAnswer = null;

var givenAnswer = null;

var isAnswerGiven = false;



(function($) {
	

	var answer = (function () {
	    var isAnswerGivenC = false;
	    return function () {
	    	console.log('Submitting answer');
	    	if(!isAnswerGivenC) {
	    		console.log('inside submit answer');
	    		isAnswerGivenC = true;
	    		ajaxCalling(function(){
	    			isAnswerGivenC = false;
	    		});
	    		return;
	    	}
	    }
	})();
	
	$.fn.questionWidgetAjax = function(options) {
		
		defaultElem = $(this);
		
		
		// Get some values from elements on the page:
		settings = $.extend({}, $.fn.questionWidgetAjax.defaultOptions,
				options);
		
		
		
		
		
		beforeAjaxCalling(function() {
			
			if(!isAnswerGiven){
				isAnswerGiven = true;
				answer();
			}
		});
		
		//return false; // avoid to execute the actual submit of the form.
	};

	function beforeAjaxCalling(callback) {
	
		$.Topic("CQ10_ON_ANSWER_SUBMITTING").publish();
		
		
		
		var isTimerEnable = $("#timer-" + settings.widgetKey).attr('isTimerEnable');
		var isTimePerQue = $("#timer-" + settings.widgetKey).attr('isTimePerQue');

		if((isTimerEnable == true || isTimerEnable == "true") && (isTimePerQue == true || isTimePerQue == "true")) {
			$.Topic("TIMER_WIDGET_PAUSE").publish();
		}
		if ($.isFunction(settings.onAnswerSubmitting)) {

			settings.onAnswerSubmitting.call(this);
		}
		
		callback();
	}
	
	
})(jQuery);

function doRefreshWidgetForTimePerQuestion(widgetKey){
	$('.contestQuestionSubmitJqueryButton').trigger('click');
}

