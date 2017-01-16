(function ($, _, Backbone, PubSub) {
    'use strict';
    var _ItemService;
    var _TemplateService;
    var _MaxWaitTime = 5000;
    var _WaitTime = 0;
    var _Collection;
    
    var _Run = function() {
        
        // Requires service to proceed
        if(_ItemService == null || _TemplateService == null) {
            _WaitTime += 10;
            if(_WaitTime < _MaxWaitTime) {
                setTimeout(_Run , 10);
                return false;
            }
        }
        
        // Model
        var Item = Backbone.Model.extend({
            idAttribute: "itemId"
        });

        // Collection
        var Items = Backbone.Collection.extend({
            pending: true,
            model: Item,
            initialize: function() {
                var self = this;
                // Populate collection
                var populateCollection = function(eventName, eventObject) {
                    var items = eventObject.Items;
                    
                    if(items.length) {
                        self.reset(items);
                    }
                    
                    
                };

                // Subscribe to complete event posted by service Item Service
                PubSub.subscribe('Item.Results.Complete', populateCollection);
                 
            }
        });
        
        
        /***
        * Views
        */
        
        // Product List Container
        var ProductListContainerView = Backbone.View.extend({
            el: $('#productListContainer'),
            templatePath: "/templates/product-list-container.html",
            events: {
                
            },
            initialize: function() {
                var self = this;
                
                var handleRoute = function(eventName, eventObject) {
                    if(eventName === "Route.Default") {
                        self.$el.removeClass('hidden');
                        self.setPageTitle();
                    } else {
                        self.$el.addClass('hidden');   
                    }
                };
                
                PubSub.subscribe("Route", handleRoute);
                
                _Collection = new Items();
                _Collection.on("reset", this.renderListItems, this);
                _ItemService.GetItems();
                this.render();
            },
            template: function() {
                return _TemplateService.GetTemplate(this.templatePath);
            },
            render: function() {
                var self = this;
                this.$el.html(self.template());
            },
            renderListItems: function() {
                new ProductListView({ el: $('#productList'), items: _Collection});
                
                // Init detail view
                var detailView = new ProductDetailView();
            },
            setPageTitle: function() {
                document.title = "Product Listing";   
            }
            
        });
        
        // Product List View
        var ProductListView = Backbone.View.extend({
            templatePath: "/templates/product-list.html",
            items: [],
            events: {
                
            },
            initialize: function(data) {
                if(data.items && data.items.models) {
                    this.items = data.items.models;
                    this.render();
                }
            },
            template: function() {
                return _TemplateService.GetTemplate(this.templatePath, { Items: this.items });
            },
            render: function() {
                var self = this;
                this.$el.html(self.template());
            }
        });
        
        // Product Detail View
        var ProductDetailView = Backbone.View.extend({
            el: $('#productDetail'),
            quantity: 1,
            item: null,
            templatePath: "/templates/product-detail.html",
            events: {
                "click .js-quantity-minus": "quantityDeduct",
                "click .js-quantity-plus": "quantityAdd"
            },
            initialize: function() {
                var self = this;
                
                var handleRoute = function(eventName, eventObject) {
                    if(eventName === "Route.Item") {
                        self.$el.removeClass('hidden');
                        self.item = self.convertItem(_Collection.get(eventObject.Id));
                        self.setPageTitle();
                        self.render();
                    } else {
                        self.$el.addClass('hidden');   
                    }
                };
                
                PubSub.subscribe("Route", handleRoute);
            },
            template: function() {
                return _TemplateService.GetTemplate(this.templatePath, { Item: this.item });
            },
            render: function() {
                var self = this;
                this.$el.html(self.template());
                var carousel = new ImageCarouselView({ el: this.$el.find('.js-item-images'), Item: self.item });
            },
            convertItem: function(item) {
                var i = {};
                
                i.title = item.get("title"); 
                i.purchasingChannel = parseInt(item.get("purchasingChannelCode"));
                
                // Images
                i.images = [];
                
                var images = item.get("Images");
                
                if(images.length > 0) {
                    if(images[0].PrimaryImage.length > 0) {
                        i.images.push(images[0].PrimaryImage[0].image);
                    }
                    
                    if(images[0].AlternateImages.length > 0) {
                        _.each(images[0].AlternateImages, function(obj) {
                           i.images.push(obj.image);
                        });
                    }
                }
                
                // Promotions
                i.promotions = [];
                
                var promotions = item.get("Promotions");
                
                if(promotions.length > 0) {
                    _.each(promotions, function(obj) {
                       if(obj.Description.length > 0) {
                            _.each(obj.Description, function(o) {
                               i.promotions.push(o.shortDescription); 
                            });
                       }
                    });
                }
                
                // Pricing
                i.price = null;
                i.priceQualifier = null;
                
                var offers = item.get("Offers");
                
                if(offers.length > 0) {
                    if(offers[0].OfferPrice.length > 0) {
                        // Making assumption we simply want the first offer
                        i.price = offers[0].OfferPrice[0].formattedPriceValue;
                        i.priceQualifier = offers[0].OfferPrice[0].priceQualifier;
                    }
                }
                
                // Product Highlights
                i.features = [];
                
                var description = item.get("ItemDescription");
                
                if(description.length > 0) {
                    if(description[0].features.length > 0) {
                        _.each(description[0].features, function(val) {
                           i.features.push(val); 
                        });
                    }
                }
                
                // Reviews
                i.starRating = null;
                i.totalReviews = null;
                i.proReview = {};
                i.conReview = {};
                
                var customerReviews = item.get("CustomerReview");
                
                if(customerReviews.length > 0) {
                    var reviews = customerReviews[0];
                    i.starRating = parseInt(reviews.consolidatedOverallRating);  
                    i.totalReviews = parseInt(reviews.totalReviews);
                    
                    if(reviews.Con.length > 0) {
                        var conReview = reviews.Con[0];
                        i.conReview.rating = parseInt(conReview.overallRating);
                        i.conReview.title = conReview.title;
                        i.conReview.by = conReview.screenName;
                        i.conReview.date = conReview.datePosted;
                        i.conReview.review = conReview.review;
                    }
                    
                    if(reviews.Pro.length > 0) {
                        var proReview = reviews.Pro[0];
                        i.proReview.rating = parseInt(proReview.overallRating);
                        i.proReview.title = proReview.title;
                        i.proReview.by = proReview.screenName;
                        i.proReview.date = proReview.datePosted;
                        i.proReview.review = proReview.review;
                    }
                }
                
                return i;
                
            },
            setPageTitle: function() {
                
                if(this.item) {
                    document.title = this.item.title;   
                }
            },
            quantityDeduct: function() {
                if(this.quantity > 1) {
                    this.quantity--;
                    this.$el.find('.js-quantity').text(this.quantity);
                }
            },
            quantityAdd: function() {
                this.quantity++;
                this.$el.find('.js-quantity').text(this.quantity);
            }
        });
        
        // Image Carousel View
        var ImageCarouselView = Backbone.View.extend({
            item: {},
            images: [],
            lastImage: null,
            nextEnabled: false,
            previousEnabled: false,
            nextContainer: '.js-next-thumbnail',
            previousContainer: '.js-previous-thumbnail',
            currentContainer: '.js-active-thumbnail',
            currentImage: null,
            nextImage: null,
            previousImage: null,
            templatePath: "/templates/image-carousel.html",
            events: {
                'click .js-next-image': 'nextImage',
                'click .js-previous-image': 'previousImage'
            },
            initialize: function(options) {
                
                if(options.Item) {
                    this.item = options.Item;
                }
                
                if(options.Item.images) {
                    this.images = options.Item.images;
                    this.lastImage = this.images.length - 1;
                    
                    if(this.images.length > 0) {
                        this.currentImage = 0;   
                        
                        if(this.images.length > 1) {
                            this.nextEnabled = true; 
                            this.nextImage = 1;
                        }
                    
                        if(this.images.length > 2) {
                            this.previousEnabled = true;  
                            this.previousImage = this.images.length - 1;
                        }
                    }
            
                }

                this.render();
            },
            template: function() {
                return _TemplateService.GetTemplate(this.templatePath, { Images: this.images, Item: this.item });
            },
            render: function() {
                var self = this;
                this.$el.html(self.template());
                this.setThumbnails();
            },
            setThumbnails: function() {
                
                this.$el.find(this.currentContainer).html("<img src='" + this.images[this.currentImage] + "' />");
                
                if(this.nextEnabled) {
                    this.$el.find(this.nextContainer + ' button').html("<img src='" + this.images[this.nextImage] + "' />");
                    this.$el.find(this.nextContainer).removeClass('hidden');
                }
                
                if(this.previousEnabled) {
                    this.$el.find(this.previousContainer + ' button').html("<img src='" + this.images[this.previousImage] + "' />");
                    this.$el.find(this.previousContainer).removeClass('hidden');
                }
                
                this.setLargeImage();
            },
            setLargeImage: function() {
                this.$el.find('.js-large-image').prop('src', this.images[this.currentImage]);
            },
            nextImage: function() {
                
                if(this.currentImage + 1 > this.lastImage) {
                    
                    this.currentImage = 0;
                    
                    if(this.lastImage > 0) {
                        this.nextImage = 1;
                        
                        if(this.lastImage > 1) {
                            this.previousImage = this.lastImage;   
                        }
                    }
                    
                } else if(this.currentImage + 1 == this.lastImage) {
                    
                    this.currentImage = this.lastImage;
                    this.nextImage = 0;
                    
                    if(this.lastImage > 1) {
                        this.previousImage = this.currentImage - 1;
                    }
                    
                } else {
                    
                    this.currentImage = this.currentImage + 1;
                    this.nextImage = this.nextImage + 1;
                    
                    if(this.lastImage > 1) {
                        this.previousImage = this.currentImage - 1;   
                    }
                    
                }
                
                this.setThumbnails();

            },
            previousImage: function() {
                
                if(this.currentImage - 1 < 0) {
                    
                    this.currentImage = this.lastImage;
                    
                    if(this.lastImage > 0) {
                        this.nextImage = 0;
                        
                        if(this.lastImage > 1) {
                            this.previousImage = this.currentImage - 1;   
                        }
                    }
                    
                } else if(this.currentImage - 1 == 0) {
                    
                    this.currentImage = 0;
                    
                    if(this.lastImage > 0) {
                        this.nextImage = 1;
                        
                        if(this.lastImage > 1) {
                            this.previousImage = this.lastImage;
                        }
                    }

                } else {
                    
                    this.currentImage = this.currentImage - 1;
                    this.previousImage = this.currentImage - 1;
                    
                    if(this.lastImage > 1) {
                        this.nextImage = this.currentImage + 1;   
                    }
                    
                }
                
                this.setThumbnails();

            }
            
        });
        
        // Init main view
        var mainView = new ProductListContainerView();
        
        // Start Router
        PubSub.publish("Router.Init");
    }
    
    _Run();
    
    var getServices = function(eventName, eventObject) {
        
        switch(eventName) {
                
            case "Service.Init.Item":
                _ItemService = eventObject.Service;
                break;

            case "Service.Init.Template":
                _TemplateService = eventObject.Service;
                break;
                
        }
    };

    PubSub.subscribe('Service.Init', getServices);

})($, _, Backbone, PubSub);