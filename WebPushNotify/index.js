const azure = require('azure-storage');
const webpush = require('web-push');
const async = require('async');

module.exports = function (context, req) {
    context.log('Notify function triggered');
    const table = 'subscriptions';

    var tableSvc = azure.createTableService();

    const options = {
        vapidDetails: {
            subject: 'https://rss-reader.azurewebsites.net/api/WebPushSubscribe',
            publicKey: 'BGPwmeJvcajyK7v-H3_tdESj9VwLpbO_I4oYrI4rnPlWERU2LGtrlD25oxGZ7vf0D8rJO4M0crHQ2SbhvCelahs',
            privateKey: '1t8vQEtqkmy34wtmede8yt8wlMPfOcISj9QZBM-cJmU'
        },
        // 1 hour in seconds
        TTL: 60 * 60
    };

    const payload = JSON.stringify({"notification": {"body":"New entry", "title":"RSS reader"}});

    var query = new azure.TableQuery().select(['subscription']);
    tableSvc.queryEntities(table, query, null, function(error, result, response) {
        if(error){
            context.done(null, {status: 500, body: 'Error retrieving subscription: ' + JSON.stringify(error)})
        }

        /*
        for (var i=0; i < result.entries.length; i++) {
            webpush.sendNotification(
                JSON.parse(result.entries[i].subscription._),
                payload,
                options
            )
            .then(() => {
                context.done(null, {body: 'sent'})
            })
            .catch((err) => {
                context.done(null, {status: 500, body: 'error: ' + err.body})
            });
        }
        */
        async.parallel(
        result.entries.map(entry => function (callback) {
            webpush.sendNotification(
                JSON.parse(entry.subscription._),
                payload,
                options
            )
            .then(() => {
                callback(null, 'sent');
            });
        }),
        function(error, results) {
            if (error) {
                context.done(null, {status: 500, body: 'error: ' + err.body})
            } else {
                context.done(null, {body: 'Sent results: ' + JSON.stringify(results)})
            }
        });
    });
};
