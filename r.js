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
	
	
	
	function ajaxCalling(callback) {
		try{
			var $form = $("#" + settings.form),
			data = $form.serializeArray(),
			url = $form.attr("action");
			
			$.post(url, data, function(responseText) {
				
				
				
				var parseData = $.parseJSON(responseText);
				console.log(parseData);
				
				
			    billingStatus = parseData.billingStatus;
			     
			    submitStatus = parseData.submitStatus;
			     
			   /* 
			parseData.answerStatus = "right" ;
			 answerStatus = parseData.answerStatus;
			 parseData.givenAnswer ="option1";
			 parseData.rightAnswer ="option1";
			 */
				console.log(parseData);
				$.Topic("CQ10_ON_RESPONSE").publish();
			    if(billingStatus === "200"){
			    	
			    	doBillingStatusTrue(parseData,function(){
			    		
			    		if(submitStatus === "200"){
			    			
			    			doSubmitStatusTrue(parseData,function(){
			    				
			    				doAnswerStatus(parseData,answerStatus);
			    				
			    				if(parseData.badgeReceived != null && typeof parseData.badgeReceived  !== "undefined")
			    					showPopup(parseData.badgeReceived);
			    				
			    				if(parseData.skipQuestionPage == true) {
			    					var newurl = $('#skipQuestionPageUrlDiv').attr('srcref');
			    					setTimeout(function(){ window.location.href = newurl; }, 1000);
			    					
			    					//doAjaxToRefreshWidget(widgetKey);
			    				} 
			    				
			    			});
			        		
			        	} else if(submitStatus === "5001") {
			        		$.Topic("CQ10_ON_SUBMIT_STATUS_LIMIT_EXCEED").publish(parseData.submitMessage,settings.widgetKey);
			        	} else {
			        		$.Topic("CQ10_ON_SUBMIT_STATUS_FALSE").publish(parseData.submitMessage,settings.widgetKey);
			        	}
			    	});
			    	
			    	
			    }else{
			    	$.Topic("CQ10_ON_BILLING_FALSE").publish(parseData.billingMessage);
			    }
			    callback();
			});
		}catch(e){
			
		}
		
	}
	
	
})(jQuery);

function doRefreshWidgetForTimePerQuestion(widgetKey){
	$('.contestQuestionSubmitJqueryButton').trigger('click');
}

