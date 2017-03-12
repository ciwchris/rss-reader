var feed = require("feed-read");
var azure = require('azure-storage');
var async = require('async');
var config = require('./config');

module.exports = function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    context.log('Scanning feeds: ' + timeStamp);

    var tableSvc = azure.createTableService();

    tableSvc.createTableIfNotExists(config.table, function(error, result, response){
        if(error){
            context.log('Error creating table: ' + JSON.stringify(error));
        } else {
            async.parallel(
            config.feeds.map(feed => function (callback) { retrieveFeedContent(callback, feed); }),
            function(error, results) {
                if (error) context.done(null, {status: 500, body: JSON.stringify(error)})
                else context.done(null, {body: 'Scan completed'})
            });
        }
    });

    function retrieveFeedContent(rootCallback, feedUrl) {
        feed(feedUrl, function(error, articles) {
            if (error) {
                context.log('Error loading feed: ' + feedUrl);
                rootCallback(null, []);
            } else {
                async.parallel(
                articles.map(article => function (callback) { loadFeedEntries(callback, feedUrl, article); }),
                function(error, results) {
                    rootCallback(null, null);
                });
            }
        });
    }

    function loadFeedEntries(callback, feed, article) {
        var entGen = azure.TableUtilities.entityGenerator;
        var task = {
            PartitionKey: entGen.String(encodeURIComponent(feed)),
            RowKey: entGen.String(encodeURIComponent(article.link)),
            title: entGen.String(article.title),
            link: entGen.String(article.link),
            //content: entGen.String(article.content)
        };

        tableSvc.insertEntity(config.table, task, function (error, result, response) {
            if(error && error.statusCode !== 409){
                context.log('Error inserting article: ' + JSON.stringify(error));
            }

            callback(null, null);
        });
    }
};
