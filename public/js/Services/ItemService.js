(function($, PubSub) {
    
    var loadService = function() {
        
        var jsonDataUrl = '/data/item-data.json';
        
        var itemService = {
            
            GetItems: function() {
                
                $.getJSON( jsonDataUrl, function( data ) {
                    
                    var response = data.CatalogEntryView;
                    var items = [];
                    
                    if(response instanceof Array) {
                        
                        if(response.length > 0) {
                            $.each( response, function( key, val ) {
                                items.push( val );
                            });
                        }
                        
                    }
                    
                    PubSub.publish("Item.Results.Complete", { Items : items });
                });

            }
            
        }
        
        PubSub.publish("Service.Init.Item", { 'Service': itemService });
    }
    
    PubSub.subscribe("Init.ItemService", loadService);
    
    

})($, PubSub);