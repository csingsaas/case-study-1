
(function (PubSub) {
    
    var initRouter = function(eventName, eventObject) {
        
        PubSub.unsubscribe(eventName, initRouter);
        
        var AppRouter = Backbone.Router.extend({

          routes: {
            "item/:id": "itemRoute",
            "*actions": "defaultRoute"
          },
          itemRoute: function(id) {
              PubSub.publish("Route.Item", { Id: id });
          },
          defaultRoute: function() {
              PubSub.publish("Route.Default");
          }
        });

        var app_router = new AppRouter;

        Backbone.history.start();
    }
    
    PubSub.subscribe("Router.Init", initRouter);
    
})(PubSub)