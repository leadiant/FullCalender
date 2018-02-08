({
    showToaster: function(component, event, helper) {
        var params = event.getParam("arguments");
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            "title": params.title,
            "type": params.type,
            "message": params.message
        });
        toastEvent.fire();
    },
})