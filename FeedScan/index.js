var feedReader = require('feed-read-parser');
var azure = require('azure-storage');
var async = require('async');
var config = require('./config');

module.exports = function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    context.log('Scanning feeds: ' + timeStamp);

    var tableSvc = azure.createTableService();

    function output(list) {
        list.forEach(l => context.log(l.title));
    }

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
                            context.log('inserting: ' + filteredArticles.length);

                            for (var i=filteredArticles.length -1; i >= 0; i--) {
                                loadFeedEntries(i * 10, filteredArticles[i]);
                            }
/*
                            results.reverse().forEach(article => {
                                context.log(article.title + ' ' + article.published);
                                loadFeedEntries(article);
                            }),
                            */
                           setTimeout(() => { context.done(null, {body: 'Scan completed'});}, 20000);
                        }
                    });
                }
            });
        }
    });

    function loadFeedEntries(delay, article) {
        var entGen = azure.TableUtilities.entityGenerator;
        var task = {
            PartitionKey: entGen.String(encodeURIComponent(article.feed.source)),
            RowKey: entGen.String((999999999999999 - new Date().getTime() - delay) + '-' + encodeURIComponent(article.link)),
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
