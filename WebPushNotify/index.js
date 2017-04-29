var azure = require('azure-storage');
const webpush = require('web-push');

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

    var query = new azure.TableQuery()
        .select(['title']);
    tableSvc.queryEntities(table, query, null, function(error, result, response) {
        if(error){
            context.log('Error retrieving subscription: ' + JSON.stringify(error));
            context.done();
        }

        for (var i=0; i< result.entries.length; i++) {
                webpush.sendNotification(
                    JSON.parse(result.entries[i].title._),
                    payload,
                    options
                )
                .then(() => {
                    context.log('sent');
                    context.done();
                })
                .catch((err) => {
                    context.log('error: ' + err.body);
                    context.done();
                });
        }
    });
};
