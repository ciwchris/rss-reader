var feedReader = require('feed-read-parser');
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
            feedReader(config.feeds, function(error, articles) {
                if (error) {
                    context.done(null, {status: 500, body: JSON.stringify(error)})
                } else {
                    async.filter(articles, function(article, callback) {
                        var query = new azure.TableQuery()
                            .where('PartitionKey eq ? && link eq ?', encodeURIComponent(article.feed.source), article.link);
                        tableSvc.queryEntities(config.table, query, null, function(error, result, response) {
                            callback(null, result.entries.length === 0);
                        });
                    },
                    function(error, results) {
                        context.log('inserting: ' + results.length);
                        async.parallel(
                        results.map(article => function (callback) { loadFeedEntries(callback, article); }),
                        function(error, results) {
                            if (error) context.done(null, {status: 500, body: JSON.stringify(error)})
                            else context.done(null, {body: 'Scan completed'})
                        });
                    });
                }
            });
        }
    });

    function loadFeedEntries(callback, article) {
        var entGen = azure.TableUtilities.entityGenerator;
        var task = {
            PartitionKey: entGen.String(encodeURIComponent(article.feed.source)),
            RowKey: entGen.String(999999999999999 - new Date().getTime() + '-' + encodeURIComponent(article.link)),
            title: entGen.String(article.title),
            link: entGen.String(article.link),
            published: entGen.DateTime(article.published),
            feed: entGen.String(article.feed.source)
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
