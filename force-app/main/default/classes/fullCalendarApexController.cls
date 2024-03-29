public class fullCalendarApexController {
    
    static String dtFormat = 'EEE, d MMM yyyy HH:mm:ss z';

    public class ScheduledEvent {
        
        @AuraEnabled
        public Id Id {get;set;}
        @AuraEnabled
        public String title {get;set;}
        @AuraEnabled
        public Boolean allDay {get;set;}
        @AuraEnabled
        public DateTime  startString  {get;set;}
        @AuraEnabled
        public DateTime  endString  {get;set;}
        @AuraEnabled
        public String contactId {get;set;}

    @AuraEnabled
        public String description {get;set;}
      
        public ScheduledEvent(Event event){
            Id = event.id;
            title = event.Subject;
            allDay = event.IsAllDayEvent;
            startString = event.StartDateTime;
            endString = event.EndDateTime;
            description = event.Description;
            contactId = event.WhoId;
        }
        
        public Event toSObject(){
            return new Event(
                Id = this.Id,
                Subject = this.title,
                IsAllDayEvent = this.allDay,
                StartDateTime = this.startString,
                EndDateTime = this.endString,
                Description = this.description,
                WhoId = this.contactId
            );
        }
    }
    
    @AuraEnabled
    public static string getEvents(){
        
        strike_responseData responseData = new strike_responseData();
        try
        {
            Map<Id, ScheduledEvent> scheduledEvents = new Map<Id, ScheduledEvent>();
            for ( Event event : [SELECT Id, WhoId, WhatId, who.name, account.Name, Subject, Location, IsAllDayEvent, StartDateTime, EndDateTime, ActivityDateTime, ActivityDate, Description, AccountId, OwnerId, IsDeleted FROM Event
                                 where IsDeleted = false])
            {
                scheduledEvents.put(event.Id,new ScheduledEvent(event));
            }
            responseData.results = new Map<String, Object>{
                'data' => scheduledEvents.values()
                    };
                        }
        catch (Exception e) {
            responseData.addError(e.getMessage());
        }
        string jsonResponse = responseData.getJsonString();
        jsonResponse = jsonResponse.replace('startString','start');
        jsonResponse = jsonResponse.replace('endString','end');
        return jsonResponse;
    }

    @AuraEnabled
    public static string getContacts(String jsonString){
        strike_responseData responseData = new strike_responseData();
        List<Map<String, Object>> data = new List<Map<String, Object>>();
        String query;

        try {
            Map<String, Object> jsonMap = (Map<String, Object>)JSON.deserializeUntyped(jsonString);
            String searchTerm = String.escapeSingleQuotes((String)jsonMap.get('searchTerm'));
            query = 'SELECT Id, Account.Name, contact.Name from Contact where Name' + ' LIKE \'%' + searchTerm + '%\'';
            system.debug(query);
            for (Contact obj : Database.query(query)) {
                data.add(new Map<String, Object>{
                    'label' => obj.Name,
                    'sublabel' => obj.Account.Name,
                    'value' => obj.get('Id')
                });
            }

          responseData.results = new Map<String, Object>{
                    'data' => data,
                    'searchTerm' => searchTerm
          };

        } catch (Exception e) {
            responseData.addError(e.getMessage());
        }
        
        return responseData.getJsonString();
    }

    

    @AuraEnabled
    public static string upsertEvent(String jsonString){
        
        string jsonRequest = jsonString;
        jsonRequest = jsonRequest.replace('start','startString');
        jsonRequest = jsonRequest.replace('end','endString');

        system.debug(jsonRequest);
        ScheduledEvent se = (ScheduledEvent)JSON.deserialize(jsonRequest, ScheduledEvent.class);
        system.debug(se.toSObject());
        upsert se.toSObject();

        return getEvents();
        
    }

     @AuraEnabled
    public static string deleteEvent(String jsonString){
        
        string jsonRequest = jsonString;
        jsonRequest = jsonRequest.replace('start','startString');
        jsonRequest = jsonRequest.replace('end','endString');

        system.debug(jsonRequest);
        ScheduledEvent se = (ScheduledEvent)JSON.deserialize(jsonRequest, ScheduledEvent.class);
        system.debug(se.toSObject());
        delete se.toSObject();

        return getEvents();
        
    }
}
