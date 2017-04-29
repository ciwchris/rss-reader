var azure = require('azure-storage');

module.exports = function (context, req) {
    context.log('Subscription function triggered');
    const table = 'subscriptions';

    var tableSvc = azure.createTableService();
    var entGen = azure.TableUtilities.entityGenerator;
    var task = {
      PartitionKey: entGen.String('rssreader'),
      RowKey: entGen.String(req.body.subscription.keys.auth)
    };

    tableSvc.deleteEntity('subscriptions', task, function(error, response){
        if(error){
            context.done(null, {status: 500, body: 'Error removing subscription: ' + JSON.stringify(error)})
        } else {
            context.done(null, {body: 'Subscription removed'});
        }
    });


};
