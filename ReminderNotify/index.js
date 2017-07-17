const messages = [
    'Without purpose, we can survive—but we cannot flourish.',
    'I understood that if I wish to understand life and its meaning, I must not live the life of a parasite, but must live a real life,',
    'To hope to understand the meaning of that will one must first perform it by doing what is wanted of us. But if I will not do what is wanted of me, I shall never understand what is wanted of me',
    'I told myself that divine truth cannot be accessible to a separate individual; it is revealed only to the whole assembly of people united by love. To attain truth one must not separate, and in order not to separate one must love and must endure things one may not agree with.'
];

const azure = require('azure-storage');
const webpush = require('web-push');
const async = require('async');

module.exports = function (context) {
    context.log('Reminder function triggered');
    const table = 'subscriptions';

    var tableSvc = azure.createTableService();

    const options = {
        vapidDetails: {
            subject: 'https://rss-reader.azurewebsites.net/api/WebPushNotify',
            publicKey: 'BGPwmeJvcajyK7v-H3_tdESj9VwLpbO_I4oYrI4rnPlWERU2LGtrlD25oxGZ7vf0D8rJO4M0crHQ2SbhvCelahs',
            privateKey: '1t8vQEtqkmy34wtmede8yt8wlMPfOcISj9QZBM-cJmU'
        },
        // 1 day in seconds
        TTL: 60 * 60 * 24
    };

    // The do not use example from: https://www.npmjs.com/package/random-js
    var randomMessageIndex = Math.floor(Math.random() * (messages.length +1));

    const payload = {"notification": {
        "title": "Reminder",
        "body": messages[randomMessageIndex],
        "icon": "https://ciwchris.github.io/rss-reader-ng-client/assets/images/icons/notification-bell-192.png",
        "badge": "https://ciwchris.github.io/rss-reader-ng-client/assets/images/icons/notification-bell-192.png",
        "requireInteraction": true}
    };

    var query = new azure.TableQuery().select(['subscription']);
    tableSvc.queryEntities(table, query, null, function(error, result, response) {
        if(error){
            context.done(null, {status: 500, body: 'Error retrieving subscription: ' + JSON.stringify(error)})
        }

        async.parallel(
        result.entries.map(entry => function (callback) {
            webpush.sendNotification(
                JSON.parse(entry.subscription._),
                JSON.stringify(payload),
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
