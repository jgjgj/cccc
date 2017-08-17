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
					$.Topic("CQ10_ON_RESPONSE").publish();
					
					billingStatus = parseData.billingStatus;
					 
					submitStatus = parseData.submitStatus;
					 
					answerStatus = parseData.answerStatus;
				
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
		
		function doBillingStatusTrue(parseData,callback){
			$.Topic("CQ10_ON_BILLING_TRUE").publish(parseData.billingMessage);
			callback();
		}
		
		function doSubmitStatusTrue(parseData,callback){
			$.Topic("CQ10_ON_SUBMIT_STATUS_TRUE").publish(parseData.submitMessage);
			
			callback();
		}
		function doAnswerStatus(parseData,answerStatus){
			
			if(answerStatus === "right"){
				onRightAnswer(parseData);
			}else if (answerStatus === "NA") {
				onNOAnswer(parseData);
			}else{
				onWrongAnswer(parseData);
			}
		}
		function afterAjaxCalling() {
			
			
			
			if ($.isFunction(settings.onResponse)) {
				settings.onResponse.call(this);
			}
		}
		
		
		function onNOAnswer(parseData) {
			
				var isTimerEnable = $("#timer-" + settings.widgetKey).attr('isTimerEnable');
				var isTimePerQue = $("#timer-" + settings.widgetKey).attr('isTimePerQue');

				if((isTimerEnable == true || isTimerEnable == "true") && (isTimePerQue == true || isTimePerQue == "true")) {
					//console.log("app TIMER_WIDGET_RESET");
					if(parseData.skipQuestionPage != true) {
						doAjaxToRefreshWidget(settings.widgetKey,"WIDGET_REFRESH_ANIMATION_FIRST");
					}
					/*$.Topic("TIMER_WIDGET_RESET").publish();*/
					
				}
			
			
		}
		
		
		function onRightAnswer(parseData) {
			
			$.Topic("CQ10_ON_ANSWER_RIGHT").publish(parseData,settings.widgetKey);
			
			if ($.isFunction(settings.onAnswerRight)) {
				settings.onAnswerRight.call(this);
			}
		}
		
		function onWrongAnswer(parseData) {
			$.Topic("CQ10_ON_ANSWER_WRONG").publish(parseData,settings.widgetKey);
			
			if ($.isFunction(settings.onAnswerWrong)) {
				settings.onAnswerWrong.call(this);
			}
		}
		
		// Create the defaults once
		$.fn.questionWidgetAjax.defaultOptions = {

			form : null,

			onResponse : null,

			onAnswerRight : null,

			onAnswerWrong : null,

			onAnswerSubmitting : null,
			
			onFail: null
		};

		// function getFormUrl(){
		// return $(this).closest('form').attr('action');
		// }
		$.Topic("WIDGET_REFRESH_ANIMATION_FIRST").subscribe(refreshWidgetAnimationFirst);
		
		function refreshWidgetAnimationFirst(widgetKey1,url){
			
			
			$.get(url,function(response){
				
				$("#widget-"+widgetKey1).addClass("widget-"+widgetKey1+"-original");
				$("#widget-"+widgetKey1).clone().removeClass("widget-"+widgetKey1+"-original").addClass("widget-"+widgetKey1+"-clone hide").insertAfter( $("#widget-"+widgetKey1) );
			
				var $original = $(document).find(".widget-"+widgetKey1+"-original");
				
				var $Clone = $(document).find(".widget-"+widgetKey1+"-clone");
					
				$(".widget-"+widgetKey1+"-clone").html(response);
				
				//console.log(response);
				
				doSlide($original,$Clone,widgetKey1,response, function(){
					$(".masterQuestionWidgetWrapper").hide();
					countdownTimerPublish(widgetKey1);
					
					$('html, body').animate({
						scrollTop: $("#widget-"+widgetKey1).offset().top
					}, 500);
				});
				isAnswerGiven = false;
				
			});
		}
		
		function doSlide($original,$Clone,widgetKey1,response,callback){
			
			$original.each(function( i ) {
				$(this).slideToggle();
			});
			
			$Clone.each(function( i ) {
				
				
				$(this).slideToggle(function(){
					$(".widget-"+widgetKey1+"-clone").replaceWith(response).promise().done(function(){
						$original.remove().promise().done(function(){
							callback()
						});
					});
					
					
				});
			});
			
			
			
		}
		
		function showPopup(title){
			
			var $key = $("*[widgetSortableHelperTitle*='" + title + "']").attr("id");
			
			$.Topic("SHOW_WIDGET_ON_POPUP").publish($key);
		}
		
		function initCountdownTimer() {
			 var isTimerEnable = $('.countdown_timer').attr('isTimerEnable');
			if (isTimerEnable == true || isTimerEnable == "true") {
				logInfo("publish TIMER_WIDGET_START");
				logError("publish TIMER_WIDGET_START");
				 $.Topic("TIMER_WIDGET_START").publish();
				 
			 }
		 };

		 function countdownTimerPublish(widgetKey) {
			 var isTimerEnable = $("#timer-" + widgetKey).attr('isTimerEnable');
			 var isTimePerQue = $("#timer-" + widgetKey).attr('isTimePerQue');
		
			 if((isTimerEnable == true || isTimerEnable == "true") && (isTimePerQue == true || isTimePerQue == "true")) {
				 console.log("question TIMER_WIDGET_RESET");
				 $.Topic("TIMER_WIDGET_RESET").publish();
			 }
		 }

		 $(document).ready(function(){
				initCountdownTimer();
		 });
	})(jQuery);

	function doRefreshWidgetForTimePerQuestion(widgetKey){
		$('.contestQuestionSubmitJqueryButton').trigger('click');
	}

