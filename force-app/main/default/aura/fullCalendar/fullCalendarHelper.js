({
	helperMethod : function() {
		console.log('I called the lightning helper method!');
	},
	newEventInstance: function (component,date) {
		console.log('newEventInstance!');
	
		var startDateTime;
		var endDateTime;

		if (date._f == "YYYY-MM-DD"){

			console.log(moment(date.format()).add(12, 'hours').format());
			console.log(moment(date.format()).add(14, 'hours').format());
			
			startDateTime = moment(date.format()).add(12, 'hours').format();
			endDateTime = moment(date.format()).add(14, 'hours').format();

		//	component.set('v.startDateTimeVal', moment(date.format()).add(12, 'hours').format());
		//	component.set('v.endDateTimeVal', moment(date.format()).add(14, 'hours').format());
		} else {
			console.log( moment(date.format()).format());
			console.log(moment(date.format()).add(2, 'hours').format());

		//	component.set('v.startDateTimeVal', moment(date.format()).format());
		//	component.set('v.endDateTimeVal', moment(date.format()).add(2, 'hours').format());

			startDateTime = moment(date.format()).format();
			endDateTime = moment(date.format()).add(2, 'hours').format();
		}

		var scheduledEvent = {
			Id:null,
			contactId: null,
			title:null,
			start:startDateTime,
			end:endDateTime,
			allDay: false,
			url:null,
			description:null
		};

		component.set("v.scheduledEvent", scheduledEvent);
		
	//	return scheduledEvent;
//		console.log(scheduledEvent);
		
//		console.log(component.get('v.scheduledEvent'));
	},

	setModalBody: function (component, modalBodyComponents) {
		console.log('setModalBody!');
	//	component.set("v.modal", component.find("newEventModal"));
	//	console.log(component.get("v.modal"));
        $A.createComponents(modalBodyComponents,
            function (newComponents, status, statusMessagesList) {
				console.log(status);
				console.log(statusMessagesList);
				component.set("v.addEventComponent", newComponents[0]);
                component.get("v.modal").set("v.body", newComponents);
               component.get("v.modal").show();
            });
	},
	
	// eventRelationToEventSObject : function (event) {
	// 	var sObject = {};
	// },
	eventToSObject : function (event) {
		var sObject = {};
		sObject.sobjectType = 'Event';
		sObject.Subject = event.title;
		sObject.IsAllDayEvent = event.allDay;
		sObject.StartDateTime = event.start;
		sObject.EndDateTime = event.end;
		sObject.Id = event.sfid;
		console.log('sObject',sObject);
		return sObject;
	},
	sObjectToEvent : function (sObject) {
		var event = {};
		event.title = sObject.Subject;
		event.allDay = sObject.IsAllDayEvent;
		event.start = sObject.StartDateTime;
		event.end = sObject.EndDateTime;
		event.url = '/' + sObject.Id;
		event.sfid = sObject.Id;
		console.log('event',event);
		return event;
	},

	saveEvent:function (component, event, helper) {
		var action = component.get("c.upsertEvent");
		action.setParam("jsonString", JSON.stringify(component.get("v.scheduledEvent")));
		action.setCallback(this, function (response) {
			var state = response.getState();
			if (component.isValid() && state === "SUCCESS") {
				var returnValue = JSON.parse(response.getReturnValue());
				if (returnValue.isSuccess) {
					component.set('v.ScheduledEvents', returnValue.results.data);
					$('#calendar').fullCalendar('removeEvents');
					$('#calendar').fullCalendar('addEventSource', returnValue.results.data);
					component.get("v.modal").hide();
				}
			}
			else if (component.isValid() && state === "ERROR") {
				component.find('toaster').show('Failed!', 'failure', 'There was a problem logging your Event. Please contact HelpDesk.');
			}
			component.find("spinner").hide();
		});
		component.find("spinner").show();
		$A.enqueueAction(action);
	},

	createEvent: function(cmp,hlp,date) {
		// Cannot use `e.force:createRecord` to pre-populate record
		// Must use a custom action
	},
	getEvents: function(component,recordIds) {
		// https://fullcalendar.io/docs/event_data/Event_Object/
		console.log('in getEventList');
	    var action = component.get("c.getEventSObjects");
		if (recordIds) {
			action.setParams({'recordIds' : recordIds});
		}
	    action.setCallback(this, function(response) {
	        var state = response.getState();
	        if (component.isValid() && state === "SUCCESS") {
				console.log('events',response.getReturnValue());
	            component.set("v.events", response.getReturnValue());
	        }
	    });
	    $A.enqueueAction(action);
	},

	getScheduledEvents: function(component,recordIds) {
	    var getScheduledEventsAction = component.get("c.getEvents");
		getScheduledEventsAction.setCallback(this, function(response) {
			var state = response.getState();
			console.log(state);
	        if (component.isValid() && state === "SUCCESS") {
				var returnValue = JSON.parse(response.getReturnValue());
				if (returnValue.isSuccess) {
					component.set('v.ScheduledEvents', returnValue.results.data);
					$('#calendar').fullCalendar('addEventSource',returnValue.results.data);
				}
	        }
	    });
	    $A.enqueueAction(getScheduledEventsAction);
	},
	updateEvents: function(cmp,records) {
		console.log('in hlp.updateEvents');

		// http://salesforce.stackexchange.com/questions/113816/refresh-a-jquery-accordion-in-a-lightning-component
		// https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/js_cb_mod_ext_js.htm
		window.setTimeout(
			$A.getCallback(function(){
				var action = cmp.get('c.updateEventSObjects');
				action.setParams({"records" : records});
				action.setCallback(this,function(response){
					var state = response.getState();
					console.log('state ',state);
					if(cmp.isValid() && state === "SUCCESS") {
						console.log('events successfully updated');
					} else if (state === "ERROR") {
						response.getError().forEach(function(err){
							console.log('Error: ' + err.message);
						});
					}
				});
				$A.enqueueAction(action);
			}),0);
	},
	setCalendarDate: function(cmp) {
		// http://momentjs.com/docs/#/displaying/format/
		var view = cmp.get('v.view').toLowerCase();
		var moment = $('#calendar').fullCalendar('getDate');
		var headerDate;
		if (view.includes('month')) {
			headerDate = moment.format('MMMM YYYY');
		} else
		if (view.includes('day')) {
			headerDate = moment.format('MMMM DD, YYYY');
		} else
		if (view.includes('week')) {
			var startDay = moment.startOf('week').format('DD');
			var endDay = moment.endOf('week').format('DD');
			headerDate = moment.format('MMM ') + startDay + ' – ' + endDay + moment.format(', YYYY');
		}
		cmp.set('v.headerDate',headerDate);

	},
	makeSearchResultsDraggable: function (cmp,hlp) {
		console.log("makeSearchResultsDraggable");
		var uniqueId = cmp.getGlobalId() + 'external-events';
		$(document).ready(function(){

			// http://salesforce.stackexchange.com/questions/113816/refresh-a-jquery-accordion-in-a-lightning-component
			setTimeout(function(){
				var parent = $(document.getElementById(uniqueId));
				var events = $('.fc-event');
				var results = $(document.getElementById(uniqueId)).find(events);
				// console.log('results', results);

				results.each(function() {
					// store data so the calendar knows to render an event upon drop
					$(this).data('event', {
						title: $.trim($(this).text()), // use the element's text as the event title
						stick: true, // maintain when user navigates (see docs on the renderEvent method)
						contactId: $(this).data('sfid')
					});

					// make the event draggable using jQuery UI
					$(this).draggable({
						zIndex: 999,
						revert: true,      // will cause the event to go back to its
						revertDuration: 0  //  original position after the drag
					});

				});
			},0)

		});
	}
})
