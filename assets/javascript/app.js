// Compute Values
var compute = {

    startAddress: '',
    destinationAddress: '',
    resultCounter: 1,

    // Get address in form of street, city, and state and return address object
    getAddress: function() {
        var addressSentence = $('#address').val().trim();
        if (addressSentence) {
            var addressList = addressSentence.split(' ');
        } else {
            var addressList = '';
        }
        var city = $('#city').val().trim();
        var state = $('#state').val().trim();
        if (addressList === '' && city === '' && state === '') {
            return 'empty';
        } else {
            var addressObj = {
                addressList: addressList,
                city: city,
                state: state
            };
            return addressObj;
        }
    },

    // Get zip code, verify format, and return appropriate value
    getZip: function() {
        var zip = $('#zipCode').val().trim();
        var zipValid = /^\d{5}$/;
        if (zip.match(zipValid)) { 
            var zipObj = {
                zip: zip
            };
            return zipObj;
        } else if (zip === '') {
            return 'empty';
        } else {
            return 'invalid';
        }
    },

    // Translate chosen search criteria into required value needed in API to sort results correctly
    getSearchCriteria: function() {
        var searchCriteria = $('#searchCriteria').val().trim();
        if (searchCriteria === 'Rating') {
            return 'rating';
        }
        if (searchCriteria === 'Cost') {
            return 'cost';
        }
        if (searchCriteria === 'Distance') {
            return 'real_distance';
        }
    },

    // Translate chosen search criteria into required value needed in API to sort results correctly
    getSearchOrder: function() {
        var searchOrder = $('#searchOrder').val().trim();
        if (searchOrder === 'High') {
            return 'desc';
        }
        if (searchOrder === 'Low') {
            return 'asc';
        }
    },

    // Using address and search criteria, use Google Geo API to get Latitude and Longitude of location chosen
    // After results obtained, run get Restaurant method which queries zomato restaurant search API based on geo location
    getGeo: function (addressObj, searchCriteria, searchOrder) {
        var query = '';
        var queryList = [];
        var addressList = addressObj.addressList;
        var city = addressObj.city;
        var state = addressObj.state;
        var zip = addressObj.zip;

        if (addressList) {
            var addressQuery = addressList.join('+');
            queryList.push(addressQuery);
        }
        if (city) {
            queryList.push(city);
        }
        if (state) {
            queryList.push(state);
        }
        if (zip) {
            queryList.push(zip);
        }
        query = queryList.join(',+');
        var queryURL = "https://maps.googleapis.com/maps/api/geocode/json?address=" + query + "&key=AIzaSyBZgPjyk5ho6Axhr_2dU1Ay3M7rU71HXvs";
        $.ajax({url: queryURL, method: 'GET'})
        .then(function(response) {
            var lat = response.results[0].geometry.location.lat;
            var lng = response.results[0].geometry.location.lng;
            lati = lat;
            long = lng;
            findMovie(lat, lng);
            var address = response.results[0].formatted_address;
            compute.startAddress = address;
            db.setRestOnLoad();
            var addressList = address.split(', ');
            var geoObj = {
                lat: lat,
                lng: lng,
                searchCriteria: searchCriteria,
                searchOrder: searchOrder
            };
            return geoObj;
        })
        .then (function(geoObj) {
            compute.getRest(geoObj);
        })
        .fail (function(error) {
            console.log(error);
        });
    },

    // Using zomato API, obtain list of restaurants based on geo coordinates in lattitude and longitude
    // Display results onto page output location
    getRest: function(geoObj, newQueryURL) {
        var lat = geoObj.lat;
        var lng = geoObj.lng;
        var searchCriteria;
        var searchOrder;
        var queryURL;
        if (geoObj.searchCriteria) {
            searchCriteria = geoObj.searchCriteria;
        } else {
            searchCriteria = 'rating';
        }
        if (geoObj.searchOrder) {
            searchOrder = geoObj.searchOrder;
        } else {
            searchOrder = 'desc';
        }
        if (newQueryURL) {
            queryURL = newQueryURL;
        } else {
            queryURL = "https://developers.zomato.com/api/v2.1/search?lat=" + lat + "&lon=" + lng + "&radius=1000&sort=" + searchCriteria + "&order=" + searchOrder + "&apikey=4e48375b934f553b68f4409de5bdf9bb";
        }
        $.ajax({url: queryURL, method: 'GET'})
        .then(function(response) {
            var name;
            var location;
            var cuisine;
            var rating;
            var priceRange;
            var link;
            for (var i = 0; i < response.restaurants.length; i++) {
                name = response.restaurants[i].restaurant.name;
                location = response.restaurants[i].restaurant.location.address;
                cuisine = response.restaurants[i].restaurant.cuisines;
                rating = response.restaurants[i].restaurant.user_rating.aggregate_rating;
                priceRange = response.restaurants[i].restaurant.price_range;
                link = response.restaurants[i].restaurant.url;
                render.displayRest(name, location, cuisine, rating, priceRange, link);
            }
            if (response.restaurants.length === 20 && compute.resultCounter < 22) {
                compute.resultCounter += 20;
                var newQuery = "https://developers.zomato.com/api/v2.1/search?start=" + compute.resultCounter + "&lat=" + lat + "&lon=" + lng + "&radius=1000&sort=" + searchCriteria + "&order=" + searchOrder + "&apikey=4e48375b934f553b68f4409de5bdf9bb";
                compute.getRest(geoObj, newQuery);
            } else {
                compute.resultCounter = 1;
            }
        });
    }

};

// Output data onto html page
var render = {

    // Display list of restaurants on restaurant output location in html
    displayRest: function(name, location, cuisine, rating, priceRange, link) {
        var nameTr = $('<tr>');
        var nameTh = $('<th>');
        nameTh.attr('colspan', '3');
        nameTh.css('padding', '0');
        nameTh.text(name);
        nameTr.append(nameTh);
        var locationTr = $('<tr>');
        var locationTd = $('<td>');
        locationTd.attr('colspan', '3');
        locationTd.css('padding', '0');
        locationTd.text(location);
        locationTr.append(locationTd);
        var infoTr = $('<tr>');
        var cuisineTr = $('<tr>');
        var cuisineTd = $('<td>');
        cuisineTd.attr('colspan', '3');
        cuisineTd.css('padding', '0');
        cuisineTd.text('Cuisine: ' + cuisine);
        cuisineTr.append(cuisineTd);
        var ratingTd = $('<td>');
        ratingTd.css('padding', '0 5px 0 0');
        ratingTd.text('User Rating: ');
        for (var i = 0; i < Math.round(rating); i++) {
            var ratingGlyph = $('<i>');
            ratingGlyph.addClass('tiny material-icons');
            ratingGlyph.text('grade');
            ratingTd.append(ratingGlyph);
        }
        infoTr.append(ratingTd);
        var priceTd = $('<td>');
        priceTd.css('padding', '0 5px 0 0');
        priceTd.text('Price Range: ');
        for (var ii = 0; ii < priceRange; ii++) {
            var priceGlyph = $('<i>');
            priceGlyph.addClass('tiny material-icons');
            priceGlyph.text('credit_card');
            priceTd.append(priceGlyph);
        }
        infoTr.append(priceTd);
        var linkTd = $('<td>');
        var linkA = $('<a>');
        var linkGlyph = $('<i>');
        linkGlyph.addClass('tiny material-icons');
        linkGlyph.text('info');
        linkA.attr('href', link);
        linkA.attr('target', '_blank');
        linkA.text(' more info');
        linkA.prepend(linkGlyph);
        linkTd.css('padding', '0');
        linkTd.html(linkA);
        infoTr.append(linkTd);
        var buttonTr = $('<tr>');
        var buttonTd = $('<td>');
        var choiceBtn = $('<button>');
        var btnGlyph = $('<i>');
        btnGlyph.addClass('tiny material-icons');
        btnGlyph.text('queue');
        choiceBtn.addClass('addRestaurant green darken-1 btn-small');
        choiceBtn.css('color', 'white');
        choiceBtn.attr('data-name', name);
        choiceBtn.attr('data-location', location);
        choiceBtn.attr('data-cuisine', cuisine);
        choiceBtn.attr('data-rating', rating);
        choiceBtn.attr('data-priceRange', priceRange);
        choiceBtn.attr('data-link', link);
        choiceBtn.text(' Add to Itinerary');
        choiceBtn.prepend(btnGlyph);
        buttonTd.attr('colspan', '3');
        buttonTd.css('padding', '0 0 10px 0');
        buttonTd.html(choiceBtn);
        buttonTr.append(buttonTd);
        $('#restaurantOutput').append(nameTr);
        $('#restaurantOutput').append(locationTr);
        $('#restaurantOutput').append(cuisineTr);
        $('#restaurantOutput').append(infoTr);
        $('#restaurantOutput').append(buttonTr);
    },

    // Display google map of initial query location to location of chosen restaurant
    displayRestDistanceMap: function(origin, destination) {
        var queryBegin = 'https://www.google.com/maps/embed/v1/directions?key=AIzaSyD5L9bqnVgrw-XfE1nZbhREaDukQJVPDQs&';
        var queryOrigin = 'origin=' + origin.split(', ').join('+') + '&';
        var destinationList = destination.split(', ').join('+');
        var queryDestination = 'destination=' + destinationList.split(' ').join('+') + '&';
        var queryEnd = 'avoid=tolls|highways';
        var queryURL = queryBegin + queryOrigin + queryDestination + queryEnd;
        var iframe = $('<iframe>')
        var blankP = $('<p>');
        iframe.attr('id', 'restaurantMap');
        iframe.attr('width', '450');
        iframe.attr('height', '250');
        iframe.attr('frameborder', '0');
        iframe.attr('style', 'border:0');
        iframe.attr('src', queryURL);
        iframe.attr('allowfullscreen');
        $('#mapOutputModal').html(iframe);
        $('#mapOutputModal').append(blankP);
    },

    // Display google map of location of restaurant chosen when no initial location is available
    displayRestMap: function(destination) {
        var queryBegin = 'https://www.google.com/maps/embed/v1/search?key=AIzaSyD5L9bqnVgrw-XfE1nZbhREaDukQJVPDQs&q='
        var destinationList = destination.split(', ').join('+');
        var queryDestination = destinationList.split(' ').join('+');
        var queryURL = queryBegin + queryDestination;
        var iframe = $('<iframe>')
        var blankP = $('<p>');
        iframe.attr('id', 'restaurantMap');
        iframe.attr('width', '450');
        iframe.attr('height', '250');
        iframe.attr('frameborder', '0');
        iframe.attr('style', 'border:0');
        iframe.attr('src', queryURL);
        iframe.attr('allowfullscreen');
        $('#mapOutputModal').html(iframe);
        $('#mapOutputModal').append(blankP);
    },

    // Display chosen restaurant in itinerary output field on html page
    displayRestChoice: function(name, location, cuisine, rating, priceRange, link) {
        var nameTr = $('<tr>');
        var nameTh = $('<th>');
        nameTh.attr('colspan', '3');
        nameTh.css('padding', '0');
        nameTh.text(name);
        nameTr.append(nameTh);
        var locationTr = $('<tr>');
        var locationTd = $('<td>');
        locationTd.attr('colspan', '3');
        locationTd.css('padding', '0');
        locationTd.text(location);
        locationTr.append(locationTd);
        var infoTr = $('<tr>');
        var cuisineTr = $('<tr>');
        var cuisineTd = $('<td>');
        cuisineTd.attr('colspan', '3');
        cuisineTd.css('padding', '0');
        cuisineTd.text('Cuisine: ' + cuisine);
        cuisineTr.append(cuisineTd);
        var ratingTd = $('<td>');
        ratingTd.css('padding', '0 5px 0 0');
        ratingTd.text('User Rating: ');
        for (var i = 0; i < Math.round(rating); i++) {
            var ratingGlyph = $('<i>');
            ratingGlyph.addClass('tiny material-icons');
            ratingGlyph.text('grade');
            ratingTd.append(ratingGlyph);
        }
        infoTr.append(ratingTd);
        var priceTd = $('<td>');
        priceTd.css('padding', '0 5px 0 0');
        priceTd.text('Price Range: ');
        for (var ii = 0; ii < priceRange; ii++) {
            var priceGlyph = $('<i>');
            priceGlyph.addClass('tiny material-icons');
            priceGlyph.text('credit_card');
            priceTd.append(priceGlyph);
        }
        infoTr.append(priceTd);
        var linkTd = $('<td>');
        var linkA = $('<a>');
        var linkGlyph = $('<i>');
        linkGlyph.addClass('tiny material-icons');
        linkGlyph.text('info');
        linkA.attr('href', link);
        linkA.attr('target', '_blank');
        linkA.text(' more info');
        linkA.prepend(linkGlyph);
        linkTd.css('padding', '0');
        linkTd.html(linkA);
        infoTr.append(linkTd);
        var buttonTr = $('<tr>');
        var buttonTd = $('<td>');
        var choiceBtn = $('<button>');
        var btnGlyph = $('<i>');
        btnGlyph.addClass('tiny material-icons');
        btnGlyph.text('not_interested');
        choiceBtn.addClass('removeRest red lighten-1 btn-small');
        choiceBtn.css('color', 'white');
        choiceBtn.text(' Remove From Itinerary');
        choiceBtn.prepend(btnGlyph);
        buttonTd.attr('colspan', '3');
        buttonTd.css('padding', '0 0 10px 0');
        buttonTd.html(choiceBtn);
        buttonTr.append(buttonTd);
        $('#restaurantOutputModal').append(nameTr);
        $('#restaurantOutputModal').append(locationTr);
        $('#restaurantOutputModal').append(cuisineTr);
        $('#restaurantOutputModal').append(infoTr);
        $('#restaurantOutputModal').append(buttonTr);
    },

    // Clear input fields after submitting request
    clearInput: function() {
        $('#address').val("");
        $('#city').val("");
        $('#state').val("");
        $('#zip').val("");
    },

    // Clear list of restaurants in html before each list render
    clearRestTable: function() {
        $('#restaurantOutput').empty();
    },

    // Clear itinerary restaurant choice field before each output render
    clearRestChoice: function() {
        $('#restaurantOutputModal').empty();
    },

    // Clear map output field before each map render
    clearMapOutput: function() {
        $('#mapOutputModal').empty();
    }

};

var db = {
    // Write restaurant object to database restaurant reference object
    setRest: function(restObj) {
        var restExists = false;
        database.ref('/restaurant').once("value", function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
                if (childSnapshot.val().userId === restObj.userId) {
                    var key = childSnapshot.key;
                    database.ref('/restaurant/' + key).remove();
                    database.ref('/restaurant').push(restObj);
                    restExists = true;
                }
            });
        });
        if (restExists === false) {
            database.ref('/restaurant').push(restObj);
        }
    },

    // Cause database change on page load to initiate map render for restaurant database
    setRestOnLoad: function () {
        database.ref('/restaurant').once("value", function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
                if (childSnapshot.val().userId === userId) {
                    var name = childSnapshot.val().name;
                    var location = childSnapshot.val().location;
                    var cuisine = childSnapshot.val().cuisine;
                    var rating = childSnapshot.val().rating;
                    var priceRange = childSnapshot.val().priceRange;
                    var link = childSnapshot.val().link;
                    var restObj = {
                        name: name,
                        location: location,
                        cuisine: cuisine,
                        rating: rating,
                        priceRange: priceRange,
                        link: link,
                        userId: userId
                    };
                    var key = childSnapshot.key;
                    database.ref('/restaurant/' + key).remove();
                    database.ref('/restaurant').push(restObj);
                }
            });
        });
    },

    // Cause database change on page load to initiate map render for movie database
    setMovieOnLoad: function () {
        database.ref('/movieChoice').once("value", function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
                if (childSnapshot.val().userId === userId) {
                    var address = childSnapshot.val().address;
                    var date = childSnapshot.val().date;
                    var theater = childSnapshot.val().theater;
                    var time = childSnapshot.val().time;
                    var title = childSnapshot.val().title;
                    var movieObj = {
                        address: address,
                        date: date,
                        theater: theater,
                        time: time,
                        title: title,
                        userId: userId
                    };
                    var key = childSnapshot.key;
                    database.ref('/movieChoice/' + key).remove();
                    database.ref('/movieChoice').push(movieObj);
                }
            });
        });
    },

    getMovieOnLoad: function() {
        database.ref('/movieChoice').once("value", function(snapshot) {
            if (snapshot.val().userId === userId) {
                var address = snapshot.val().address;
                if (addressR) {
                    console.log(addressR);
                    console.log(address);
                    render.displayRestDistanceMap(addressR, address);
                    theaterAddress = address;
                    displaySelection();
                    db.setMovieAddress(address);
                } else {
                    render.displayRestMap(address);
                    theaterAddress = address;
                    displaySelection();
                    db.setMovieAddress(address);
                }
            }
        })
    },

    setMovieAddress: function(address) {
        console.log(address);
        addressM = address;
    },

    // Remove restaurant object from database upon clicking the restaurant remove button in itinerary
    removeRest: function() {
        database.ref('/restaurant').once("value", function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
                if (childSnapshot.val().userId === userId) {
                    var key = childSnapshot.key;
                    database.ref('/restaurant/' + key).remove();
                    render.clearRestChoice();
                    render.clearMapOutput();
                }
            });
        });
    }
};


$(document).ready(function() {

    // Process address input upon clicking the submit button
    $('#submit').on('click', function() {
        var checkUser = sessionStorage.getItem('appPageLoaded');
        if (!checkUser || checkUser === 'false') {
            window.location = "index.html";
        } else {
            render.clearRestTable();
            var addressObj = compute.getAddress();
            var zipObj = compute.getZip();
            var searchCriteria = compute.getSearchCriteria();
            var searchOrder = compute.getSearchOrder();
            if (zipObj === 'invalid') {
                Materialize.toast('Please enter a valid zip code!', 4000);
            } else if (zipObj === 'empty' && addressObj === 'empty') {
                Materialize.toast('Please enter a valid zip code or address, city, state!', 4000);
            } else if (zipObj && typeof zipObj === 'object') {
                render.clearInput();
                compute.getGeo(zipObj, searchCriteria, searchOrder);
            } else {
                render.clearInput();
                compute.getGeo(addressObj, searchCriteria, searchOrder);
            }
        }

        return false;

    });

    // Process add restaurant button upon clicking on the specific restaurant in generated restaurant list
    $('#restaurantOutput').on('click', '.addRestaurant', function() {
        var name = $(this).attr('data-name');
        var location = $(this).attr('data-location');
        var cuisine = $(this).attr('data-cuisine');
        var rating = $(this).attr('data-rating');
        var priceRange = $(this).attr('data-priceRange');
        var link = $(this).attr('data-link');
        var restObj = {
            name: name,
            location: location,
            cuisine: cuisine,
            rating: rating,
            priceRange: priceRange,
            link: link,
            userId: userId
        };
        db.setRest(restObj);
    });

    // Process remove restaurant button upon clicking on the specific restaurant in the generated restaurant itinerary location
    $('#restaurantOutputModal').on('click', '.removeRest', function() {
        db.removeRest();
        render.clearMapOutput();
    });

    // Process values upon changes in the restaurant database reference object
    database.ref('/restaurant').on("value", function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            if (childSnapshot.val().userId === userId) {
                render.clearRestChoice();
                var name = childSnapshot.val().name;
                var location = childSnapshot.val().location;
                var cuisine = childSnapshot.val().cuisine;
                var rating = childSnapshot.val().rating;
                var priceRange = childSnapshot.val().priceRange;
                var link = childSnapshot.val().link;
                addressR = location;
                render.displayRestChoice(name, location, cuisine, rating, priceRange, link);
                if (addressM) {
                    render.displayRestDistanceMap(location, addressM);
                } else if (compute.startAddress) {
                    render.displayRestDistanceMap(compute.startAddress, location);
                } else {
                    render.displayRestMap(location);
                }
            } else {
                render.clearRestChoice();
                render.clearMapOutput();
            }
        });

    });

});
