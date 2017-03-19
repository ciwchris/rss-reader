var azure = require('azure-storage');
var async = require('async');
var config = require('../FeedScan/config');

module.exports = function (context, req) {
    context.log('Querying feeds');

    var tableSvc = azure.createTableService();

    async.parallel(
    config.feeds.map(feed => function (callback) { queryFeed(callback, feed); }),
    function(error, results) {
        if (error) context.done(null, {status: 500, body: JSON.stringify(error)})
        else context.done(null, {body: results})
    });

    function queryFeed(callback, feed) {
        var query = new azure.TableQuery()
            .select(['title','link','feed','published'])
            .top(5)
            .where('PartitionKey eq ?', encodeURIComponent(feed));
        tableSvc.queryEntities(config.table, query, null, function(error, result, response) {
            if(error) throw error;

            var entries = result.entries.map(article => {return {
                    title: article.title._,
                    link: article.link._,
                    feed: article.feed._,
                    published: article.published._
                    //content: article.content._
            }});

            callback(null, entries);
        });

    }
};
