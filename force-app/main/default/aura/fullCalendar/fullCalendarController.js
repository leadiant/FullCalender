({
	doInit: function (cmp, evt, hlp) {
		cmp.set("v.modal", cmp.find("newEventModal"));
	},
	prev: function (cmp, evt, hlp) {
		$('#calendar').fullCalendar('prev');
		hlp.setCalendarDate(cmp);
	},
	next: function (cmp, evt, hlp) {
		$('#calendar').fullCalendar('next');
		hlp.setCalendarDate(cmp);
	},
	today: function (cmp, evt, hlp) {
		$('#calendar').fullCalendar('today');
		hlp.setCalendarDate(cmp);
	},
	month: function (cmp, evt, hlp) {
		$('#calendar').fullCalendar('changeView', 'month');
		cmp.set('v.view', 'month');
		hlp.setCalendarDate(cmp);
	},
	basicWeek: function (cmp, evt, hlp) {
		$('#calendar').fullCalendar('changeView', 'basicWeek');
		cmp.set('v.view', 'basicWeek');
		hlp.setCalendarDate(cmp);
	},
	listWeek: function (cmp, evt, hlp) {
		$('#calendar').fullCalendar('changeView', 'listWeek');
		cmp.set('v.view', 'listWeek');
		hlp.setCalendarDate(cmp);
	},
	basicDay: function (cmp, evt, hlp) {
		$('#calendar').fullCalendar('changeView', 'agendaDay');
		cmp.set('v.view', 'agendaDay');
		hlp.setCalendarDate(cmp);
	},
	listDay: function (cmp, evt, hlp) {
		$('#calendar').fullCalendar('changeView', 'listDay');
		cmp.set('v.view', 'listDay');
		hlp.setCalendarDate(cmp);
	},
	handleClickSave: function (component, event, helper) {
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

	handleClickDeleteModal: function (component, event, helper) {
		var action = component.get("c.deleteEvent");
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
				component.find('toaster').show('Failed!', 'failure', 'There was a problem Deleting your Event. Please contact HelpDesk.');
			}
			component.find("spinner").hide();
		});
		component.find("spinner").show();
		$A.enqueueAction(action);
	},

	handledayClickEvent: function (cmp, evt, hlp) {
		cmp.set("v.showDeleteButton", false);
		var date = evt.getParam("data");
		hlp.newEventInstance(cmp, date);
		var newModalBody = [
			["c:addEvent", {
				scheduledEvent: cmp.getReference("v.scheduledEvent")
			}]
		];
		hlp.setModalBody(cmp, newModalBody);
	},

	handleEventClick: function (cmp, evt, hlp) {
		var clickedEvent = evt.getParam("data");
		cmp.set("v.showDeleteButton", true);
		var ScheduledEvents = cmp.get("v.ScheduledEvents");
		ScheduledEvents.forEach(function (ScheduledEvent) {
			if (ScheduledEvent.Id === clickedEvent.Id) {
				cmp.set("v.scheduledEvent", ScheduledEvent);
				var newModalBody = [
					["c:addEvent", {
						scheduledEvent: cmp.getReference("v.scheduledEvent")
					}]
				];
				hlp.setModalBody(cmp, newModalBody);
			}
		});
	},


	jsLoaded: function (cmp, evt, hlp) {
		// Fetch events and load in calendar
		hlp.getScheduledEvents(cmp);
		$(document).ready(function () {
			$('#calendar').fullCalendar({
				header: false,
				timezone: 'local',
				navLinks: true, // can click day/week names to navigate views
				editable: true,
				droppable: true, // allows things to be dropped onto the calendar
				selectable: true,
				selectHelper: true,
				eventLimit: true, // allow "more" link when too many events
				events: [],
				// Callbacks
				dayClick:
					function (date, jsEvent, ui, resourceObj) {
						$A.getCallback(
							function () {
								var messageEvent = cmp.getEvent("dayClickEvent");
								messageEvent.setParam("data", date);
								messageEvent.fire()
							}
						)();
					},

				drop: function (date, jsEvent, ui, resourceId) {
					console.log('an event has been dropped!');
					hlp.helperMethod();
					// // is the "remove after drop" checkbox checked?
					// if ($('#drop-remove').is(':checked')) {
					// 	// if so, remove the element from the "Draggable Events" list
					// 	$(this).remove();
					// }
				},
				eventClick: function (calEvent, jsEvent, view) {
					$A.getCallback(
						function () {
							var messageEvent = cmp.getEvent("eventClick");
							messageEvent.setParam("data", calEvent);
							messageEvent.fire()
						}
					)();

					hlp.helperMethod();
					// change the border color just for fun
					$(this).css('border-color', 'red');
				},
				eventDrop: function (event, delta, revertFunc) {
					console.log(event.title + " was dropped on " + event.start.format());
					if (!confirm("Are you sure about this change?")) {
						revertFunc();
					} else {
						var sObject = hlp.eventToSObject(event);
						hlp.updateEvents(cmp, [sObject]);
					}
				},
				eventResize: function (event, delta, revertFunc) {
					console.log(event.title + " end is now " + event.end.format());
					if (!confirm("is this okay?")) {
						revertFunc();
					} else {
						var sObject = hlp.eventToSObject(event);
						hlp.updateEvents(cmp, [sObject]);
					}
				},
				eventReceive: function (event) {
					console.log('event received', event);
					var sObject = hlp.eventToSObject(event);
					sObject.WhatId = sObject.Id;
					sObject.Id = null;
					hlp.updateEvents(cmp, [sObject]);
				}
			});

			hlp.setCalendarDate(cmp);
		});
	},
})