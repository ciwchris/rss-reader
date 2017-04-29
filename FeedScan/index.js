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
                        if (error) context.done(null, {status: 500, body: JSON.stringify(error)})
                        else {
                            var resultTitles = results.map(r => r.link);
                            var filteredArticles = articles.filter(article => {
                                return resultTitles.includes(article.link);
                            });

                            if (filteredArticles.length > 0) {
                                context.bindings.rssQueueItem = {
                                    message: 'New RSS entries',
                                    feed: filteredArticles[0].feed.name
                                };
                            }

                            context.log('inserting: ' + filteredArticles.length);
                            for (var i=0; i < filteredArticles.length; i++) {
                                loadFeedEntries(i * 100, filteredArticles[i]);
                            }
                            context.done(null, {body: 'Scan completed'});
                        }
                    });
                }
            });
        }
    });

    function loadFeedEntries(delay, article) {
        //context.log((999999999999999 - new Date().getTime() + delay) + ':' + article.title);
        var entGen = azure.TableUtilities.entityGenerator;
        var task = {
            PartitionKey: entGen.String(encodeURIComponent(article.feed.source)),
            RowKey: entGen.String((999999999999999 - new Date().getTime() + delay) + ''),
            title: entGen.String(article.title),
            link: entGen.String(article.link),
            published: entGen.DateTime(article.published),
            feed: entGen.String(article.feed.name)
            //content: entGen.String(article.content)
        };

        tableSvc.insertEntity(config.table, task, function (error, result, response) {
            if(error && error.statusCode !== 409){
                context.log('Error inserting article: ' + JSON.stringify(error));
            }
        });
    }
};
