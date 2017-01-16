(function($, _, PubSub) {
    
    var loadService = function() {
        
        var templateService = {
            
            GetTemplate: function(url, data) {
                
                var templateHtml;
                data = (data) ? data : {};
                
                $.ajax({
                    url : url,
                    type : "get",
                    async: false,
                    success : function(data) {
                        templateHtml = data;
                    },
                    error: function() {
                        // Handle error
                    }
                });
                
                templateHtml = _.template(templateHtml);
                
                return templateHtml(data);

            }
            
        }
        
        PubSub.publish("Service.Init.Template", { 'Service': templateService });
    }
    
    PubSub.subscribe("Init.TemplateService", loadService);
    
    

})($, _, PubSub);