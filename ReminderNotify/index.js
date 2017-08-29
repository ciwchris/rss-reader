const messages = [
    'Without purpose, we can survive—but we cannot flourish.',
    'I understood that if I wish to understand life and its meaning, I must not live the life of a parasite, but must live a real life,',
    'To hope to understand the meaning of that will one must first perform it by doing what is wanted of us. But if I will not do what is wanted of me, I shall never understand what is wanted of me',
    'I told myself that divine truth cannot be accessible to a separate individual; it is revealed only to the whole assembly of people united by love. To attain truth one must not separate, and in order not to separate one must love and must endure things one may not agree with.',
    'First, arouse in the other person an eager want. He who can do this has the whole world with him. He who cannot walks a lonely way.',
    "That is what Schwab did. But what do average people do? The exact opposite. If they don't like a thing, they bawl out their subordinates; if they do like it, they say nothing.",
    "If out of reading this book you get just one thing—an increased tendency to think always in terms of other people's point of view, and see things from their angle—if",
    "You can make more friends in two months by becoming interested in other people than you can in two years by trying to get other people interested in you.",
    "It is the individual who is not interested in his fellow men who has the greatest difficulties in life and provides the greatest injury to others.",
    "Nine times out of ten, an argument ends with each of the contestants more firmly convinced than ever that he is absolutely right.",
    "A man convinced against his will Is of the same opinion still.",
    "If you are going to prove anything, don’t let anybody know it. Do it so subtly, so adroitly, that no one will feel that you are doing it.",
    "If we know we are going to be rebuked anyhow, isn't it far better to beat the other person to it and do it ourselves? Isn't it much easier to listen to self-criticism than to bear condemnation from alien lips?",
    "Keep emphasizing, if possible, that you are both striving for the same end and that your only difference is one of method and not of purpose.",
    "Don't you have much more faith in ideas that you discover for yourself than in ideas that are handed to you on a silver platter?",
    "If, as a result of reading this book, you get only one thing—an increased tendency to think always in terms of the other person's point of view, and see things from that person's angle as well as your own—if",
    "I don’t blame you one iota for feeling as you do. If I were you I would undoubtedly feel just as you do.",
    "Asking questions not only makes an order more palatable; it often stimulates the creativity of the persons whom you ask."
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
    var randomMessageIndex = Math.floor(Math.random() * (messages.length));

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
